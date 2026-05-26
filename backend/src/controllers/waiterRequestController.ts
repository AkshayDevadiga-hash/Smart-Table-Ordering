import { Request, Response } from "express";
import * as waiterRequestService from "../services/waiterRequestService";
import * as orderService from "../services/orderService";

export async function createWaiterRequest(req: Request, res: Response): Promise<void> {
  const { tableId, orderId, type, note } = req.body;
  if (!tableId || !Number.isInteger(Number(tableId))) {
    res.status(400).json({ error: "Valid tableId is required" });
    return;
  }
  if (!["assistance", "cash_collection"].includes(type)) {
    res.status(400).json({ error: "type must be assistance or cash_collection" });
    return;
  }
  const result = await waiterRequestService.createWaiterRequest({
    tableId: Number(tableId),
    orderId: orderId ? Number(orderId) : null,
    type: type as "assistance" | "cash_collection",
    note: note ?? null,
  });
  res.status(201).json(result.request);
}

export async function listWaiterRequests(req: Request, res: Response): Promise<void> {
  const { type, status, tableId } = req.query;
  const requests = await waiterRequestService.listWaiterRequests({
    type: typeof type === "string" ? type : undefined,
    status: typeof status === "string" ? status : undefined,
    tableId: tableId ? Number(tableId) : undefined,
  });
  res.json(requests);
}

export async function updateWaiterRequest(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Valid id is required" });
    return;
  }
  const { status } = req.body;
  if (!["acknowledged", "resolved"].includes(status)) {
    res.status(400).json({ error: "status must be acknowledged or resolved" });
    return;
  }
  const updated = await waiterRequestService.updateWaiterRequest(id, status);
  if (!updated) { res.status(404).json({ error: "Request not found" }); return; }
  res.json(updated);
}

export async function confirmCashPayment(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Valid id is required" });
    return;
  }
  const updated = await waiterRequestService.updateWaiterRequest(id, "resolved");
  if (!updated) { res.status(404).json({ error: "Request not found" }); return; }

  if (updated.orderId) {
    await orderService.markOrderPaid(updated.orderId, "cash");
  }
  res.json(updated);
}
