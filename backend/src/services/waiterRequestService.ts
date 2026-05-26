import { eq, and, desc, inArray, ne } from "drizzle-orm";
import { db, waiterRequestsTable, tablesTable, ordersTable } from "../db/index";

export async function createWaiterRequest(data: {
  tableId: number;
  orderId?: number | null;
  type: "assistance" | "cash_collection";
  note?: string | null;
}) {
  if (data.type === "cash_collection" && data.orderId) {
    const [existing] = await db
      .select()
      .from(waiterRequestsTable)
      .where(
        and(
          eq(waiterRequestsTable.orderId, data.orderId),
          eq(waiterRequestsTable.type, "cash_collection"),
          ne(waiterRequestsTable.status, "resolved"),
        ),
      )
      .limit(1);
    if (existing) return { request: existing };
  }

  const [request] = await db
    .insert(waiterRequestsTable)
    .values({
      tableId: data.tableId,
      orderId: data.orderId ?? null,
      type: data.type,
      status: "pending",
      note: data.note ?? null,
      requestedAt: new Date(),
    })
    .returning();
  return { request };
}

export async function listWaiterRequests(filters: {
  type?: string;
  status?: string;
  tableId?: number;
}) {
  const conditions: ReturnType<typeof eq>[] = [];
  if (filters.type) conditions.push(eq(waiterRequestsTable.type, filters.type as any));
  if (filters.status) conditions.push(eq(waiterRequestsTable.status, filters.status as any));
  if (filters.tableId) conditions.push(eq(waiterRequestsTable.tableId, filters.tableId));

  let query = db.select().from(waiterRequestsTable).$dynamic();
  if (conditions.length) query = query.where(and(...conditions));
  const requests = await query.orderBy(desc(waiterRequestsTable.requestedAt));

  const tableIds = [...new Set(requests.map((r) => r.tableId))];
  const tables =
    tableIds.length > 0
      ? await db.select().from(tablesTable).where(inArray(tablesTable.id, tableIds))
      : [];
  const tableMap = new Map(tables.map((t) => [t.id, t]));

  const orderIds = requests.map((r) => r.orderId).filter(Boolean) as number[];
  const orders =
    orderIds.length > 0
      ? await db.select().from(ordersTable).where(inArray(ordersTable.id, orderIds))
      : [];
  const orderMap = new Map(orders.map((o) => [o.id, o]));

  return requests.map((r) => ({
    ...r,
    tableNumber: tableMap.get(r.tableId)?.tableNumber ?? 0,
    orderTotal: r.orderId ? (orderMap.get(r.orderId)?.total ?? null) : null,
  }));
}

export async function updateWaiterRequest(
  id: number,
  status: "acknowledged" | "resolved",
) {
  const [existing] = await db
    .select()
    .from(waiterRequestsTable)
    .where(eq(waiterRequestsTable.id, id));
  if (!existing) return null;

  const now = new Date();
  const [updated] = await db
    .update(waiterRequestsTable)
    .set({
      status,
      ...(status === "acknowledged" ? { acknowledgedAt: now } : {}),
      ...(status === "resolved" ? { resolvedAt: now } : {}),
    })
    .where(eq(waiterRequestsTable.id, id))
    .returning();
  return updated;
}
