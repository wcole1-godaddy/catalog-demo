import { z } from "zod";

export const ProductList = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().or(z.null()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().or(z.null()).optional(),
});
export type ProductList = z.infer<typeof ProductList>;

export const ProductListInput = ProductList.omit({
  id: true,
  storeId: true,
  createdAt: true,
  updatedAt: true,
});
export type ProductListInput = z.infer<typeof ProductListInput>;

export const ProductLists = z.array(ProductList);
export type ProductLists = z.infer<typeof ProductLists>;

export const ProductListWithItems = ProductList.extend({
  productListItems: z.any(),
});
export type ProductListWithItems = z.infer<typeof ProductListWithItems>;

export const ProductListsWithItems = z.array(ProductListWithItems);
export type ProductListsWithItems = z.infer<typeof ProductListsWithItems>;
