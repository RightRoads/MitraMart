import { Router } from "express";
import { query, withTransaction } from "../lib/db.js";
import { requireRole } from "../lib/auth.js";

const router = Router();

const staff = requireRole("admin", "staff");
const adminOnly = requireRole("admin");

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** List all catalog items (including inactive) for management. */
router.get("/items", staff, async (_req, res) => {
  const r = await query(
    `SELECT ci.*, c.name AS category_name, inv.stock_qty
     FROM catalog_items ci
     LEFT JOIN categories c ON c.id = ci.category_id
     LEFT JOIN inventory inv ON inv.catalog_item_id = ci.id
     ORDER BY ci.type, ci.name`
  );
  res.json(r.rows);
});

/** Add a new service or product. */
router.post("/items", adminOnly, async (req, res) => {
  const { type, name, description, category_id, price_rupees, duration_min, image_url, stock_qty } =
    req.body || {};
  if (!type || !["service", "product"].includes(type)) {
    return res.status(400).json({ error: "type must be 'service' or 'product'" });
  }
  if (!name) return res.status(400).json({ error: "name required" });

  try {
    const created = await withTransaction(async (c) => {
      const r = await c.query(
        `INSERT INTO catalog_items (type, name, slug, description, category_id, price_cents, duration_min, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          type, name, slugify(name) + "-" + Date.now().toString(36),
          description || "", category_id || null,
          Math.round((Number(price_rupees) || 0) * 100),
          type === "service" ? duration_min || null : null,
          image_url || null,
        ]
      );
      const item = r.rows[0];
      if (type === "product") {
        await c.query(
          "INSERT INTO inventory (catalog_item_id, stock_qty) VALUES ($1,$2)",
          [item.id, Math.max(0, Number(stock_qty) || 0)]
        );
      }
      return item;
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Update fields (name/description/price/duration/category/image). */
router.patch("/items/:id", adminOnly, async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, category_id, price_rupees, duration_min, image_url } = req.body || {};
  const sets = [];
  const params = [];
  const set = (col, val) => {
    params.push(val);
    sets.push(`${col} = $${params.length}`);
  };
  if (name !== undefined) set("name", name);
  if (description !== undefined) set("description", description);
  if (category_id !== undefined) set("category_id", category_id || null);
  if (price_rupees !== undefined) set("price_cents", Math.round(Number(price_rupees) * 100));
  if (duration_min !== undefined) set("duration_min", duration_min || null);
  if (image_url !== undefined) set("image_url", image_url || null);
  if (!sets.length) return res.status(400).json({ error: "nothing to update" });
  params.push(id);
  const r = await query(
    `UPDATE catalog_items SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (r.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json(r.rows[0]);
});

/** Enable / disable an item. */
router.patch("/items/:id/active", adminOnly, async (req, res) => {
  const { active } = req.body || {};
  const r = await query(
    "UPDATE catalog_items SET active = $1 WHERE id = $2 RETURNING id, name, active",
    [!!active, Number(req.params.id)]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json(r.rows[0]);
});

/** Set product stock. */
router.put("/items/:id/stock", staff, async (req, res) => {
  const { stock_qty } = req.body || {};
  const r = await query(
    `INSERT INTO inventory (catalog_item_id, stock_qty) VALUES ($1,$2)
     ON CONFLICT (catalog_item_id) DO UPDATE SET stock_qty = EXCLUDED.stock_qty
     RETURNING catalog_item_id, stock_qty`,
    [Number(req.params.id), Math.max(0, Number(stock_qty) || 0)]
  );
  res.json(r.rows[0]);
});

/** List orders across both channels for management. */
router.get("/orders", staff, async (req, res) => {
  const { channel } = req.query;
  const params = [];
  let where = "";
  if (channel === "online" || channel === "offline") {
    params.push(channel);
    where = "WHERE o.channel = $1";
  }
  const r = await query(
    `SELECT o.id, o.channel, o.type, o.status, o.total_cents, o.payment_mode,
            o.scheduled_at, o.created_at, u.name AS customer_name, u.phone AS customer_phone
     FROM orders o
     LEFT JOIN users u ON u.id = o.customer_id
     ${where}
     ORDER BY o.created_at DESC LIMIT 100`,
    params
  );
  res.json(r.rows);
});

/** Advance an order's status. */
router.patch("/orders/:id/status", staff, async (req, res) => {
  const { status } = req.body || {};
  const allowed = [
    "requested", "confirmed", "in_progress", "completed", "cancelled",
    "placed", "packed", "out_for_delivery", "delivered",
  ];
  if (!allowed.includes(status)) return res.status(400).json({ error: "invalid status" });
  const r = await query(
    "UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status",
    [status, Number(req.params.id)]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json(r.rows[0]);
});

/**
 * Record an in-store (offline) product sale. Decrements the SAME inventory
 * as online orders so stock never drifts.
 * body: { items:[{catalog_item_id, qty}], payment_mode, customer_phone? }
 */
router.post("/offline-sale", staff, async (req, res) => {
  const { items, payment_mode, customer_phone } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items required" });
  }
  try {
    const result = await withTransaction(async (c) => {
      let customerId = null;
      if (customer_phone) {
        const u = await c.query("SELECT id FROM users WHERE phone = $1", [customer_phone]);
        customerId = u.rows[0]?.id || null;
      }
      const ids = items.map((i) => Number(i.catalog_item_id));
      const found = await c.query(
        `SELECT ci.id, ci.name, ci.type, ci.price_cents, ci.active, inv.stock_qty
         FROM catalog_items ci LEFT JOIN inventory inv ON inv.catalog_item_id = ci.id
         WHERE ci.id = ANY($1)`,
        [ids]
      );
      const map = new Map(found.rows.map((r) => [r.id, r]));

      let total = 0;
      const lines = [];
      for (const i of items) {
        const item = map.get(Number(i.catalog_item_id));
        if (!item || !item.active || item.type !== "product") {
          throw Object.assign(new Error("Only active products can be sold offline"), { status: 400 });
        }
        const qty = Math.max(1, Number(i.qty) || 1);
        if (item.stock_qty == null || item.stock_qty < qty) {
          throw Object.assign(new Error(`Out of stock: ${item.name}`), { status: 409 });
        }
        const lineTotal = item.price_cents * qty;
        total += lineTotal;
        lines.push({ item, qty, lineTotal });
      }

      const orderRes = await c.query(
        `INSERT INTO orders (customer_id, channel, type, status, total_cents, payment_mode, created_by)
         VALUES ($1,'offline','product','completed',$2,$3,$4) RETURNING id`,
        [customerId, total, payment_mode || "cash", req.user.id]
      );
      const orderId = orderRes.rows[0].id;
      for (const { item, qty, lineTotal } of lines) {
        await c.query(
          `INSERT INTO order_items (order_id, catalog_item_id, name_snapshot, unit_price_cents, qty, line_total_cents)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [orderId, item.id, item.name, item.price_cents, qty, lineTotal]
        );
        await c.query(
          "UPDATE inventory SET stock_qty = stock_qty - $1 WHERE catalog_item_id = $2",
          [qty, item.id]
        );
      }
      return { id: orderId, total_cents: total };
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

/** Simple combined dashboard stats (online + offline). */
router.get("/stats", staff, async (_req, res) => {
  const [revenue, byChannel, lowStock] = await Promise.all([
    query(`SELECT COALESCE(SUM(total_cents),0) AS total_cents, COUNT(*) AS orders
            FROM orders WHERE status <> 'cancelled'`),
    query(`SELECT channel, COUNT(*) AS orders, COALESCE(SUM(total_cents),0) AS total_cents
            FROM orders WHERE status <> 'cancelled' GROUP BY channel`),
    query(`SELECT ci.name, inv.stock_qty FROM inventory inv
            JOIN catalog_items ci ON ci.id = inv.catalog_item_id
            WHERE inv.stock_qty <= inv.low_stock_at ORDER BY inv.stock_qty ASC`),
  ]);
  res.json({
    totals: revenue.rows[0],
    by_channel: byChannel.rows,
    low_stock: lowStock.rows,
  });
});

export default router;
