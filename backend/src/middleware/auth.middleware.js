import jwt from "jsonwebtoken";
import { findSessionByToken } from "../models/session.model.js";
import { findUserById } from "../models/user.model.js";

const rawJwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
if (
  rawJwtSecret === "dev-secret-change-me" &&
  process.env.NODE_ENV === "production"
) {
  throw new Error("JWT_SECRET environment variable must be set in production");
}
const JWT_SECRET = rawJwtSecret;

export async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const session = await findSessionByToken(token);
    if (!session) {
      return res.status(401).json({ message: "Session not found or expired" });
    }

    const user = await findUserById(decoded.sub);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
    };
    req.token = token;
    next();
  } catch (err) {
    console.error("authRequired error", err);
    res.status(500).json({ message: "Internal authentication error" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.role !== role) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
}

export function requireAnyRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
}
