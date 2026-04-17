import { Router } from "express";
import * as menuController from "../controllers/menuController";
import { upload } from "../services/menuService";

const router: Router = Router();

router.post("/menu/upload", upload.single("image"), menuController.uploadImage);
router.get("/menu/categories", menuController.getCategories);
router.post("/menu/categories", menuController.createCategory);
router.put("/menu/categories/:categoryId", menuController.updateCategory);
router.delete("/menu/categories/:categoryId", menuController.deleteCategory);
router.get("/menu/items", menuController.getItems);
router.post("/menu/items", menuController.createItem);
router.put("/menu/items/:itemId", menuController.updateItem);
router.delete("/menu/items/:itemId", menuController.deleteItem);

export default router;
