import { z } from "zod";

export const Product = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  description: z.string().or(z.null()).optional(),
  sku: z.string(),
  ean: z.string().or(z.null()).optional(),
  type: z.enum(["PHYSICAL", "DIGITAL", "SERVICE", "GIFTCARD"]),
  status: z.enum(["ACTIVE", "DRAFT"]),
  price: z.coerce.number(),
  taxCategory: z.string().or(z.null()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});
export type Product = z.infer<typeof Product>;
export const Products = z.array(Product);
export type Products = z.infer<typeof Products>;

export const ProductWithListItems = Product.extend({
  productListItems: z.any(),
});
export type ProductWithListItems = z.infer<typeof ProductWithListItems>;

export const ProductsWithListItems = z.array(ProductWithListItems);
export type ProductsWithListItems = z.infer<typeof ProductsWithListItems>;
