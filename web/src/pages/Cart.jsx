import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { rupees, api } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import AddressPicker from "../components/AddressPicker.jsx";

export default function Cart() {
  const { items, setQty, remove, clear, totalCents } = useCart();
  const { user } = useAuth();
  const [addressId, setAddressId] = useState(null);
  const [payment, setPayment] = useState("cash");
  const [placing, setPlacing] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container">
        <div className="empty">
          Your cart is empty.
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => navigate("/search?type=product")}>Browse products</button>
          </div>
        </div>
      </div>
    );
  }

  async function placeOrder() {
    if (!user) return navigate("/login");
    if (!addressId) return toast("Add or select a delivery address");
    setPlacing(true);
    try {
      await api.post("/orders", {
        type: "product",
        items: items.map((i) => ({ catalog_item_id: i.id, qty: i.qty })),
        address_id: addressId,
        payment_mode: payment,
      });
      clear();
      toast("Order placed!");
      navigate("/orders");
    } catch (e) {
      toast(e.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="container">
      <h2 className="section-title">Your cart</h2>
      <div className="panel">
        {items.map((i) => (
          <div key={i.id} className="line">
            <div>
              <div style={{ fontWeight: 700 }}>{i.name}</div>
              <div className="muted">{rupees(i.price_cents)} each</div>
            </div>
            <span className="spacer" />
            <div className="qty">
              <button onClick={() => setQty(i.id, i.qty - 1)}>−</button>
              <span>{i.qty}</span>
              <button onClick={() => setQty(i.id, i.qty + 1)}>+</button>
            </div>
            <div style={{ width: 90, textAlign: "right", fontWeight: 700 }}>{rupees(i.price_cents * i.qty)}</div>
            <button className="btn ghost sm" onClick={() => remove(i.id)}>Remove</button>
          </div>
        ))}
        <div className="line" style={{ borderBottom: "none", fontSize: 18, fontWeight: 800 }}>
          <span>Total</span><span className="spacer" /><span>{rupees(totalCents)}</span>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Delivery</h3>
        {user ? <AddressPicker value={addressId} onChange={setAddressId} /> : <p className="muted">Log in to place your order.</p>}
        <div className="field">
          <label>Payment</label>
          <select value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="cash">Cash on delivery</option>
            <option value="online">Pay online</option>
          </select>
        </div>
        <button className="btn block" disabled={placing} onClick={placeOrder}>
          {placing ? "Placing…" : `Place order · ${rupees(totalCents)}`}
        </button>
      </div>
    </div>
  );
}
