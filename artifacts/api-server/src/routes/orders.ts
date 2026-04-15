import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable, tablesTable } from "@workspace/db";
import {
  CreateOrderBody,
  GetOrdersQueryParams,
  GetOrderParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  GetOrderBillParams,
} from "@workspace/api-zod";

const TAX_RATE = 0.05; // 5% GST

const router: IRouter = Router();

async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;

  const [table] = await db.select().from(tablesTable).where(eq(tablesTable.id, order.tableId));
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

  return {
    ...order,
    tableNumber: table?.tableNumber ?? 0,
    items,
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const queryParams = GetOrdersQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  let query = db.select().from(ordersTable).$dynamic();

  if (queryParams.data.tableId !== undefined) {
    query = query.where(eq(ordersTable.tableId, queryParams.data.tableId));
  }

  if (queryParams.data.status) {
    query = query.where(eq(ordersTable.status, queryParams.data.status as any));
  }

  const orders = await query.orderBy(ordersTable.createdAt);

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

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tableId, items, specialInstructions } = parsed.data;

  const [table] = await db.select().from(tablesTable).where(eq(tablesTable.id, tableId));
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }

  const menuItemIds = items.map(i => i.menuItemId);
  const menuItems = await db.select().from(menuItemsTable).where(inArray(menuItemsTable.id, menuItemIds));
  const menuItemMap = new Map(menuItems.map(m => [m.id, m]));

  let subtotal = 0;
  const orderItemsData = [];
  for (const item of items) {
    const menuItem = menuItemMap.get(item.menuItemId);
    if (!menuItem) {
      res.status(400).json({ error: `Menu item ${item.menuItemId} not found` });
      return;
    }
    if (!menuItem.isAvailable) {
      res.status(400).json({ error: `Menu item ${menuItem.name} is not available` });
      return;
    }
    const unitPrice = parseFloat(menuItem.price);
    subtotal += unitPrice * item.quantity;
    orderItemsData.push({
      menuItemId: item.menuItemId,
      menuItemName: menuItem.name,
      quantity: item.quantity,
      unitPrice: menuItem.price,
      specialInstructions: item.specialInstructions ?? null,
    });
  }

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const [order] = await db.insert(ordersTable).values({
    tableId,
    status: "pending",
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    specialInstructions: specialInstructions ?? null,
  }).returning();

  const insertedItems = await db.insert(orderItemsTable).values(
    orderItemsData.map(item => ({ ...item, orderId: order.id }))
  ).returning();

  await db.update(tablesTable).set({ status: "occupied" }).where(eq(tablesTable.id, tableId));

  res.status(201).json({
    ...order,
    tableNumber: table.tableNumber,
    items: insertedItems,
  });
});

router.get("/orders/:orderId", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const order = await getOrderWithItems(params.data.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

router.patch("/orders/:orderId", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status as any, updatedAt: new Date() })
    .where(eq(ordersTable.id, params.data.orderId))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (parsed.data.status === "completed" || parsed.data.status === "cancelled") {
    await db.update(tablesTable).set({ status: "available" }).where(eq(tablesTable.id, order.tableId));
  }

  const result = await getOrderWithItems(order.id);
  res.json(result);
});

router.get("/orders/:orderId/bill", async (req, res): Promise<void> => {
  const params = GetOrderBillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await getOrderWithItems(params.data.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json({
    orderId: order.id,
    tableNumber: order.tableNumber,
    items: order.items,
    subtotal: order.subtotal,
    taxRate: TAX_RATE.toString(),
    tax: order.tax,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
  });
});

export default router;
