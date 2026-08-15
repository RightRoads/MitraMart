import { useEffect, useState } from "react";
import { api, rupees } from "../lib/api.js";

/** Money here is only ever an estimate, so show whole rupees rather than paise. */
function wholeRupees(cents) {
  return rupees(Math.round(cents / 100) * 100);
}

/** Clamp a value into [min, max], ignoring null bounds. */
function clamp(value, min, max) {
  let v = value;
  if (min != null) v = Math.max(v, min);
  if (max != null) v = Math.min(v, max);
  return v;
}

/**
 * EMI calculator for a loan product. Defaults sit inside the product's own
 * amount/tenure/rate range so the first render is always a valid quote.
 */
export default function EmiCalculator({ product }) {
  const minAmount = product.amount_min_cents ? Number(product.amount_min_cents) / 100 : 10000;
  const maxAmount = product.amount_max_cents ? Number(product.amount_max_cents) / 100 : 5000000;
  const minMonths = product.tenure_min_months || 12;
  const maxMonths = product.tenure_max_months || 60;
  const rate = Number(product.interest_rate_min ?? 12);

  const [amount, setAmount] = useState(() => clamp(Math.round((minAmount + maxAmount) / 2), minAmount, maxAmount));
  const [months, setMonths] = useState(() => clamp(minMonths + Math.round((maxMonths - minMonths) / 2), minMonths, maxMonths));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .post("/finance/emi", { amount, rate, months }, { auth: false })
      .then((r) => { setResult(r); setError(""); })
      .catch((e) => { setResult(null); setError(e.message); });
  }, [amount, months, rate]);

  return (
    <div className="panel emi-panel">
      <h3>EMI calculator</h3>
      <p className="muted">At {rate}% p.a. — the lowest rate on this product.</p>

      <div className="field">
        <label>Loan amount: <strong>{rupees(amount * 100)}</strong></label>
        <input
          type="range" min={minAmount} max={maxAmount} step={Math.max(1000, Math.round(maxAmount / 200))}
          value={amount} onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label>Tenure: <strong>{months} months</strong></label>
        <input
          type="range" min={minMonths} max={maxMonths} step={months < 24 ? 1 : 6}
          value={months} onChange={(e) => setMonths(Number(e.target.value))}
        />
      </div>

      {error && <div className="error">{error}</div>}
      {result && (
        <div className="emi-result">
          <div className="emi-emi">
            <span className="muted">Monthly EMI</span>
            <strong>{wholeRupees(result.emi_cents)}</strong>
          </div>
          <div className="spec"><span>Principal</span><span>{wholeRupees(result.principal_cents)}</span></div>
          <div className="spec"><span>Total interest</span><span>{wholeRupees(result.total_interest_cents)}</span></div>
          <div className="spec"><span>Total payable</span><span>{wholeRupees(result.total_payable_cents)}</span></div>
        </div>
      )}
    </div>
  );
}
