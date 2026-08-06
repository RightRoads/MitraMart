import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(phone, password);
      navigate(["admin", "staff"].includes(user.role) ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      <form className="panel form-narrow" onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>Log in</h2>
        <div className="field">
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9000000003" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn block" type="submit">Log in</button>
        <p className="center muted" style={{ marginBottom: 0 }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
