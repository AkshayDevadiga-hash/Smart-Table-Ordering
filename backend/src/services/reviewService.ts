import { eq, desc, gte, lte, and } from "drizzle-orm";
import { db, reviewsTable, ordersTable } from "../db/index";

export async function createReview(orderId: number, rating: number, comment: string | null) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return { error: "Order not found" as const };

  const existing = await db.select().from(reviewsTable).where(eq(reviewsTable.orderId, orderId));
  if (existing.length > 0) return { error: "Review already submitted for this order" as const };

  const [review] = await db.insert(reviewsTable).values({ orderId, rating, comment: comment ?? null }).returning();
  return { review };
}

export async function listReviews(filters: { rating?: number; from?: string; to?: string }) {
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

  return reviews;
}
