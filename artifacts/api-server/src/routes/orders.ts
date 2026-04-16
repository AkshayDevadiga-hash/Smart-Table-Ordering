import { Router, type IRouter } from "express";
import { eq, inArray, desc, sql } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable, tablesTable } from "@workspace/db";
import {
  CreateOrderBody,
  GetOrdersQueryParams,
  GetOrderParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  GetOrderBillParams,
} from "@workspace/api-zod";

const TAX_RATE = 0.18;

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

router.get("/orders/current", async (req, res): Promise<void> => {
  const tableId = Number(req.query.tableId);
  if (!Number.isInteger(tableId) || tableId <= 0) {
    res.status(400).json({ error: "Valid tableId is required" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(sql`table_id = ${tableId} and payment_status = 'pending' and status not in ('completed', 'cancelled')`)
    .orderBy(desc(ordersTable.createdAt))
    .limit(1);

  if (!order) {
    res.status(204).send();
    return;
  }

  const result = await getOrderWithItems(order.id);
  res.json(result);
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tableId, items, specialInstructions } = parsed.data;
  if (!items.length) {
    res.status(400).json({ error: "Order must contain at least one item" });
    return;
  }

  const [table] = await db.select().from(tablesTable).where(eq(tablesTable.id, tableId));
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }

  const menuItemIds = items.map(i => i.menuItemId);
  const menuItems = await db.select().from(menuItemsTable).where(inArray(menuItemsTable.id, menuItemIds));
  const menuItemMap = new Map(menuItems.map(m => [m.id, m]));

  let newSubtotal = 0;
  const orderItemsData = [];
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({ error: "Item quantity must be a positive whole number" });
      return;
    }
    const menuItem = menuItemMap.get(item.menuItemId);
    if (!menuItem) {
      res.status(400).json({ error: `Menu item ${item.menuItemId} not found` });
      return;
    }
    if (!menuItem.isAvailable) {
      res.status(400).json({ error: `Menu item ${menuItem.name} is not available` });
      return;
    }
    const unitPrice = Number(menuItem.price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      res.status(400).json({ error: `Menu item ${menuItem.name} has an invalid price` });
      return;
    }
    newSubtotal += unitPrice * quantity;
    orderItemsData.push({
      menuItemId: item.menuItemId,
      menuItemName: menuItem.name,
      quantity,
      unitPrice: menuItem.price,
      specialInstructions: item.specialInstructions ?? null,
    });
  }

  // Check for an existing active (unpaid, not completed/cancelled) order for this table
  const [existingOrder] = await db
    .select()
    .from(ordersTable)
    .where(sql`table_id = ${tableId} and payment_status = 'pending' and status not in ('completed', 'cancelled')`)
    .orderBy(desc(ordersTable.createdAt))
    .limit(1);

  if (existingOrder) {
    // Append items to the existing order and update totals
    const insertedItems = await db.insert(orderItemsTable).values(
      orderItemsData.map(item => ({ ...item, orderId: existingOrder.id }))
    ).returning();

    const prevSubtotal = Number(existingOrder.subtotal);
    const mergedSubtotal = prevSubtotal + newSubtotal;
    const mergedTax = mergedSubtotal * TAX_RATE;
    const mergedTotal = mergedSubtotal + mergedTax;

    const [updatedOrder] = await db
      .update(ordersTable)
      .set({
        subtotal: mergedSubtotal.toFixed(2),
        tax: mergedTax.toFixed(2),
        total: mergedTotal.toFixed(2),
        updatedAt: new Date(),
        ...(specialInstructions ? { specialInstructions } : {}),
      })
      .where(eq(ordersTable.id, existingOrder.id))
      .returning();

    const allItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, existingOrder.id));

    res.status(201).json({
      ...updatedOrder,
      tableNumber: table.tableNumber,
      items: allItems,
      merged: true,
    });
    return;
  }

  // No existing order — create a new one
  const tax = newSubtotal * TAX_RATE;
  const total = newSubtotal + tax;

  const [order] = await db.insert(ordersTable).values({
    tableId,
    status: "pending",
    paymentStatus: "pending",
    subtotal: newSubtotal.toFixed(2),
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

router.patch("/orders/:orderId/payment", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (req.body?.paymentStatus !== "paid") {
    res.status(400).json({ error: "paymentStatus must be paid" });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ paymentStatus: "paid", updatedAt: new Date() })
    .where(eq(ordersTable.id, params.data.orderId))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
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
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
  });
});

export default router;
