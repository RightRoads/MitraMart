import { Router } from "express";
import { query } from "../lib/db.js";

const router = Router();

const SUBTYPES = ["insurance", "loan", "credit_card"];

/** Columns every financial product endpoint returns, joined to catalog + provider. */
const SELECT_PRODUCT = `
  SELECT ci.id, ci.name, ci.slug, ci.description, ci.price_cents, ci.image_url,
         ci.rating, ci.active,
         c.name AS category_name, c.slug AS category_slug,
         p.name AS provider_name, p.slug AS provider_slug, p.kind AS provider_kind,
         p.logo_url AS provider_logo_url,
         fp.subtype, fp.interest_rate_min, fp.interest_rate_max,
         fp.tenure_min_months, fp.tenure_max_months,
         fp.amount_min_cents, fp.amount_max_cents, fp.processing_fee_pct,
         fp.joining_fee_cents, fp.annual_fee_cents,
         fp.premium_from_cents, fp.coverage_cents, fp.policy_term_years,
         fp.min_age, fp.max_age, fp.min_income_cents, fp.min_credit_score,
         fp.features, fp.key_benefits, fp.exclusions
  FROM catalog_items ci
  JOIN financial_products fp ON fp.catalog_item_id = ci.id
  JOIN providers p ON p.id = fp.provider_id
  LEFT JOIN categories c ON c.id = ci.category_id`;

/**
 * Banks / NBFCs / insurers that have at least one active product, for filter chips.
 * Pass ?subtype= to only list providers offering that kind of product, so the
 * Loans page doesn't offer insurers in its provider filter.
 */
router.get("/providers", async (req, res) => {
  const { subtype } = req.query;
  if (subtype && !SUBTYPES.includes(subtype)) {
    return res.status(400).json({ error: `subtype must be one of ${SUBTYPES.join(", ")}` });
  }
  const params = subtype ? [subtype] : [];
  const subtypeFilter = subtype ? "AND fp.subtype = $1" : "";
  const r = await query(
    `SELECT p.id, p.name, p.slug, p.kind, p.logo_url,
            COUNT(*) AS product_count
     FROM providers p
     JOIN financial_products fp ON fp.provider_id = p.id
     JOIN catalog_items ci ON ci.id = fp.catalog_item_id AND ci.active = TRUE
     WHERE p.active = TRUE ${subtypeFilter}
     GROUP BY p.id
     ORDER BY p.name`,
    params
  );
  res.json(r.rows);
});

/**
 * List / filter financial products.
 * Query params: subtype, provider (slug), q,
 *   max_rate, max_annual_fee, min_coverage, max_premium,
 *   amount (loan amount that must fall inside the product's range),
 *   sort (rate_asc|fee_asc|coverage_desc|premium_asc|rating), limit.
 */
