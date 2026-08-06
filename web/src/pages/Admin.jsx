import { useEffect, useState } from "react";
import { api, rupees } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const NEXT_STATUS = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  placed: ["packed", "cancelled"],
  packed: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
};

function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/admin/stats").then(setS).catch(() => {}); }, []);
  if (!s) return null;
  return (
    <div className="row" style={{ marginBottom: 18 }}>
      <div className="panel" style={{ flex: 1, minWidth: 160 }}>
        <div className="muted">Total revenue</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{rupees(Number(s.totals.total_cents))}</div>
        <div className="muted">{s.totals.orders} orders</div>
      </div>
      {s.by_channel.map((c) => (
        <div key={c.channel} className="panel" style={{ flex: 1, minWidth: 160 }}>
          <div className="muted">{c.channel} sales</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{rupees(Number(c.total_cents))}</div>
          <div className="muted">{c.orders} orders</div>
        </div>
      ))}
      {s.low_stock.length > 0 && (
        <div className="panel" style={{ flex: 1, minWidth: 200 }}>
          <div className="muted">Low stock</div>
          {s.low_stock.map((l) => (
            <div key={l.name} style={{ fontSize: 13 }}>{l.name}: <strong>{l.stock_qty}</strong></div>
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogTab({ isAdmin }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ type: "service", name: "", price_rupees: "", duration_min: "", stock_qty: "", category_id: "", description: "" });
  const toast = useToast();

  const load = () => api.get("/admin/items").then(setItems);
  useEffect(() => {
    load();
    api.get("/catalog/categories", { auth: false }).then(setCategories);
  }, []);

  async function toggle(item) {
    await api.patch(`/admin/items/${item.id}/active`, { active: !item.active });
    toast(`${item.name} ${item.active ? "disabled" : "enabled"}`);
    load();
  }
  async function saveStock(item, val) {
    await api.put(`/admin/items/${item.id}/stock`, { stock_qty: Number(val) });
    toast("Stock updated");
    load();
  }
  async function addItem(e) {
    e.preventDefault();
    if (!form.name) return toast("Name required");
    try {
      await api.post("/admin/items", {
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
        duration_min: form.duration_min ? Number(form.duration_min) : null,
        stock_qty: form.stock_qty ? Number(form.stock_qty) : 0,
      });
      toast("Added");
      setForm({ type: "service", name: "", price_rupees: "", duration_min: "", stock_qty: "", category_id: "", description: "" });
      load();
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <>
      {isAdmin && (
        <form className="panel" style={{ marginBottom: 16 }} onSubmit={addItem}>
          <h3 style={{ marginTop: 0 }}>Add service / product</h3>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="service">Service</option>
                <option value="product">Product</option>
              </select></div>
            <div className="field" style={{ flex: 2 }}><label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field" style={{ flex: 1 }}><label>Price (₹)</label>
              <input type="number" value={form.price_rupees} onChange={(e) => setForm({ ...form, price_rupees: e.target.value })} /></div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            {form.type === "service" ? (
              <div className="field" style={{ flex: 1 }}><label>Duration (min)</label>
                <input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} /></div>
            ) : (
              <div className="field" style={{ flex: 1 }}><label>Initial stock</label>
                <input type="number" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} /></div>
            )}
            <div className="field" style={{ flex: 2 }}><label>Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <button className="btn" type="submit">Add to catalog</button>
        </form>
      )}

      <div className="panel">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} style={{ opacity: it.active ? 1 : 0.5 }}>
                <td>{it.name}</td>
                <td><span className={`pill ${it.type}`}>{it.type}</span></td>
                <td>{rupees(it.price_cents)}</td>
                <td>
                  {it.type === "product" ? (
                    <input
                      style={{ width: 70 }}
                      defaultValue={it.stock_qty ?? 0}
                      onBlur={(e) => e.target.value != (it.stock_qty ?? 0) && saveStock(it, e.target.value)}
                    />
                  ) : "—"}
                </td>
                <td>{it.active ? <span className="status">Active</span> : <span className="muted">Disabled</span>}</td>
                <td>
                  {isAdmin && (
                    <button className="btn ghost sm" onClick={() => toggle(it)}>
                      {it.active ? "Disable" : "Enable"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const toast = useToast();
  const load = () => api.get(`/admin/orders${filter ? `?channel=${filter}` : ""}`).then(setOrders);
  useEffect(() => { load(); }, [filter]);

  async function advance(o, status) {
    await api.patch(`/admin/orders/${o.id}/status`, { status });
    toast(`#${o.id} → ${status}`);
    load();
  }

  return (
    <>
      <div className="chips">
        {["", "online", "offline"].map((f) => (
          <button key={f || "all"} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f || "All"}
          </button>
        ))}
      </div>
      <div className="panel">
        <table>
          <thead><tr><th>#</th><th>Type</th><th>Channel</th><th>Customer</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td><span className={`pill ${o.type}`}>{o.type}</span></td>
                <td>{o.channel}</td>
                <td>{o.customer_name || "Walk-in"}</td>
                <td>{rupees(o.total_cents)}</td>
                <td><span className="status">{o.status}</span></td>
                <td>
                  {(NEXT_STATUS[o.status] || []).map((s) => (
                    <button key={s} className="btn ghost sm" style={{ marginRight: 4 }} onClick={() => advance(o, s)}>{s}</button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OfflineSaleTab() {
  const [products, setProducts] = useState([]);
  const [lines, setLines] = useState([]);
  const [payment, setPayment] = useState("cash");
  const [phone, setPhone] = useState("");
  const toast = useToast();

  useEffect(() => {
    api.get("/catalog/search?type=product", { auth: false }).then(setProducts);
  }, []);

  function addLine(p) {
    setLines((prev) => {
      const f = prev.find((l) => l.id === p.id);
      if (f) return prev.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id: p.id, name: p.name, price_cents: p.price_cents, qty: 1 }];
    });
  }
  const total = lines.reduce((n, l) => n + l.qty * l.price_cents, 0);

  async function record() {
    if (lines.length === 0) return toast("Add at least one product");
    try {
      await api.post("/admin/offline-sale", {
        items: lines.map((l) => ({ catalog_item_id: l.id, qty: l.qty })),
        payment_mode: payment,
        customer_phone: phone || undefined,
      });
      toast("Offline sale recorded — stock updated");
      setLines([]); setPhone("");
      api.get("/catalog/search?type=product", { auth: false }).then(setProducts);
    } catch (e) {
      toast(e.message);
    }
  }

  return (
    <div className="row">
      <div className="panel" style={{ flex: 1, minWidth: 280 }}>
        <h3 style={{ marginTop: 0 }}>Products</h3>
        {products.map((p) => (
          <div key={p.id} className="line">
            <div>{p.name}<div className="muted">{rupees(p.price_cents)} · {p.stock_qty} in stock</div></div>
            <span className="spacer" />
            <button className="btn sm" disabled={!p.stock_qty} onClick={() => addLine(p)}>Add</button>
          </div>
        ))}
      </div>
      <div className="panel" style={{ flex: 1, minWidth: 280 }}>
        <h3 style={{ marginTop: 0 }}>New offline sale</h3>
        {lines.length === 0 ? <p className="muted">No items yet.</p> : lines.map((l) => (
          <div key={l.id} className="line">
            <div>{l.name} ×{l.qty}</div><span className="spacer" /><div>{rupees(l.price_cents * l.qty)}</div>
          </div>
        ))}
        <div className="field"><label>Customer phone (optional)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9000000003" /></div>
        <div className="field"><label>Payment</label>
          <select value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option>
          </select></div>
        <div style={{ fontWeight: 800, margin: "8px 0" }}>Total: {rupees(total)}</div>
        <button className="btn block" onClick={record}>Record sale</button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("catalog");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="container">
      <h2 className="section-title">Admin dashboard</h2>
      <Stats />
      <div className="tabs">
        {["catalog", "orders", "offline"].map((t) => (
          <button key={t} className={`chip ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "offline" ? "Offline sale" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === "catalog" && <CatalogTab isAdmin={isAdmin} />}
      {tab === "orders" && <OrdersTab />}
      {tab === "offline" && <OfflineSaleTab />}
    </div>
  );
}
