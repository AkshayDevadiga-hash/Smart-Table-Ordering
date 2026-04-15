import { Router, type IRouter } from "express";
import { eq, sql, inArray, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, tablesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [ordersToday] = await db
    .select({ count: sql<number>`count(*)`, revenue: sql<string>`coalesce(sum(total), 0)` })
    .from(ordersTable)
    .where(sql`created_at >= ${today} and payment_status = 'paid'`);

  const activeStatuses = ["pending", "received", "preparing", "ready"];
  const [activeOrdersCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(ordersTable)
    .where(inArray(ordersTable.status, activeStatuses as any[]));

  const tables = await db.select().from(tablesTable);
  const tablesOccupied = tables.filter(t => t.status === "occupied").length;

  const popularItemsRaw = await db
    .select({
      name: orderItemsTable.menuItemName,
      count: sql<number>`sum(quantity)::int`,
    })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(eq(ordersTable.paymentStatus, "paid"))
    .groupBy(orderItemsTable.menuItemName)
    .orderBy(desc(sql`sum(quantity)`))
    .limit(5);

  res.json({
    totalOrdersToday: Number(ordersToday?.count ?? 0),
    totalRevenueToday: (ordersToday?.revenue ?? "0").toString(),
    activeOrders: Number(activeOrdersCount?.count ?? 0),
    tablesOccupied,
    totalTables: tables.length,
    popularItems: popularItemsRaw.map(p => ({ name: p.name, count: Number(p.count) })),
  });
});

router.get("/admin/recent-orders", async (_req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(20);

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
