import { z } from "zod";

export const ProductListItem = z.object({
  id: z.string(),
  productId: z.string(),
  productListId: z.string().default(0),
  position: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().or(z.null()).optional(),
});
export type ProductListItem = z.infer<typeof ProductListItem>;

export const ProductListItemInput = ProductListItem.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type ProductListItemInput = z.infer<typeof ProductListItemInput>;

export const ProductListItems = z.array(ProductListItem);
export type ProductListItems = z.infer<typeof ProductListItems>;
