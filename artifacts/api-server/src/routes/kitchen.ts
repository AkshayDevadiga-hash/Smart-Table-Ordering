import { Router, type IRouter } from "express";
import { inArray, not, eq } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, tablesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/kitchen/active-orders", async (_req, res): Promise<void> => {
  const activeStatuses = ["pending", "received", "preparing", "ready"];

  const orders = await db
    .select()
    .from(ordersTable)
    .where(inArray(ordersTable.status, activeStatuses as any[]))
    .orderBy(ordersTable.createdAt);

  const tableIds = [...new Set(orders.map(o => o.tableId))];
  const tables = tableIds.length > 0
    ? await db.select().from(tablesTable).where(inArray(tablesTable.id, tableIds))
    : [];
  const tableMap = new Map(tables.map(t => [t.id, t]));

  const orderIds = orders.map(o => o.id);
  const allItems = orderIds.length > 0
    ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orderIds))
    : [];
  const itemsMap = new Map<number, typeof allItems>();
  for (const item of allItems) {
    if (!itemsMap.has(item.orderId)) itemsMap.set(item.orderId, []);
    itemsMap.get(item.orderId)!.push(item);
  }

  const result = orders.map(order => ({
    ...order,
    tableNumber: tableMap.get(order.tableId)?.tableNumber ?? 0,
    items: itemsMap.get(order.id) ?? [],
  }));

  res.json(result);
});

export default router;
