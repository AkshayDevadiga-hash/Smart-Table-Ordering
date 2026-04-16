import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { db, menuCategoriesTable, menuItemsTable } from "@workspace/db";
import {
  CreateMenuCategoryBody,
  UpdateMenuCategoryBody,
  UpdateMenuCategoryParams,
  DeleteMenuCategoryParams,
  GetMenuItemsQueryParams,
  CreateMenuItemBody,
  UpdateMenuItemBody,
  UpdateMenuItemParams,
  DeleteMenuItemParams,
} from "@workspace/api-zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + "-" + Math.round(Math.random() * 1e6) + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const router: IRouter = Router();

router.post("/menu/upload", upload.single("image"), (req, res): void => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

const DEFAULT_CATEGORIES = [
  {
    name: "Starters",
    description: "Small plates to begin the meal",
    sortOrder: 1,
  },
  {
    name: "Mains",
    description: "Signature kitchen favorites",
    sortOrder: 2,
  },
  {
    name: "Desserts",
    description: "Sweet finishes",
    sortOrder: 3,
  },
  {
    name: "Beverages",
    description: "Refreshing drinks",
    sortOrder: 4,
  },
];

async function getCategories() {
  return db
    .select()
    .from(menuCategoriesTable)
    .orderBy(asc(menuCategoriesTable.sortOrder));
}

router.get("/menu/categories", async (_req, res): Promise<void> => {
  let categories = await getCategories();
  if (categories.length === 0) {
    categories = await db
      .insert(menuCategoriesTable)
      .values(DEFAULT_CATEGORIES)
      .returning();
  }
  res.json(categories);
});

router.post("/menu/categories", async (req, res): Promise<void> => {
  const parsed = CreateMenuCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [category] = await db.insert(menuCategoriesTable).values(parsed.data).returning();
  res.status(201).json(category);
});

router.put("/menu/categories/:categoryId", async (req, res): Promise<void> => {
  const params = UpdateMenuCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMenuCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [category] = await db
    .update(menuCategoriesTable)
    .set(parsed.data)
    .where(eq(menuCategoriesTable.id, params.data.categoryId))
    .returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(category);
});

router.delete("/menu/categories/:categoryId", async (req, res): Promise<void> => {
  const params = DeleteMenuCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [category] = await db
    .delete(menuCategoriesTable)
    .where(eq(menuCategoriesTable.id, params.data.categoryId))
    .returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/menu/items", async (req, res): Promise<void> => {
  const queryParams = GetMenuItemsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  let query = db.select().from(menuItemsTable).$dynamic();

  if (queryParams.data.categoryId !== undefined) {
    query = query.where(eq(menuItemsTable.categoryId, queryParams.data.categoryId));
  }

  if (queryParams.data.available !== undefined) {
    query = query.where(eq(menuItemsTable.isAvailable, queryParams.data.available));
  }

  const items = await query.orderBy(asc(menuItemsTable.sortOrder));
  res.json(items);
});

router.post("/menu/items", async (req, res): Promise<void> => {
  const parsed = CreateMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.insert(menuItemsTable).values(parsed.data).returning();
  res.status(201).json(item);
});

router.put("/menu/items/:itemId", async (req, res): Promise<void> => {
  const params = UpdateMenuItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db
    .update(menuItemsTable)
    .set(parsed.data)
    .where(eq(menuItemsTable.id, params.data.itemId))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.json(item);
});

router.delete("/menu/items/:itemId", async (req, res): Promise<void> => {
  const params = DeleteMenuItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db
    .delete(menuItemsTable)
    .where(eq(menuItemsTable.id, params.data.itemId))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
