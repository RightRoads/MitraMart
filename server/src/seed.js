import bcrypt from "bcryptjs";
import { pool, withTransaction } from "./lib/db.js";

const categories = [
  { name: "Cleaning", slug: "cleaning", kind: "service", icon: "🧹" },
  { name: "Plumbing", slug: "plumbing", kind: "service", icon: "🔧" },
  { name: "Painting", slug: "painting", kind: "service", icon: "🎨" },
  { name: "Appliance Repair", slug: "appliance-repair", kind: "service", icon: "🛠️" },
  { name: "Salon at Home", slug: "salon-at-home", kind: "service", icon: "💇" },
  { name: "Home Supplies", slug: "home-supplies", kind: "product", icon: "🧴" },
  { name: "Spare Parts", slug: "spare-parts", kind: "product", icon: "⚙️" },
];

// [type, name, description, categorySlug, priceRupees, durationMin, stock]
const items = [
  ["service", "Deep Home Cleaning", "Full-home deep cleaning by trained professionals.", "cleaning", 1499, 180, null],
  ["service", "Bathroom Cleaning", "Sparkling bathroom cleaning and sanitisation.", "cleaning", 499, 60, null],
  ["service", "Sofa & Carpet Cleaning", "Shampoo cleaning for sofas and carpets.", "cleaning", 899, 90, null],
  ["service", "Tap & Pipe Repair", "Fix leaking taps, pipes and low water pressure.", "plumbing", 299, 45, null],
  ["service", "Toilet Installation", "Installation of western/Indian toilet units.", "plumbing", 1200, 120, null],
  ["service", "Interior Wall Painting", "Per-room interior painting with premium emulsion.", "painting", 2999, 480, null],
  ["service", "Fridge Repair", "Diagnosis and repair of refrigerators.", "appliance-repair", 399, 60, null],
  ["service", "Gas Stove Service", "Cleaning and servicing of gas stoves.", "appliance-repair", 349, 45, null],
  ["service", "AC Service", "Split/window AC service and gas top-up check.", "appliance-repair", 599, 60, null],
  ["service", "Men's Haircut at Home", "Professional haircut in the comfort of your home.", "salon-at-home", 249, 30, null],
  ["service", "Facial at Home", "Relaxing facial with premium products.", "salon-at-home", 799, 60, null],
  ["product", "All-Purpose Cleaner 1L", "Multi-surface cleaning liquid, 1 litre.", "home-supplies", 199, null, 120],
  ["product", "Microfiber Cloth (Pack of 5)", "Lint-free microfiber cleaning cloths.", "home-supplies", 249, null, 80],
  ["product", "Toilet Cleaner 500ml", "Powerful toilet cleaning liquid.", "home-supplies", 99, null, 200],
  ["product", "Dishwash Gel 750ml", "Lemon dishwash gel, tough on grease.", "home-supplies", 149, null, 150],
  ["product", "Tap Aerator", "Water-saving tap aerator, universal fit.", "spare-parts", 179, null, 60],
  ["product", "Gas Stove Burner", "Replacement brass burner for gas stoves.", "spare-parts", 349, null, 3],
  ["product", "Fridge Door Gasket", "Universal magnetic door gasket for fridges.", "spare-parts", 499, null, 25],
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  await withTransaction(async (c) => {
    console.log("[seed] users...");
    const adminHash = await bcrypt.hash("admin123", 10);
    const custHash = await bcrypt.hash("test123", 10);
    await c.query(
      `INSERT INTO users (name, phone, password_hash, role) VALUES
        ('Admin', '9000000001', $1, 'admin'),
        ('Store Staff', '9000000002', $1, 'staff'),
        ('Asha Customer', '9000000003', $2, 'customer')
       ON CONFLICT (phone) DO NOTHING`,
      [adminHash, custHash]
    );

    console.log("[seed] categories...");
    const catId = {};
    for (const cat of categories) {
      const r = await c.query(
        `INSERT INTO categories (name, slug, kind, icon) VALUES ($1,$2,$3,$4)
         RETURNING id`,
        [cat.name, cat.slug, cat.kind, cat.icon]
      );
      catId[cat.slug] = r.rows[0].id;
    }

    console.log("[seed] catalog items + inventory...");
    for (const [type, name, desc, cslug, rupees, dur, stock] of items) {
      const r = await c.query(
        `INSERT INTO catalog_items (type, name, slug, description, category_id, price_cents, duration_min)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [type, name, slugify(name), desc, catId[cslug], rupees * 100, dur]
      );
      if (type === "product") {
        await c.query(
          `INSERT INTO inventory (catalog_item_id, stock_qty) VALUES ($1,$2)`,
          [r.rows[0].id, stock]
        );
      }
    }
  });
  console.log("[seed] done.");
  console.log("  Admin login:    phone 9000000001 / password admin123");
  console.log("  Staff login:    phone 9000000002 / password admin123");
  console.log("  Customer login: phone 9000000003 / password test123");
  await pool.end();
}

main().catch((err) => {
  console.error("[seed] failed:", err.message);
  process.exit(1);
});
