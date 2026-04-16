import { eq } from "drizzle-orm";
import { db, tablesTable } from "../db/index";

export async function getTables() {
  return db.select().from(tablesTable).orderBy(tablesTable.tableNumber);
}

export async function createTable(data: { tableNumber: number; capacity: number }) {
  const qrCode = `/menu/${data.tableNumber}`;
  const [table] = await db.insert(tablesTable).values({ ...data, qrCode, status: "available" }).returning();
  return table;
}

export async function getTableById(id: number) {
  const [table] = await db.select().from(tablesTable).where(eq(tablesTable.id, id));
  return table ?? null;
}
