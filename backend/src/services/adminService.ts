import { eq, sql, inArray, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, tablesTable } from "../db/index";

export async function getStats() {
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
  const tablesOccupied = tables.filter((t) => t.status === "occupied").length;

  const popularItemsRaw = await db
    .select({ name: orderItemsTable.menuItemName, count: sql<number>`sum(quantity)::int` })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(eq(ordersTable.paymentStatus, "paid"))
    .groupBy(orderItemsTable.menuItemName)
    .orderBy(desc(sql`sum(quantity)`))
    .limit(5);

  return {
    totalOrdersToday: Number(ordersToday?.count ?? 0),
    totalRevenueToday: (ordersToday?.revenue ?? "0").toString(),
    activeOrders: Number(activeOrdersCount?.count ?? 0),
    tablesOccupied,
    totalTables: tables.length,
    popularItems: popularItemsRaw.map((p) => ({ name: p.name, count: Number(p.count) })),
  };
}

function startForPeriod(period: string) {
  const start = new Date();
  if (period === "weekly") start.setDate(start.getDate() - 7 * 7);
  else if (period === "monthly") start.setMonth(start.getMonth() - 11, 1);
  else if (period === "yearly") start.setFullYear(start.getFullYear() - 4, 0, 1);
  else start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return start;
}

function reportKey(date: Date, period: string) {
  if (period === "weekly") {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d.toISOString().slice(0, 10);
  }
  if (period === "monthly") return date.toISOString().slice(0, 7);
  if (period === "yearly") return date.getFullYear().toString();
  return date.toISOString().slice(0, 10);
}

export async function getReports(period: string) {
  const validPeriod = ["daily", "weekly", "monthly", "yearly"].includes(period) ? period : "daily";
  const start = startForPeriod(validPeriod);
  const paidOrders = await db
    .select()
    .from(ordersTable)
    .where(sql`payment_status = 'paid' and created_at >= ${start}`)
    .orderBy(ordersTable.createdAt);

  const groups = new Map<string, { label: string; orders: number; revenue: number }>();
  for (const order of paidOrders) {
    const label = reportKey(new Date(order.createdAt), validPeriod);
    const row = groups.get(label) ?? { label, orders: 0, revenue: 0 };
    row.orders += 1;
    row.revenue += Number(order.total) || 0;
    groups.set(label, row);
  }

  const rows = [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);

  return {
    period: validPeriod,
    totalRevenue: totalRevenue.toFixed(2),
    totalOrders,
    averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00",
    rows: rows.map((row) => ({ ...row, revenue: row.revenue.toFixed(2) })),
  };
}

export async function getRecentOrders() {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(20);

  const tableIds = [...new Set(orders.map((o) => o.tableId))];
  const tables = tableIds.length > 0
    ? await db.select().from(tablesTable).where(inArray(tablesTable.id, tableIds))
    : [];
  const tableMap = new Map(tables.map((t) => [t.id, t]));

  const orderIds = orders.map((o) => o.id);
  const allItems = orderIds.length > 0
    ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orderIds))
    : [];
  const itemsMap = new Map<number, typeof allItems>();
  for (const item of allItems) {
    if (!itemsMap.has(item.orderId)) itemsMap.set(item.orderId, []);
    itemsMap.get(item.orderId)!.push(item);
  }

  return orders.map((order) => ({
    ...order,
    tableNumber: tableMap.get(order.tableId)?.tableNumber ?? 0,
    items: itemsMap.get(order.id) ?? [],
  }));
}
