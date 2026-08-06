import { Router } from "express";
import { query } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/addresses", async (req, res) => {
  const r = await query(
    "SELECT id, label, line1, city, pincode FROM addresses WHERE user_id = $1 ORDER BY id",
    [req.user.id]
  );
  res.json(r.rows);
});

router.post("/addresses", async (req, res) => {
  const { label, line1, city, pincode } = req.body || {};
  if (!line1 || !city || !pincode) {
    return res.status(400).json({ error: "line1, city and pincode are required" });
  }
  const r = await query(
    `INSERT INTO addresses (user_id, label, line1, city, pincode)
     VALUES ($1,$2,$3,$4,$5) RETURNING id, label, line1, city, pincode`,
    [req.user.id, label || "Home", line1, city, pincode]
  );
  res.status(201).json(r.rows[0]);
});

router.get("/favorites", async (req, res) => {
  const r = await query(
    `SELECT ci.id, ci.type, ci.name, ci.slug, ci.price_cents, ci.image_url, ci.rating
     FROM favorites f JOIN catalog_items ci ON ci.id = f.catalog_item_id
     WHERE f.user_id = $1 AND ci.active = TRUE`,
    [req.user.id]
  );
  res.json(r.rows);
});

router.put("/favorites/:itemId", async (req, res) => {
  await query(
    `INSERT INTO favorites (user_id, catalog_item_id) VALUES ($1,$2)
     ON CONFLICT DO NOTHING`,
    [req.user.id, Number(req.params.itemId)]
  );
  res.json({ ok: true });
});

router.delete("/favorites/:itemId", async (req, res) => {
  await query("DELETE FROM favorites WHERE user_id = $1 AND catalog_item_id = $2", [
    req.user.id,
    Number(req.params.itemId),
  ]);
  res.json({ ok: true });
});

export default router;
