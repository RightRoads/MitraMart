import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef(null);

  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get(`/catalog/suggest?q=${encodeURIComponent(q)}`, { auth: false })
        .then((rows) => {
          setSuggestions(rows);
          setOpen(true);
        })
        .catch(() => {});
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function submit(term) {
    const value = term ?? q;
    if (!value.trim()) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className="searchbar" ref={boxRef}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Search services & products — e.g. cleaning, fridge, cleaner…"
        aria-label="Search"
      />
      {open && suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((s) => (
            <button key={s.id} onClick={() => navigate(`/item/${s.slug}`)}>
              <span className={`pill ${s.type}`}>{s.type}</span>
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
