import express from "express";
import cors from "cors";
import "dotenv/config";

import { attachUser } from "./lib/auth.js";
import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import meRoutes from "./routes/me.js";

const app = express();

const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: origins }));
app.use(express.json());
app.use(attachUser);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/me", meRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`[api] listening on http://localhost:${port}`));
