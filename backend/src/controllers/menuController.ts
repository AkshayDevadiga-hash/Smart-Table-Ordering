import { Request, Response } from "express";
import * as menuService from "../services/menuService";
import {
  CreateMenuCategoryBody, UpdateMenuCategoryParams, UpdateMenuCategoryBody, DeleteMenuCategoryParams,
  GetMenuItemsQueryParams, CreateMenuItemBody, UpdateMenuItemParams, UpdateMenuItemBody, DeleteMenuItemParams,
} from "../validation/schemas";

export async function uploadImage(req: Request, res: Response): Promise<void> {
  if (!req.file) { res.status(400).json({ error: "No image file provided" }); return; }
  res.json({ url: `/uploads/${req.file.filename}` });
}

export async function getCategories(_req: Request, res: Response): Promise<void> {
  const categories = await menuService.getOrSeedCategories();
  res.json(categories);
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const parsed = CreateMenuCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const category = await menuService.createCategory(parsed.data);
  res.status(201).json(category);
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const params = UpdateMenuCategoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateMenuCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const category = await menuService.updateCategory(params.data.categoryId, parsed.data);
  if (!category) { res.status(404).json({ error: "Category not found" }); return; }
  res.json(category);
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const params = DeleteMenuCategoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const category = await menuService.deleteCategory(params.data.categoryId);
  if (!category) { res.status(404).json({ error: "Category not found" }); return; }
  res.sendStatus(204);
}

export async function getItems(req: Request, res: Response): Promise<void> {
  const queryParams = GetMenuItemsQueryParams.safeParse(req.query);
  if (!queryParams.success) { res.status(400).json({ error: queryParams.error.message }); return; }
  const items = await menuService.getItems(queryParams.data);
  res.json(items);
}

export async function createItem(req: Request, res: Response): Promise<void> {
  const parsed = CreateMenuItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const item = await menuService.createItem(parsed.data);
  res.status(201).json(item);
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  const params = UpdateMenuItemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateMenuItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const item = await menuService.updateItem(params.data.itemId, parsed.data);
  if (!item) { res.status(404).json({ error: "Menu item not found" }); return; }
  res.json(item);
}

export async function deleteItem(req: Request, res: Response): Promise<void> {
  const params = DeleteMenuItemParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const item = await menuService.deleteItem(params.data.itemId);
  if (!item) { res.status(404).json({ error: "Menu item not found" }); return; }
  res.sendStatus(204);
}