router.get("/products", async (req, res) => {
  const {
    subtype, provider, q, max_rate, max_annual_fee,
    min_coverage, max_premium, amount, sort,
  } = req.query;

  const where = ["ci.active = TRUE"];
  const params = [];

  if (subtype) {
    if (!SUBTYPES.includes(subtype)) {
      return res.status(400).json({ error: `subtype must be one of ${SUBTYPES.join(", ")}` });
    }
    params.push(subtype);
    where.push(`fp.subtype = $${params.length}`);
  }
  if (provider) {
    params.push(provider);
    where.push(`p.slug = $${params.length}`);
  }
  if (q && q.trim()) {
    params.push(q.trim());
    const t = `$${params.length}`;
    where.push(
      `(ci.search_tsv @@ plainto_tsquery('english', ${t})
        OR ci.name ILIKE '%' || ${t} || '%'
        OR p.name ILIKE '%' || ${t} || '%'
        OR similarity(ci.name, ${t}) > 0.2
        OR similarity(p.name, ${t}) > 0.3)`
    );
  }
  if (max_rate) {
    params.push(Number(max_rate));
    where.push(`fp.interest_rate_min <= $${params.length}`);
  }
  if (max_annual_fee) {
    params.push(Math.round(Number(max_annual_fee) * 100));
    where.push(`fp.annual_fee_cents <= $${params.length}`);
  }
  if (min_coverage) {
    params.push(Math.round(Number(min_coverage) * 100));
    where.push(`fp.coverage_cents >= $${params.length}`);
  }
  if (max_premium) {
    params.push(Math.round(Number(max_premium) * 100));
    where.push(`fp.premium_from_cents <= $${params.length}`);
  }
  if (amount) {
    params.push(Math.round(Number(amount) * 100));
    const a = `$${params.length}`;
    where.push(`(fp.amount_min_cents <= ${a} AND fp.amount_max_cents >= ${a})`);
  }

  const ORDER = {
    rate_asc: "fp.interest_rate_min ASC NULLS LAST",
    fee_asc: "fp.annual_fee_cents ASC NULLS LAST",
    coverage_desc: "fp.coverage_cents DESC NULLS LAST",
    premium_asc: "fp.premium_from_cents ASC NULLS LAST",
    rating: "ci.rating DESC",
  };
  const orderBy = ORDER[sort] || "ci.rating DESC, ci.id ASC";

  const r = await query(
    `${SELECT_PRODUCT} WHERE ${where.join(" AND ")} ORDER BY ${orderBy} LIMIT 60`,
    params
  );
  res.json(r.rows);
});

/** Full detail for one financial product. */
router.get("/products/:slug", async (req, res) => {
  const r = await query(`${SELECT_PRODUCT} WHERE ci.slug = $1`, [req.params.slug]);
  if (r.rowCount === 0) return res.status(404).json({ error: "Not found" });
  res.json(r.rows[0]);
});

/**
 * Side-by-side comparison. body: { ids: [catalog_item_id, ...] } (2-4 items).
 * Returns the products plus the attribute rows that are meaningful for the
 * subtypes being compared, so the client can render a table without knowing
 * which fields matter for insurance vs loans vs cards.
 */
const COMPARE_ROWS = {
  loan: [
    { key: "interest_rate_min", label: "Interest rate (from)", format: "percent" },
    { key: "interest_rate_max", label: "Interest rate (up to)", format: "percent" },
    { key: "amount_min_cents", label: "Minimum amount", format: "money" },
    { key: "amount_max_cents", label: "Maximum amount", format: "money" },
    { key: "tenure_min_months", label: "Tenure (from)", format: "months" },
    { key: "tenure_max_months", label: "Tenure (up to)", format: "months" },
    { key: "processing_fee_pct", label: "Processing fee", format: "percent" },
    { key: "min_income_cents", label: "Minimum annual income", format: "money" },
    { key: "min_credit_score", label: "Minimum credit score", format: "number" },
  ],
  credit_card: [
    { key: "joining_fee_cents", label: "Joining fee", format: "money" },
    { key: "annual_fee_cents", label: "Annual fee", format: "money" },
    { key: "interest_rate_min", label: "Finance charge", format: "percent" },
    { key: "min_income_cents", label: "Minimum annual income", format: "money" },
    { key: "min_credit_score", label: "Minimum credit score", format: "number" },
  ],
  insurance: [
    { key: "premium_from_cents", label: "Premium from", format: "money" },
    { key: "coverage_cents", label: "Cover amount", format: "money" },
    { key: "policy_term_years", label: "Policy term", format: "years" },
    { key: "amount_min_cents", label: "Minimum cover", format: "money" },
    { key: "amount_max_cents", label: "Maximum cover", format: "money" },
    { key: "min_age", label: "Minimum age", format: "number" },
    { key: "max_age", label: "Maximum age", format: "number" },
  ],
};

