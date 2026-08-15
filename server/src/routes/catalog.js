import { Router } from "express";
import { query } from "../lib/db.js";

const router = Router();

router.get("/categories", async (_req, res) => {
  const r = await query("SELECT id, name, slug, kind, icon FROM categories ORDER BY id");
  res.json(r.rows);
});

/**
 * Unified search over services + products.
 * Query params: q (text), type (service|product), category (slug),
 * sort (relevance|price_asc|price_desc|rating), limit.
 */
router.get("/search", async (req, res) => {
  const { q, type, category, sort } = req.query;
  const where = ["ci.active = TRUE"];
  const params = [];

  if (["service", "product", "financial"].includes(type)) {
    params.push(type);
    where.push(`ci.type = $${params.length}`);
  }
  if (category) {
    params.push(category);
    where.push(`c.slug = $${params.length}`);
  }

  let rankSelect = "0 AS rank";
  let orderBy = "ci.rating DESC, ci.id ASC";

  if (q && q.trim()) {
    const term = q.trim();
    params.push(term);
    const qParam = `$${params.length}`;
    // Full-text match OR fuzzy trigram similarity (typo tolerance).
    where.push(
      `(ci.search_tsv @@ plainto_tsquery('english', ${qParam})
        OR ci.name ILIKE '%' || ${qParam} || '%'
        OR c.name ILIKE '%' || ${qParam} || '%'
        OR pr.name ILIKE '%' || ${qParam} || '%'
        OR similarity(ci.name, ${qParam}) > 0.2
        OR similarity(coalesce(c.name,''), ${qParam}) > 0.3
        OR similarity(coalesce(pr.name,''), ${qParam}) > 0.3)`
    );
    rankSelect = `GREATEST(
        ts_rank(ci.search_tsv, plainto_tsquery('english', ${qParam})),
        similarity(ci.name, ${qParam}),
        similarity(coalesce(c.name,''), ${qParam}),
        similarity(coalesce(pr.name,''), ${qParam})
      ) AS rank`;
    orderBy = "rank DESC, ci.rating DESC";
  }

  if (sort === "price_asc") orderBy = "ci.price_cents ASC";
  else if (sort === "price_desc") orderBy = "ci.price_cents DESC";
  else if (sort === "rating") orderBy = "ci.rating DESC";

  const sql = `
    SELECT ci.id, ci.type, ci.name, ci.slug, ci.description, ci.price_cents,
           ci.duration_min, ci.image_url, ci.rating,
           c.name AS category_name, c.slug AS category_slug,
           inv.stock_qty,
           fp.subtype, fp.interest_rate_min, fp.annual_fee_cents, fp.premium_from_cents,
           fp.coverage_cents,
           pr.name AS provider_name, pr.slug AS provider_slug,
           ${rankSelect}
    FROM catalog_items ci
    LEFT JOIN categories c ON c.id = ci.category_id
    LEFT JOIN inventory inv ON inv.catalog_item_id = ci.id
    LEFT JOIN financial_products fp ON fp.catalog_item_id = ci.id
    LEFT JOIN providers pr ON pr.id = fp.provider_id
    WHERE ${where.join(" AND ")}
    ORDER BY ${orderBy}
    LIMIT 60`;
  const r = await query(sql, params);
  res.json(r.rows);
});

/** Lightweight autocomplete suggestions for the search bar. */
router.get("/suggest", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);
  const r = await query(
    `SELECT ci.id, ci.name, ci.type, ci.slug
     FROM catalog_items ci
     LEFT JOIN categories c ON c.id = ci.category_id
     LEFT JOIN financial_products fp ON fp.catalog_item_id = ci.id
     LEFT JOIN providers pr ON pr.id = fp.provider_id
     WHERE ci.active = TRUE
       AND (ci.name ILIKE '%' || $1 || '%'
            OR c.name ILIKE '%' || $1 || '%'
            OR pr.name ILIKE '%' || $1 || '%'
            OR similarity(ci.name, $1) > 0.2
            OR similarity(coalesce(c.name,''), $1) > 0.3
            OR similarity(coalesce(pr.name,''), $1) > 0.3)
     ORDER BY GREATEST(
              similarity(ci.name, $1),
              similarity(coalesce(c.name,''), $1),
              similarity(coalesce(pr.name,''), $1)) DESC, ci.name ASC
     LIMIT 8`,
    [q]
  );
  res.json(r.rows);
});

router.get("/items/:slug", async (req, res) => {
  const r = await query(
    `SELECT ci.*, c.name AS category_name, c.slug AS category_slug, inv.stock_qty,
            fp.subtype
     FROM catalog_items ci
     LEFT JOIN categories c ON c.id = ci.category_id
     LEFT JOIN inventory inv ON inv.catalog_item_id = ci.id
     LEFT JOIN financial_products fp ON fp.catalog_item_id = ci.id
     WHERE ci.slug = $1`,
    [req.params.slug]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json(r.rows[0]);
});

export default router;
