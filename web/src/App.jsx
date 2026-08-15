import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import ItemDetail from "./pages/ItemDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import Admin from "./pages/Admin.jsx";
import FinanceList from "./pages/FinanceList.jsx";
import FinanceProduct from "./pages/FinanceProduct.jsx";
import FinanceCompare from "./pages/FinanceCompare.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function Protected({ children, staff }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (staff && !["admin", "staff"].includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/item/:slug" element={<ItemDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/finance/compare" element={<FinanceCompare />} />
        <Route path="/finance/product/:slug" element={<FinanceProduct />} />
        <Route path="/finance/:subtype" element={<FinanceList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/orders" element={<Protected><MyOrders /></Protected>} />
        <Route path="/admin" element={<Protected staff><Admin /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
