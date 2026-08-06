import { Router } from "express";
import { query, withTransaction } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();

/** Load active catalog items by id, returning a map. Throws if any missing. */
async function loadItems(client, ids) {
  const r = await client.query(
    `SELECT ci.id, ci.type, ci.name, ci.price_cents, ci.active, inv.stock_qty
     FROM catalog_items ci
     LEFT JOIN inventory inv ON inv.catalog_item_id = ci.id
     WHERE ci.id = ANY($1)`,
    [ids]
  );
  const map = new Map(r.rows.map((row) => [row.id, row]));
  return map;
}

/**
 * Place an order (online, by a logged-in customer).
 * body: { type, items:[{catalog_item_id, qty}], address_id?, scheduled_at?, payment_mode?, note? }
 */
router.post("/", requireAuth, async (req, res) => {
  const { type, items, address_id, scheduled_at, payment_mode, note } = req.body || {};
  if (!type || !["service", "product"].includes(type)) {
    return res.status(400).json({ error: "type must be 'service' or 'product'" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items required" });
  }
  if (type === "service" && !scheduled_at) {
    return res.status(400).json({ error: "scheduled_at required for a service booking" });
  }

  try {
    const order = await withTransaction(async (c) => {
      const ids = items.map((i) => Number(i.catalog_item_id));
      const map = await loadItems(c, ids);

      let total = 0;
      const lines = [];
      for (const i of items) {
        const item = map.get(Number(i.catalog_item_id));
        if (!item || !item.active) {
          throw Object.assign(new Error("Item unavailable"), { status: 400 });
        }
        if (item.type !== type) {
          throw Object.assign(new Error("Mixed item types in one order"), { status: 400 });
        }
        const qty = type === "service" ? 1 : Math.max(1, Number(i.qty) || 1);
        if (item.type === "product") {
          if (item.stock_qty == null || item.stock_qty < qty) {
            throw Object.assign(new Error(`Out of stock: ${item.name}`), { status: 409 });
          }
        }
        const lineTotal = item.price_cents * qty;
        total += lineTotal;
        lines.push({ item, qty, lineTotal });
      }

      const status = type === "service" ? "requested" : "placed";
      const orderRes = await c.query(
        `INSERT INTO orders (customer_id, channel, type, status, address_id, scheduled_at, total_cents, payment_mode, customer_note)
         VALUES ($1,'online',$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          req.user.id, type, status, address_id || null,
          scheduled_at || null, total, payment_mode || "online", note || null,
        ]
      );
      const orderId = orderRes.rows[0].id;

      for (const { item, qty, lineTotal } of lines) {
        await c.query(
          `INSERT INTO order_items (order_id, catalog_item_id, name_snapshot, unit_price_cents, qty, line_total_cents)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [orderId, item.id, item.name, item.price_cents, qty, lineTotal]
        );
        if (item.type === "product") {
          await c.query(
            "UPDATE inventory SET stock_qty = stock_qty - $1 WHERE catalog_item_id = $2",
            [qty, item.id]
          );
        }
      }
      return { id: orderId, total_cents: total, status };
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/** Current customer's order history, newest first, with line items. */
router.get("/mine", requireAuth, async (req, res) => {
  const orders = await query(
    `SELECT id, channel, type, status, total_cents, scheduled_at, created_at
     FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  const ids = orders.rows.map((o) => o.id);
  let itemsByOrder = {};
  if (ids.length) {
    const its = await query(
      `SELECT oi.order_id, oi.catalog_item_id, oi.name_snapshot, oi.qty, oi.unit_price_cents,
              ci.slug, ci.type, ci.active
       FROM order_items oi
       LEFT JOIN catalog_items ci ON ci.id = oi.catalog_item_id
       WHERE oi.order_id = ANY($1)`,
      [ids]
    );
    for (const it of its.rows) {
      (itemsByOrder[it.order_id] ||= []).push(it);
    }
  }
  res.json(orders.rows.map((o) => ({ ...o, items: itemsByOrder[o.id] || [] })));
});

/**
 * "Order again" — distinct items from the customer's past orders,
 * most recently ordered first, still active.
 */
router.get("/reorder", requireAuth, async (req, res) => {
  const r = await query(
    `SELECT DISTINCT ON (ci.id)
            ci.id, ci.type, ci.name, ci.slug, ci.price_cents, ci.duration_min,
            ci.image_url, ci.rating, inv.stock_qty, o.created_at AS last_ordered
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN catalog_items ci ON ci.id = oi.catalog_item_id AND ci.active = TRUE
     LEFT JOIN inventory inv ON inv.catalog_item_id = ci.id
     WHERE o.customer_id = $1
     ORDER BY ci.id, o.created_at DESC`,
    [req.user.id]
  );
  const rows = r.rows.sort((a, b) => new Date(b.last_ordered) - new Date(a.last_ordered));
  res.json(rows);
});

export default router;
