import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tableorder-secret-key-2024";

export function requireAuth(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : (req.cookies?.token as string | undefined);

    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { username: string; role: string };
      if (roles.length && !roles.includes(payload.role)) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }
      (req as Request & { user: typeof payload }).user = payload;
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}
