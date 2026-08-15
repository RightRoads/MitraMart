import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { SUBTYPES, SUBTYPE_PATH, shortRupees, formatValue } from "../lib/finance.js";
import EmiCalculator from "../components/EmiCalculator.jsx";

/** Attribute rows worth showing on the detail page, per subtype. */
const DETAIL_ROWS = {
  loan: [
    ["Interest rate", (p) => `${Number(p.interest_rate_min)}% – ${Number(p.interest_rate_max)}% p.a.`],
    ["Loan amount", (p) => `${shortRupees(p.amount_min_cents)} – ${shortRupees(p.amount_max_cents)}`],
    ["Tenure", (p) => `${p.tenure_min_months} – ${p.tenure_max_months} months`],
    ["Processing fee", (p) => formatValue(p.processing_fee_pct, "percent")],
  ],
  credit_card: [
    ["Joining fee", (p) => shortRupees(p.joining_fee_cents)],
    ["Annual fee", (p) => (Number(p.annual_fee_cents) === 0 ? "Lifetime free" : shortRupees(p.annual_fee_cents))],
    ["Finance charge", (p) => formatValue(p.interest_rate_min, "percent")],
  ],
  insurance: [
    ["Premium from", (p) => `${shortRupees(p.premium_from_cents)} / year`],
    ["Cover amount", (p) => shortRupees(p.coverage_cents)],
    ["Cover range", (p) => `${shortRupees(p.amount_min_cents)} – ${shortRupees(p.amount_max_cents)}`],
    ["Policy term", (p) => formatValue(p.policy_term_years, "years")],
  ],
};

const ELIGIBILITY_ROWS = [
  ["Age", (p) => (p.min_age != null ? `${p.min_age} – ${p.max_age ?? "—"} years` : null)],
  ["Minimum annual income", (p) => (p.min_income_cents != null ? shortRupees(p.min_income_cents) : null)],
  ["Minimum credit score", (p) => (p.min_credit_score != null ? String(p.min_credit_score) : null)],
];

/**
 * Render one features JSONB entry as a label/value pair.
 * `_pct` and `_cents` suffixes are unit hints, not part of the label:
 * forex_markup_pct: 2 → "Forex markup" / "2%".
 */
function feature([key, value]) {
  let label = key;
  let text;
  if (typeof value === "boolean") text = value ? "Yes" : "No";
  else if (Array.isArray(value)) text = value.join(", ");
  else if (key.endsWith("_pct")) {
    label = key.slice(0, -4);
    text = `${value}%`;
  } else if (key.endsWith("_cents")) {
    label = key.slice(0, -6);
    text = shortRupees(value);
  } else text = String(value);

  const words = label.replace(/_/g, " ");
  return { label: words.charAt(0).toUpperCase() + words.slice(1), text };
}

export default function FinanceProduct() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/finance/products/${slug}`, { auth: false })
      .then(setProduct)
      .catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <div className="container"><div className="empty">{error}</div></div>;
  if (!product) return <div className="container"><p className="muted">Loading…</p></div>;

  const meta = SUBTYPES[SUBTYPE_PATH[product.subtype]];
  const rows = (DETAIL_ROWS[product.subtype] || []).map(([label, fn]) => [label, fn(product)]);
  const eligibility = ELIGIBILITY_ROWS.map(([label, fn]) => [label, fn(product)]).filter(([, v]) => v);
  const features = Object.entries(product.features || {});

  return (
    <div className="container">
      <div className="detail-hero">
        <div className="detail-thumb">{meta?.icon || "🏦"}</div>
        <div className="detail-info">
          <div className="finance-provider-name">{product.provider_name}</div>
          <h2>{product.name}</h2>
          <div className="card-meta">
            <span className="pill financial">{meta?.label}</span>{" "}
            <span className="rating">★ {Number(product.rating).toFixed(1)}</span>
          </div>
          <p>{product.description}</p>
          <button className="btn" onClick={() => toast("Applications are coming next — this is the Phase 1 catalog.")}>
            Apply now
          </button>{" "}
          <button className="btn secondary" onClick={() => navigate(`/finance/${SUBTYPE_PATH[product.subtype]}`)}>
            See similar
          </button>
        </div>
      </div>

      <div className="finance-detail-grid">
        <div>
          <div className="panel">
            <h3>At a glance</h3>
            {rows.map(([label, value]) => (
              <div className="spec" key={label}><span>{label}</span><span>{value}</span></div>
            ))}
          </div>

          {eligibility.length > 0 && (
            <div className="panel">
              <h3>Eligibility</h3>
              {eligibility.map(([label, value]) => (
                <div className="spec" key={label}><span>{label}</span><span>{value}</span></div>
              ))}
            </div>
          )}

          {features.length > 0 && (
            <div className="panel">
              <h3>Details</h3>
              {features.map((entry) => {
                const { label, text } = feature(entry);
                return (
                  <div className="spec" key={entry[0]}>
                    <span>{label}</span><span>{text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          {product.subtype === "loan" && <EmiCalculator product={product} />}

          {product.key_benefits?.length > 0 && (
            <div className="panel">
              <h3>Key benefits</h3>
              <ul className="benefit-list">
                {product.key_benefits.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          )}

          {product.exclusions?.length > 0 && (
            <div className="panel">
              <h3>What's not covered</h3>
              <ul className="benefit-list exclusions">
                {product.exclusions.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      <p className="muted disclaimer">
        Rates, fees and premiums shown are indicative and set by {product.provider_name}. Final terms
        depend on their assessment of your application. MitraMart is a distributor, not the insurer or lender.
      </p>
    </div>
  );
}
