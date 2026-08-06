import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import ItemCard from "../components/ItemCard.jsx";

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const q = params.get("q") || "";
  const type = params.get("type") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "";

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (type) qs.set("type", type);
    if (category) qs.set("category", category);
    if (sort) qs.set("sort", sort);
    api
      .get(`/catalog/search?${qs.toString()}`, { auth: false })
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q, type, category, sort]);

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div className="container">
      <h2 className="section-title">
        {q ? `Results for “${q}”` : category ? `Category: ${category}` : "All services & products"}
      </h2>

      <div className="chips">
        <button className={`chip ${!type ? "active" : ""}`} onClick={() => setParam("type", "")}>All</button>
        <button className={`chip ${type === "service" ? "active" : ""}`} onClick={() => setParam("type", "service")}>Services</button>
        <button className={`chip ${type === "product" ? "active" : ""}`} onClick={() => setParam("type", "product")}>Products</button>
        <span className="spacer" />
        <select className="chip" value={sort} onChange={(e) => setParam("sort", e.target.value)}>
          <option value="">Sort: Relevance</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Searching…</p>
      ) : results.length === 0 ? (
        <div className="empty">No matches. Try a different word.</div>
      ) : (
        <div className="card-grid">
          {results.map((item) => (
            <ItemCard key={item.id} item={item} onAdded={(i) => toast(`${i.name} added to cart`)} />
          ))}
        </div>
      )}
    </div>
  );
}
