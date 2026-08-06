import { Link, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const isStaff = user && (user.role === "admin" || user.role === "staff");

  return (
    <header className="header">
      <div className="header-row">
        <Link to="/" className="brand">
          Home<span>Serve</span>
        </Link>
        <SearchBar />
        <div className="header-actions">
          {isStaff && (
            <button className="icon-btn" onClick={() => navigate("/admin")}>
              Admin
            </button>
          )}
          <button className="icon-btn" onClick={() => navigate("/cart")}>
            🛒 Cart
            {count > 0 && <span className="badge">{count}</span>}
          </button>
          {user ? (
            <>
              <button className="icon-btn" onClick={() => navigate("/orders")}>
                Orders
              </button>
              <button className="icon-btn" onClick={() => { logout(); navigate("/"); }}>
                Logout
              </button>
            </>
          ) : (
            <button className="icon-btn" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
