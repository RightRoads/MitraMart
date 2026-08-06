import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./lib/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const sql = await readFile(join(__dirname, "schema.sql"), "utf8");
  console.log("[migrate] applying schema...");
  await pool.query(sql);
  console.log("[migrate] done.");
  await pool.end();
}

main().catch((err) => {
  console.error("[migrate] failed:", err.message);
  process.exit(1);
});
