import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tablesTable } from "@workspace/db";
import { CreateTableBody, GetTableParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tables", async (_req, res): Promise<void> => {
  const tables = await db
    .select()
    .from(tablesTable)
    .orderBy(tablesTable.tableNumber);
  res.json(tables);
});

router.post("/tables", async (req, res): Promise<void> => {
  const parsed = CreateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { tableNumber, capacity } = parsed.data;
  const qrCode = `/menu/${tableNumber}`;
  const [table] = await db.insert(tablesTable).values({
    tableNumber,
    capacity,
    qrCode,
    status: "available",
  }).returning();
  res.status(201).json(table);
});

router.get("/tables/:tableId", async (req, res): Promise<void> => {
  const params = GetTableParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [table] = await db
    .select()
    .from(tablesTable)
    .where(eq(tablesTable.id, params.data.tableId));
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  res.json(table);
});

export default router;
