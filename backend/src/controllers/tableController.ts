import { Request, Response } from "express";
import * as tableService from "../services/tableService";
import { CreateTableBody, GetTableParams } from "../validation/schemas";

export async function getTables(_req: Request, res: Response): Promise<void> {
  const tables = await tableService.getTables();
  res.json(tables);
}

export async function createTable(req: Request, res: Response): Promise<void> {
  const parsed = CreateTableBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const table = await tableService.createTable(parsed.data);
  res.status(201).json(table);
}

export async function getTable(req: Request, res: Response): Promise<void> {
  const params = GetTableParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const table = await tableService.getTableById(params.data.tableId);
  if (!table) { res.status(404).json({ error: "Table not found" }); return; }
  res.json(table);
}
