import { eq, asc } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { db, menuCategoriesTable, menuItemsTable } from "../db/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e6) + ext);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const DEFAULT_CATEGORIES = [
  { name: "Starters", description: "Small plates to begin the meal", sortOrder: 1 },
  { name: "Mains", description: "Signature kitchen favorites", sortOrder: 2 },
  { name: "Desserts", description: "Sweet finishes", sortOrder: 3 },
  { name: "Beverages", description: "Refreshing drinks", sortOrder: 4 },
];

export async function getCategories() {
  return db.select().from(menuCategoriesTable).orderBy(asc(menuCategoriesTable.sortOrder));
}

export async function getOrSeedCategories() {
  let categories = await getCategories();
  if (categories.length === 0) {
    categories = await db.insert(menuCategoriesTable).values(DEFAULT_CATEGORIES).returning();
  }
  return categories;
}

export async function createCategory(data: { name: string; description?: string | null; sortOrder: number }) {
  const [category] = await db.insert(menuCategoriesTable).values(data).returning();
  return category;
}

export async function updateCategory(id: number, data: { name: string; description?: string | null; sortOrder: number }) {
  const [category] = await db
    .update(menuCategoriesTable)
    .set(data)
    .where(eq(menuCategoriesTable.id, id))
    .returning();
  return category ?? null;
}

export async function deleteCategory(id: number) {
  const [category] = await db
    .delete(menuCategoriesTable)
    .where(eq(menuCategoriesTable.id, id))
    .returning();
  return category ?? null;
}

export async function getItems(filters: { categoryId?: number; available?: boolean }) {
  let query = db.select().from(menuItemsTable).$dynamic();
  if (filters.categoryId !== undefined) query = query.where(eq(menuItemsTable.categoryId, filters.categoryId));
  if (filters.available !== undefined) query = query.where(eq(menuItemsTable.isAvailable, filters.available));
  return query.orderBy(asc(menuItemsTable.sortOrder));
}

export async function createItem(data: Record<string, unknown>) {
  const [item] = await db.insert(menuItemsTable).values(data as any).returning();
  return item;
}

export async function updateItem(id: number, data: Record<string, unknown>) {
  const [item] = await db.update(menuItemsTable).set(data as any).where(eq(menuItemsTable.id, id)).returning();
  return item ?? null;
}

export async function deleteItem(id: number) {
  const [item] = await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id)).returning();
  return item ?? null;
}
