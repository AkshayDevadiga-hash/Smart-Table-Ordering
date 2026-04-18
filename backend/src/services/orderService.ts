import { eq, inArray, desc, sql } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, menuItemsTable, tablesTable } from "../db/index";

export const TAX_RATE = 0.18;

export async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;
  const [table] = await db.select().from(tablesTable).where(eq(tablesTable.id, order.tableId));
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  return { ...order, tableNumber: table?.tableNumber ?? 0, items };
}

export async function listOrders(filters: { tableId?: number; status?: string }) {
  let query = db.select().from(ordersTable).$dynamic();
  if (filters.tableId !== undefined) query = query.where(eq(ordersTable.tableId, filters.tableId));
  if (filters.status) query = query.where(eq(ordersTable.status, filters.status as any));
  const orders = await query.orderBy(ordersTable.createdAt);

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

export async function getCurrentOrder(tableId: number) {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(sql`table_id = ${tableId} and payment_status = 'pending' and status not in ('completed', 'cancelled')`)
    .orderBy(desc(ordersTable.createdAt))
    .limit(1);
  if (!order) return null;
  return getOrderWithItems(order.id);
}

export async function createOrder(data: {
  tableId: number;
  items: { menuItemId: number; quantity: number; specialInstructions?: string | null }[];
  specialInstructions?: string | null;
}) {
  const { tableId, items, specialInstructions } = data;

  const [table] = await db.select().from(tablesTable).where(eq(tablesTable.id, tableId));
  if (!table) return { error: "Table not found" as const };

  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await db.select().from(menuItemsTable).where(inArray(menuItemsTable.id, menuItemIds));
  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  let newSubtotal = 0;
  const orderItemsData: { menuItemId: number; menuItemName: string; quantity: number; unitPrice: string; specialInstructions: string | null }[] = [];

  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) return { error: "Item quantity must be a positive whole number" as const };
    const menuItem = menuItemMap.get(item.menuItemId);
    if (!menuItem) return { error: `Menu item ${item.menuItemId} not found` as const };
    if (!menuItem.isAvailable) return { error: `Menu item ${menuItem.name} is not available` as const };
    const unitPrice = Number(menuItem.price);
    newSubtotal += unitPrice * quantity;
    orderItemsData.push({
      menuItemId: item.menuItemId,
      menuItemName: menuItem.name,
      quantity,
      unitPrice: menuItem.price,
      specialInstructions: item.specialInstructions ?? null,
    });
  }

  const [existingOrder] = await db
    .select()
    .from(ordersTable)
    .where(sql`table_id = ${tableId} and payment_status = 'pending' and status not in ('completed', 'cancelled')`)
    .orderBy(desc(ordersTable.createdAt))
    .limit(1);

  if (existingOrder) {
    await db.insert(orderItemsTable).values(orderItemsData.map((item) => ({ ...item, orderId: existingOrder.id }))).returning();
    const prevSubtotal = Number(existingOrder.subtotal);
    const merged = prevSubtotal + newSubtotal;
    const mergedTax = merged * TAX_RATE;
    const [updatedOrder] = await db
      .update(ordersTable)
      .set({
        subtotal: merged.toFixed(2),
        tax: mergedTax.toFixed(2),
        total: (merged + mergedTax).toFixed(2),
        updatedAt: new Date(),
        ...(specialInstructions ? { specialInstructions } : {}),
      })
      .where(eq(ordersTable.id, existingOrder.id))
      .returning();
    const allItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, existingOrder.id));
    return { order: { ...updatedOrder, tableNumber: table.tableNumber, items: allItems, merged: true } };
  }

  const tax = newSubtotal * TAX_RATE;
  const [order] = await db.insert(ordersTable).values({
    tableId,
    status: "pending",
    paymentStatus: "pending",
    subtotal: newSubtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: (newSubtotal + tax).toFixed(2),
    specialInstructions: specialInstructions ?? null,
  }).returning();

  const insertedItems = await db.insert(orderItemsTable).values(orderItemsData.map((item) => ({ ...item, orderId: order.id }))).returning();
  await db.update(tablesTable).set({ status: "occupied" }).where(eq(tablesTable.id, tableId));

  return { order: { ...order, tableNumber: table.tableNumber, items: insertedItems } };
}

const NON_CANCELLABLE_STATUSES = ["preparing", "ready", "delivered", "completed"];

export async function updateOrderStatus(orderId: number, status: string): Promise<{ error: string } | Awaited<ReturnType<typeof getOrderWithItems>> | null> {
  const [currentOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!currentOrder) return null;

  if (status === "cancelled") {
    if (currentOrder.paymentStatus === "paid") {
      return { error: "Cannot cancel an order that has already been paid" };
    }
    if (NON_CANCELLABLE_STATUSES.includes(currentOrder.status)) {
      return { error: `Cannot cancel an order that is already ${currentOrder.status}` };
    }
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(ordersTable.id, orderId))
    .returning();
  if (!order) return null;
  if (status === "completed" || status === "cancelled") {
    await db.update(tablesTable).set({ status: "available" }).where(eq(tablesTable.id, order.tableId));
  }
  return getOrderWithItems(order.id);
}

export async function markOrderPaid(orderId: number) {
  const [order] = await db
    .update(ordersTable)
    .set({ paymentStatus: "paid", updatedAt: new Date() })
    .where(eq(ordersTable.id, orderId))
    .returning();
  if (!order) return null;
  return getOrderWithItems(order.id);
}
