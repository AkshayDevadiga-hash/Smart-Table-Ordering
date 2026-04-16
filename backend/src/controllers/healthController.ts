import { Request, Response } from "express";
import { HealthCheckResponse } from "../validation/schemas";

export function healthCheck(_req: Request, res: Response): void {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
}
