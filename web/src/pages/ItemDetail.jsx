import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, rupees } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import AddressPicker from "../components/AddressPicker.jsx";

export default function ItemDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [slot, setSlot] = useState("");
  const [addressId, setAddressId] = useState(null);
  const [booking, setBooking] = useState(false);
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/catalog/items/${slug}`, { auth: false }).then(setItem).catch(() => setError("Not found"));
  }, [slug]);

  if (error) return <div className="container"><div className="empty">{error}</div></div>;
  if (!item) return <div className="container">Loading…</div>;

  const isProduct = item.type === "product";
  const outOfStock = isProduct && (item.stock_qty == null || item.stock_qty <= 0);

  async function bookService() {
    if (!user) return navigate("/login");
    if (!slot) return toast("Pick a date & time slot");
    if (!addressId) return toast("Add or select an address");
    setBooking(true);
    try {
      await api.post("/orders", {
        type: "service",
        items: [{ catalog_item_id: item.id, qty: 1 }],
        scheduled_at: new Date(slot).toISOString(),
        address_id: addressId,
        payment_mode: "cash",
      });
      toast("Service booked!");
      navigate("/orders");
    } catch (e) {
      toast(e.message);
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="container">
      <div className="detail-hero">
        <div className="detail-thumb">{isProduct ? "📦" : "🧰"}</div>
        <div className="detail-info">
          <span className={`pill ${item.type}`}>{item.type}</span>
          <h2 style={{ margin: "10px 0 6px" }}>{item.name}</h2>
          <p className="muted">{item.description}</p>
          <div className="price" style={{ fontSize: 24, margin: "10px 0" }}>{rupees(item.price_cents)}</div>
          <div className="rating">★ {Number(item.rating).toFixed(1)}</div>
          {isProduct ? (
            <div style={{ marginTop: 16 }}>
              {outOfStock ? (
                <p className="oos">Out of stock</p>
              ) : (
                <p className="muted">{item.stock_qty} in stock</p>
              )}
              <button
                className="btn block"
                disabled={outOfStock}
                onClick={() => { add(item); toast(`${item.name} added to cart`); }}
              >
                Add to cart
              </button>
            </div>
          ) : (
            <div className="panel" style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Book this service</h3>
              <div className="field">
                <label>Preferred date & time</label>
                <input type="datetime-local" value={slot} onChange={(e) => setSlot(e.target.value)} />
              </div>
              {user ? (
                <AddressPicker value={addressId} onChange={setAddressId} />
              ) : (
                <p className="muted">Please log in to book.</p>
              )}
              <button className="btn block" disabled={booking} onClick={bookService}>
                {booking ? "Booking…" : "Confirm booking"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
