import { useNavigate } from "react-router-dom";
import { rupees } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";
import FinanceCard from "./FinanceCard.jsx";

const EMOJI = {
  cleaning: "🧹", plumbing: "🔧", painting: "🎨", "appliance-repair": "🛠️",
  "salon-at-home": "💇", "home-supplies": "🧴", "spare-parts": "⚙️",
};

export default function ItemCard({ item, onAdded }) {
  const navigate = useNavigate();
  const { add } = useCart();

  // Financial products can't be added to a cart — they have their own card and route.
  if (item.type === "financial") return <FinanceCard product={item} />;

  const isProduct = item.type === "product";
  const outOfStock = isProduct && (item.stock_qty == null || item.stock_qty <= 0);

  return (
    <div className="card">
      <div className="card-thumb" onClick={() => navigate(`/item/${item.slug}`)} style={{ cursor: "pointer" }}>
        {EMOJI[item.category_slug] || (isProduct ? "📦" : "🧰")}
      </div>
      <div className="card-body">
        <div className="card-name" onClick={() => navigate(`/item/${item.slug}`)} style={{ cursor: "pointer" }}>
          {item.name}
        </div>
        <div className="card-meta">
          <span className={`pill ${item.type}`}>{item.type}</span>{" "}
          {isProduct
            ? outOfStock ? <span className="oos">Out of stock</span> : `${item.stock_qty} in stock`
            : item.duration_min ? `${item.duration_min} min` : ""}
        </div>
        <div className="card-foot">
          <div>
            <div className="price">{rupees(item.price_cents)}</div>
            <div className="rating">★ {Number(item.rating).toFixed(1)}</div>
          </div>
          {isProduct ? (
            <button
              className="btn sm"
              disabled={outOfStock}
              onClick={() => { add(item); onAdded?.(item); }}
            >
              Add
            </button>
          ) : (
            <button className="btn sm" onClick={() => navigate(`/item/${item.slug}`)}>
              Book
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
