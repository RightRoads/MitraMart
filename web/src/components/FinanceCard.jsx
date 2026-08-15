import { useNavigate } from "react-router-dom";
import { SUBTYPES, headline, subline } from "../lib/finance.js";

const SUBTYPE_ICON = { insurance: "🛡️", loan: "💰", credit_card: "💳" };

/**
 * A financial product card. Unlike ItemCard there is no price/Add-to-cart —
 * you compare and apply, so it shows the provider, the headline rate/fee and
 * an optional compare checkbox.
 */
export default function FinanceCard({ product, selected, onToggleCompare }) {
  const navigate = useNavigate();
  const head = headline(product);
  const sub = subline(product);
  const open = () => navigate(`/finance/product/${product.slug}`);

  return (
    <div className="card finance-card">
      <div className="finance-provider">
        <span className="finance-logo">{SUBTYPE_ICON[product.subtype] || "🏦"}</span>
        <span className="finance-provider-name">{product.provider_name}</span>
        <span className="rating">★ {Number(product.rating).toFixed(1)}</span>
      </div>

      <div className="card-body">
        <div className="card-name" onClick={open} style={{ cursor: "pointer" }}>
          {product.name}
        </div>
        <div className="card-meta">
          <span className="pill financial">
            {SUBTYPES[product.subtype === "loan" ? "loans" : product.subtype === "credit_card" ? "credit-cards" : "insurance"]?.label}
          </span>{" "}
          {sub}
        </div>

        <div className="finance-headline">
          <span className="finance-headline-label">{head.label}</span>
          <span className="finance-headline-value">{head.value}</span>
        </div>

        <div className="card-foot">
          {onToggleCompare ? (
            <label className="compare-check">
              <input type="checkbox" checked={!!selected} onChange={() => onToggleCompare(product)} />
              Compare
            </label>
          ) : (
            <span />
          )}
          <button className="btn sm" onClick={open}>
            View details
          </button>
        </div>
      </div>
    </div>
  );
}
