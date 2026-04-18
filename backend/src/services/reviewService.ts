import { eq, desc, gte, lte, and, inArray } from "drizzle-orm";
import { db, reviewsTable, ordersTable, tablesTable } from "../db/index";

export async function createReview(orderId: number, rating: number, comment: string | null) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return { error: "Order not found" as const };

  const existing = await db.select().from(reviewsTable).where(eq(reviewsTable.orderId, orderId));
  if (existing.length > 0) return { error: "Review already submitted for this order" as const };

  const [review] = await db.insert(reviewsTable).values({ orderId, rating, comment: comment ?? null }).returning();
  return { review };
}

export async function listReviews(filters: { rating?: number; tableId?: number; from?: string; to?: string }) {
  const conditions = [];
  if (filters.rating !== undefined) conditions.push(eq(reviewsTable.rating, filters.rating));
  if (filters.from) conditions.push(gte(reviewsTable.createdAt, new Date(filters.from)));
  if (filters.to) {
    const toDate = new Date(filters.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(reviewsTable.createdAt, toDate));
  }

  const reviews = conditions.length > 0
    ? await db.select().from(reviewsTable).where(and(...conditions)).orderBy(desc(reviewsTable.createdAt))
    : await db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt));

  if (!reviews.length) return [];

  const orderIds = [...new Set(reviews.map(r => r.orderId))];
  const orders = await db.select().from(ordersTable).where(inArray(ordersTable.id, orderIds));

  const tableIds = [...new Set(orders.map(o => o.tableId))];
  const tables = tableIds.length > 0
    ? await db.select().from(tablesTable).where(inArray(tablesTable.id, tableIds))
    : [];

  const orderMap = new Map(orders.map(o => [o.id, o]));
  const tableMap = new Map(tables.map(t => [t.id, t]));

  const enriched = reviews.map(r => {
    const order = orderMap.get(r.orderId);
    const table = order ? tableMap.get(order.tableId) : undefined;
    return { ...r, tableId: order?.tableId ?? null, tableNumber: table?.tableNumber ?? null };
  });

  if (filters.tableId !== undefined) {
    return enriched.filter(r => r.tableId === filters.tableId);
  }

  return enriched;
}
