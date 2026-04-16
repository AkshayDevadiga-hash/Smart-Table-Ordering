import * as zod from "zod";

export const HealthCheckResponse = zod.object({ status: zod.string() });

export const CreateMenuCategoryBody = zod.object({
  name: zod.string(),
  description: zod.string().nullish(),
  sortOrder: zod.number(),
});
export const UpdateMenuCategoryParams = zod.object({ categoryId: zod.coerce.number() });
export const UpdateMenuCategoryBody = zod.object({
  name: zod.string(),
  description: zod.string().nullish(),
  sortOrder: zod.number(),
});
export const DeleteMenuCategoryParams = zod.object({ categoryId: zod.coerce.number() });

export const GetMenuItemsQueryParams = zod.object({
  categoryId: zod.coerce.number().optional(),
  available: zod.coerce.boolean().optional(),
});
export const CreateMenuItemBody = zod.object({
  categoryId: zod.number(),
  name: zod.string(),
  description: zod.string().nullish(),
  price: zod.string(),
  imageUrl: zod.string().nullish(),
  isAvailable: zod.boolean(),
  isVeg: zod.boolean(),
  sortOrder: zod.number(),
});
export const UpdateMenuItemParams = zod.object({ itemId: zod.coerce.number() });
export const UpdateMenuItemBody = zod.object({
  categoryId: zod.number(),
  name: zod.string(),
  description: zod.string().nullish(),
  price: zod.string(),
  imageUrl: zod.string().nullish(),
  isAvailable: zod.boolean(),
  isVeg: zod.boolean(),
  sortOrder: zod.number(),
});
export const DeleteMenuItemParams = zod.object({ itemId: zod.coerce.number() });

export const CreateTableBody = zod.object({ tableNumber: zod.number(), capacity: zod.number() });
export const GetTableParams = zod.object({ tableId: zod.coerce.number() });

export const GetOrdersQueryParams = zod.object({
  tableId: zod.coerce.number().optional(),
  status: zod.enum(["pending","received","preparing","ready","delivered","completed","cancelled"]).optional(),
});
export const CreateOrderBody = zod.object({
  tableId: zod.number(),
  items: zod.array(zod.object({
    menuItemId: zod.number(),
    quantity: zod.number(),
    specialInstructions: zod.string().nullish(),
  })),
  specialInstructions: zod.string().nullish(),
});
export const GetOrderParams = zod.object({ orderId: zod.coerce.number() });
export const GetOrderBillParams = zod.object({ orderId: zod.coerce.number() });
export const UpdateOrderStatusParams = zod.object({ orderId: zod.coerce.number() });
export const UpdateOrderStatusBody = zod.object({
  status: zod.enum(["pending","received","preparing","ready","delivered","completed","cancelled"]),
});
