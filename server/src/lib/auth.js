import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-only-change-me";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    SECRET,
    { expiresIn: "30d" }
  );
}

/** Populate req.user from a Bearer token if present (does not reject). */
export function attachUser(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, SECRET);
    } catch {
      // ignore invalid token; route guards will reject if auth is required
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Login required" });
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Login required" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed" });
    }
    next();
  };
}
