import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { formatValue } from "../lib/finance.js";

export default function FinanceCompare() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const ids = (params.get("ids") || "").split(",").map(Number).filter(Boolean);

  useEffect(() => {
    if (ids.length < 2) {
      setError("Pick at least 2 products to compare.");
      return;
    }
    api
      .post("/finance/compare", { ids }, { auth: false })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [params.get("ids")]);

  if (error) return <div className="container"><div className="empty">{error}</div></div>;
  if (!data) return <div className="container"><p className="muted">Loading comparison…</p></div>;

  return (
    <div className="container">
      <h2 className="section-title">Compare {data.products.length} products</h2>

      <div className="compare-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th />
              {data.products.map((p) => (
                <th key={p.id}>
                  <div className="compare-provider">{p.provider_name}</div>
                  <div className="compare-name">{p.name}</div>
                  <div className="rating">★ {Number(p.rating).toFixed(1)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                {data.products.map((p) => (
                  <td key={p.id}>{formatValue(p[row.key], row.format)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">Key benefits</th>
              {data.products.map((p) => (
                <td key={p.id}>
                  <ul className="compare-list">
                    {(p.key_benefits || []).map((b) => <li key={b}>{b}</li>)}
                  </ul>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" />
              {data.products.map((p) => (
                <td key={p.id}>
                  <button className="btn sm" onClick={() => navigate(`/finance/product/${p.slug}`)}>
                    View details
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <button className="btn secondary" onClick={() => navigate(-1)}>← Back to list</button>
    </div>
  );
}
