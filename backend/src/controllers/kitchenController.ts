import { Request, Response } from "express";
import * as kitchenService from "../services/kitchenService";

export async function getActiveOrders(_req: Request, res: Response): Promise<void> {
  const orders = await kitchenService.getActiveOrders();
  res.json(orders);
}
