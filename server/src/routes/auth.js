import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../lib/db.js";
import { signToken, requireAuth } from "../lib/auth.js";

const router = Router();

// Register a new customer (phone + password). OTP can replace passwords later.
router.post("/register", async (req, res) => {
  const { name, phone, password } = req.body || {};
  if (!name || !phone || !password) {
    return res.status(400).json({ error: "name, phone and password are required" });
  }
  const existing = await query("SELECT id FROM users WHERE phone = $1", [phone]);
  if (existing.rowCount > 0) {
    return res.status(409).json({ error: "Phone already registered" });
  }
  const hash = await bcrypt.hash(password, 10);
  const r = await query(
    `INSERT INTO users (name, phone, password_hash, role)
     VALUES ($1,$2,$3,'customer') RETURNING id, name, phone, role`,
    [name, phone, hash]
  );
  const user = r.rows[0];
  res.status(201).json({ token: signToken(user), user });
});

router.post("/login", async (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) {
    return res.status(400).json({ error: "phone and password are required" });
  }
  const r = await query(
    "SELECT id, name, phone, role, password_hash FROM users WHERE phone = $1",
    [phone]
  );
  const user = r.rows[0];
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: "Invalid phone or password" });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid phone or password" });
  delete user.password_hash;
  res.json({ token: signToken(user), user });
});

router.get("/me", requireAuth, async (req, res) => {
  const r = await query(
    "SELECT id, name, phone, role FROM users WHERE id = $1",
    [req.user.id]
  );
  res.json({ user: r.rows[0] || null });
});

export default router;
