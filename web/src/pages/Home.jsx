import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ItemCard from "../components/ItemCard.jsx";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [popular, setPopular] = useState([]);
  const [reorder, setReorder] = useState([]);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/catalog/categories", { auth: false }).then(setCategories).catch(() => {});
    api.get("/catalog/search?sort=rating", { auth: false }).then((r) => setPopular(r.slice(0, 8))).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) api.get("/orders/reorder").then(setReorder).catch(() => setReorder([]));
    else setReorder([]);
  }, [user]);

  return (
    <div className="container">
      <h2 className="section-title">What do you need today?</h2>
      <div className="cat-grid">
        {categories.map((c) => (
          <div key={c.id} className="cat-tile" onClick={() => navigate(`/search?category=${c.slug}`)}>
            <span className="cat-emoji">{c.icon}</span>
            <span className="cat-name">{c.name}</span>
          </div>
        ))}
      </div>

      {reorder.length > 0 && (
        <>
          <h2 className="section-title">Order again</h2>
          <div className="card-grid">
            {reorder.slice(0, 4).map((item) => (
              <ItemCard key={item.id} item={item} onAdded={(i) => toast(`${i.name} added to cart`)} />
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">Popular services & products</h2>
      <div className="card-grid">
        {popular.map((item) => (
          <ItemCard key={item.id} item={item} onAdded={(i) => toast(`${i.name} added to cart`)} />
        ))}
      </div>
    </div>
  );
}
