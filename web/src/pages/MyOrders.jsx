import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, rupees } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const STATUS_LABEL = {
  requested: "Requested", confirmed: "Confirmed", in_progress: "In progress",
  completed: "Completed", cancelled: "Cancelled", placed: "Placed",
  packed: "Packed", out_for_delivery: "Out for delivery", delivered: "Delivered",
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [reorder, setReorder] = useState([]);
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/orders/mine").then(setOrders).catch(() => {});
    api.get("/orders/reorder").then(setReorder).catch(() => {});
  }, []);

  function quickReorder(it) {
    if (it.type === "product") {
      add({ id: it.id, name: it.name, price_cents: it.price_cents });
      toast(`${it.name} added to cart`);
    } else {
      navigate(`/item/${it.slug}`);
    }
  }

  return (
    <div className="container">
      {reorder.length > 0 && (
        <>
          <h2 className="section-title">Order again</h2>
          <div className="chips">
            {reorder.map((it) => (
              <button key={it.id} className="chip" onClick={() => quickReorder(it)}>
                🔁 {it.name} · {rupees(it.price_cents)}
              </button>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">My orders</h2>
      {orders.length === 0 ? (
        <div className="empty">No orders yet.</div>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="panel" style={{ marginBottom: 12 }}>
            <div className="line" style={{ borderBottom: "none", paddingTop: 0 }}>
              <div>
                <strong>#{o.id}</strong> · <span className={`pill ${o.type}`}>{o.type}</span>{" "}
                <span className="muted">{o.channel}</span>
              </div>
              <span className="spacer" />
              <span className="status">{STATUS_LABEL[o.status] || o.status}</span>
              <div style={{ width: 90, textAlign: "right", fontWeight: 700 }}>{rupees(o.total_cents)}</div>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {o.items.map((i) => `${i.name_snapshot} ×${i.qty}`).join(", ")}
              {o.scheduled_at && ` · scheduled ${new Date(o.scheduled_at).toLocaleString("en-IN")}`}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
