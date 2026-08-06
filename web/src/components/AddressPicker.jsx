import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function AddressPicker({ value, onChange }) {
  const [addresses, setAddresses] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "Home", line1: "", city: "", pincode: "" });

  const load = () =>
    api.get("/me/addresses").then((rows) => {
      setAddresses(rows);
      if (rows.length && !value) onChange(rows[0].id);
    });

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.line1 || !form.city || !form.pincode) return;
    const created = await api.post("/me/addresses", form);
    setAdding(false);
    setForm({ label: "Home", line1: "", city: "", pincode: "" });
    await load();
    onChange(created.id);
  }

  return (
    <div className="field">
      <label>Service address</label>
      {addresses.map((a) => (
        <label key={a.id} style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 400 }}>
          <input type="radio" checked={value === a.id} onChange={() => onChange(a.id)} />
          <span>{a.label}: {a.line1}, {a.city} — {a.pincode}</span>
        </label>
      ))}
      {adding ? (
        <div className="panel" style={{ marginTop: 8 }}>
          <div className="field"><label>Address line</label>
            <input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div className="field" style={{ flex: 1 }}><label>Pincode</label>
              <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
          </div>
          <button className="btn sm" onClick={save}>Save address</button>
        </div>
      ) : (
        <button className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => setAdding(true)}>
          + Add new address
        </button>
      )}
    </div>
  );
}
