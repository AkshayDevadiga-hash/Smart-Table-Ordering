import { Request, Response } from "express";
import * as orderService from "../services/orderService";
import {
  GetOrdersQueryParams, CreateOrderBody, GetOrderParams, GetOrderBillParams,
  UpdateOrderStatusParams, UpdateOrderStatusBody,
} from "../validation/schemas";

export async function listOrders(req: Request, res: Response): Promise<void> {
  const queryParams = GetOrdersQueryParams.safeParse(req.query);
  if (!queryParams.success) { res.status(400).json({ error: queryParams.error.message }); return; }
  const orders = await orderService.listOrders(queryParams.data);
  res.json(orders);
}

export async function getCurrentOrder(req: Request, res: Response): Promise<void> {
  const tableId = Number(req.query.tableId);
  if (!Number.isInteger(tableId) || tableId <= 0) {
    res.status(400).json({ error: "Valid tableId is required" }); return;
  }
  const order = await orderService.getCurrentOrder(tableId);
  if (!order) { res.status(204).send(); return; }
  res.json(order);
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (!parsed.data.items.length) { res.status(400).json({ error: "Order must contain at least one item" }); return; }
  const result = await orderService.createOrder(parsed.data);
  if ("error" in result) { res.status(400).json({ error: result.error }); return; }
  res.status(201).json(result.order);
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const order = await orderService.getOrderWithItems(params.data.orderId);
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(order);
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const order = await orderService.updateOrderStatus(params.data.orderId, parsed.data.status);
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(order);
}

export async function updatePaymentStatus(req: Request, res: Response): Promise<void> {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  if (req.body?.paymentStatus !== "paid") { res.status(400).json({ error: "paymentStatus must be paid" }); return; }
  const order = await orderService.markOrderPaid(params.data.orderId);
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(order);
}

export async function getBill(req: Request, res: Response): Promise<void> {
  const params = GetOrderBillParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const order = await orderService.getOrderWithItems(params.data.orderId);
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json({
    orderId: order.id,
    tableNumber: order.tableNumber,
    items: order.items,
    subtotal: order.subtotal,
    taxRate: orderService.TAX_RATE.toString(),
    tax: order.tax,
    total: order.total,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
  });
}
