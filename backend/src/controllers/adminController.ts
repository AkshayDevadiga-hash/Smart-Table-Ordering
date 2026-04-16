import { Request, Response } from "express";
import * as adminService from "../services/adminService";

export async function getStats(_req: Request, res: Response): Promise<void> {
  const stats = await adminService.getStats();
  res.json(stats);
}

export async function getReports(req: Request, res: Response): Promise<void> {
  const period = String(req.query.period ?? "daily");
  const report = await adminService.getReports(period);
  res.json(report);
}

export async function getRecentOrders(_req: Request, res: Response): Promise<void> {
  const orders = await adminService.getRecentOrders();
  res.json(orders);
}
