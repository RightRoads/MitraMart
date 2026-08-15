import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Navigate, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { SUBTYPES } from "../lib/finance.js";
import FinanceCard from "../components/FinanceCard.jsx";

const MAX_COMPARE = 4;

export default function FinanceList() {
  const { subtype: slug } = useParams();
  const meta = SUBTYPES[slug];
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compare, setCompare] = useState([]);

  const provider = params.get("provider") || "";
  const sort = params.get("sort") || "";
  const maxRate = params.get("max_rate") || "";
  const amount = params.get("amount") || "";
  const maxFee = params.get("max_annual_fee") || "";
  const minCoverage = params.get("min_coverage") || "";

  useEffect(() => {
    if (!meta) return;
    api
      .get(`/finance/providers?subtype=${meta.subtype}`, { auth: false })
      .then(setProviders)
      .catch(() => {});
  }, [meta]);

  // Clear a comparison when switching product kind — you can't compare a loan to a card.
  useEffect(() => setCompare([]), [slug]);

  useEffect(() => {
    if (!meta) return;
    setLoading(true);
    const qs = new URLSearchParams({ subtype: meta.subtype });
    if (provider) qs.set("provider", provider);
    if (sort) qs.set("sort", sort);
    if (maxRate) qs.set("max_rate", maxRate);
    if (amount) qs.set("amount", amount);
    if (maxFee) qs.set("max_annual_fee", maxFee);
    if (minCoverage) qs.set("min_coverage", minCoverage);
    api
      .get(`/finance/products?${qs}`, { auth: false })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [meta, provider, sort, maxRate, amount, maxFee, minCoverage]);

  if (!meta) return <Navigate to="/" replace />;

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  function toggleCompare(product) {
    setCompare((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : prev.length >= MAX_COMPARE
          ? prev
          : [...prev, product]
    );
  }

  return (
    <div className="container">
      <div className="finance-tabs">
        {Object.entries(SUBTYPES).map(([s, m]) => (
          <Link key={s} to={`/finance/${s}`} className={`chip ${s === slug ? "active" : ""}`}>
            {m.icon} {m.label}
          </Link>
        ))}
      </div>

      <h2 className="section-title">{meta.plural}</h2>
      <p className="muted">{meta.blurb}</p>

      <div className="chips">
        <select className="chip" value={provider} onChange={(e) => setParam("provider", e.target.value)}>
          <option value="">All providers</option>
          {providers.map((p) => (
            <option key={p.id} value={p.slug}>{p.name}</option>
          ))}
        </select>

        {meta.subtype === "loan" && (
          <>
            <input
              className="chip" type="number" placeholder="Loan amount (₹)"
              value={amount} onChange={(e) => setParam("amount", e.target.value)}
            />
            <input
              className="chip" type="number" step="0.1" placeholder="Max rate (%)"
              value={maxRate} onChange={(e) => setParam("max_rate", e.target.value)}
            />
          </>
        )}
        {meta.subtype === "credit_card" && (
          <input
            className="chip" type="number" placeholder="Max annual fee (₹)"
            value={maxFee} onChange={(e) => setParam("max_annual_fee", e.target.value)}
          />
        )}
        {meta.subtype === "insurance" && (
          <input
            className="chip" type="number" placeholder="Min cover (₹)"
            value={minCoverage} onChange={(e) => setParam("min_coverage", e.target.value)}
          />
        )}

        <span className="spacer" />
        <select className="chip" value={sort} onChange={(e) => setParam("sort", e.target.value)}>
          <option value="">Sort: Recommended</option>
          {meta.sorts.map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : products.length === 0 ? (
        <div className="empty">No {meta.label.toLowerCase()} match these filters.</div>
      ) : (
        <div className="card-grid">
          {products.map((p) => (
            <FinanceCard
              key={p.id}
              product={p}
              selected={compare.some((c) => c.id === p.id)}
              onToggleCompare={toggleCompare}
            />
          ))}
        </div>
      )}

      {compare.length > 0 && (
        <div className="compare-tray">
          <span>
            {compare.length} selected
            {compare.length >= MAX_COMPARE && <span className="muted"> (max {MAX_COMPARE})</span>}
          </span>
          <span className="compare-names">{compare.map((p) => p.name).join(" · ")}</span>
          <span className="spacer" />
          <button className="btn sm secondary" onClick={() => setCompare([])}>Clear</button>
          <button
            className="btn sm"
            disabled={compare.length < 2}
            onClick={() => navigate(`/finance/compare?ids=${compare.map((p) => p.id).join(",")}`)}
          >
            Compare {compare.length < 2 ? "(pick 2)" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