router.post("/compare", async (req, res) => {
  const ids = (req.body?.ids || []).map(Number).filter(Boolean);
  if (ids.length < 2) return res.status(400).json({ error: "Pick at least 2 products to compare" });
  if (ids.length > 4) return res.status(400).json({ error: "You can compare up to 4 products" });

  const r = await query(`${SELECT_PRODUCT} WHERE ci.id = ANY($1)`, [ids]);
  if (r.rowCount < 2) return res.status(404).json({ error: "Products not found" });

  const subtypes = [...new Set(r.rows.map((p) => p.subtype))];
  if (subtypes.length > 1) {
    return res.status(400).json({ error: "Compare products of the same kind" });
  }
  // Preserve the order the client asked for.
  const byId = new Map(r.rows.map((p) => [p.id, p]));
  const products = ids.map((id) => byId.get(id)).filter(Boolean);

  res.json({ subtype: subtypes[0], rows: COMPARE_ROWS[subtypes[0]] || [], products });
});

/**
 * EMI calculator. body: { amount, rate, months } — amount in rupees, rate % p.a.
 * Standard reducing-balance formula: E = P·i·(1+i)^n / ((1+i)^n − 1)
 */
router.post("/emi", (req, res) => {
  const amount = Number(req.body?.amount);
  const rate = Number(req.body?.rate);
  const months = Number(req.body?.months);

  if (!(amount > 0) || !(months > 0) || !(rate >= 0)) {
    return res.status(400).json({ error: "amount, rate and months must be positive numbers" });
  }
  if (months > 480) return res.status(400).json({ error: "months must be 480 or less" });

  const i = rate / 12 / 100;
  const emi = i === 0 ? amount / months : (amount * i * (1 + i) ** months) / ((1 + i) ** months - 1);
  const totalPayable = emi * months;

  res.json({
    emi_cents: Math.round(emi * 100),
    total_payable_cents: Math.round(totalPayable * 100),
    total_interest_cents: Math.round((totalPayable - amount) * 100),
    principal_cents: Math.round(amount * 100),
  });
});

/**
 * Pre-qualification. body: { age, annual_income, credit_score, subtype? }
 * Returns every active product split into eligible / not eligible with reasons,
 * so the UI can explain *why* something does not qualify.
 */
router.post("/eligibility", async (req, res) => {
  const age = req.body?.age == null ? null : Number(req.body.age);
  const income = req.body?.annual_income == null ? null : Number(req.body.annual_income);
  const score = req.body?.credit_score == null ? null : Number(req.body.credit_score);
  const { subtype } = req.body || {};

  if (age == null && income == null && score == null) {
    return res.status(400).json({ error: "Provide at least one of age, annual_income, credit_score" });
  }
  if (subtype && !SUBTYPES.includes(subtype)) {
    return res.status(400).json({ error: `subtype must be one of ${SUBTYPES.join(", ")}` });
  }

  const params = [];
  let where = "ci.active = TRUE";
  if (subtype) {
    params.push(subtype);
    where += ` AND fp.subtype = $${params.length}`;
  }
  const r = await query(`${SELECT_PRODUCT} WHERE ${where}`, params);

  const eligible = [];
  const notEligible = [];
  for (const p of r.rows) {
    const reasons = [];
    if (age != null && p.min_age != null && age < p.min_age) {
      reasons.push(`Minimum age is ${p.min_age}`);
    }
    if (age != null && p.max_age != null && age > p.max_age) {
      reasons.push(`Maximum age is ${p.max_age}`);
    }
    if (income != null && p.min_income_cents != null && income * 100 < Number(p.min_income_cents)) {
      reasons.push(`Needs annual income of ₹${(Number(p.min_income_cents) / 100).toLocaleString("en-IN")}`);
    }
    if (score != null && p.min_credit_score != null && score < p.min_credit_score) {
      reasons.push(`Needs a credit score of ${p.min_credit_score}`);
    }
    if (reasons.length === 0) eligible.push(p);
    else notEligible.push({ ...p, reasons });
  }

  res.json({ eligible, not_eligible: notEligible });
});

export default router;
