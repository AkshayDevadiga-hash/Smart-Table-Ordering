import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tableorder-secret-key-2024";

const CREDENTIALS: Record<string, { password: string; role: string }> = {
  admin: { password: process.env.ADMIN_PASSWORD || "admin1234", role: "admin" },
  kitchen: { password: process.env.KITCHEN_PASSWORD || "kitchen1234", role: "kitchen" },
};

export function login(req: Request, res: Response): void {
  const { username, password } = req.body || {};
  if (!username || !password) { res.status(400).json({ error: "Username and password are required" }); return; }
  const cred = CREDENTIALS[username as string];
  if (!cred || cred.password !== password) { res.status(401).json({ error: "Invalid credentials" }); return; }
  const token = jwt.sign({ username, role: cred.role }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, role: cred.role });
}

export function verify(req: Request, res: Response): void {
  const { token } = req.body || {};
  if (!token) { res.status(400).json({ error: "Token required" }); return; }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, payload: decoded });
  } catch {
    res.status(401).json({ valid: false, error: "Invalid or expired token" });
  }
}
