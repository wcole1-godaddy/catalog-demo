import { z } from "zod";
import { createApiDefinition } from "@gdcorp-commerce/builder";
import {
  Product,
  ProductList,
  ProductListItem,
  ProductListItemInput,
  ProductListItems,
  ProductListWithItems,
  ProductListsWithItems,
} from "./services/catalog/entities";

export const apiDefinition = createApiDefinition({
  "/health": {
    get: {
      alias: "health",
      description: "Health check",
      summary: "Health check",
      response: z.object({ status: z.literal("ok") }),
    },
  },
  "/v2/commerce/stores/:storeId/products": {
    get: {
      alias: "getProducts",
      description: "Get all products",
      summary: "Get products",
      params: z.object({ storeId: z.string() }),
      query: z.object({
        include: z.enum(["product-list-items"]).optional(),
        page: z.coerce.number().optional(),
        pageSize: z.coerce.number().optional().default(50),
      }),
      response: z.object({ products: z.array(Product) }),
      scopes: ["commerce.product:read"],
    },
    post: {
      alias: "createProduct",
      description: "Create a product",
      summary: "Create a product",
      params: z.object({ storeId: z.string() }),
      body: Product.omit({
        id: true,
        storeId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }),
      response: Product,
      scopes: ["commerce.product:write"],
    },
  },
  "/v2/commerce/stores/:storeId/product-batches": {
    post: {
      alias: "createProductBatch",
      description: "Batch Create Products",
      summary: "Batch create",
      params: z.object({ storeId: z.string() }),
      body: z.object({
        action: z.enum(["CREATE", "UPDATE"]),
        data: z.array(
          Product.partial({
            id: true,
            storeId: true,
            createdAt: true,
            updatedAt: true,
            status: true,
          }),
        ),
      }),
      response: z.any(),
    },
  },
  "/v2/commerce/stores/:storeId/products/:id": {
    delete: {
      alias: "deleteProduct",
      description: "Delete a product",
      summary: "Delete a product",
      params: z.object({ storeId: z.string(), id: z.string() }),
      response: Product,
    },
    put: {
      alias: "updateProduct",
      description: "Update a product",
      summary: "Update a product",
      params: z.object({ storeId: z.string(), id: z.string() }),
      body: Product.omit({
        id: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      }),
      response: Product,
    },
    get: {
      alias: "getProduct",
      description: "Get a product",
      summary: "Get a product",
      params: z.object({ storeId: z.string(), id: z.string() }),
      query: z.object({
        include: z.enum(["product-list-items"]).optional(),
      }),
      response: Product,
    },
  },
  "/v2/commerce/stores/:storeId/product-lists": {
    get: {
      alias: "getProductLists",
      description: "Get all product lists",
      summary: "Get product lists",
      params: z.object({ storeId: z.string() }),
      query: z.object({
        include: z.enum(["product-list-items"]).optional(),
        ids: z.string().optional(),
      }),
      response: z.object({ productLists: ProductListsWithItems }),
    },
    post: {
      alias: "createProductList",
      description: "Create a product list",
      summary: "Create a product list",
      params: z.object({ storeId: z.string() }),
      body: ProductList.omit({
        id: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      }),
      response: ProductList,
    },
  },
  "/v2/commerce/stores/:storeId/product-lists/:id": {
    get: {
      alias: "getProductList",
      description: "Get a product list",
      summary: "Get a product list",
      params: z.object({ storeId: z.string(), id: z.string() }),
      query: z.object({
        include: z.enum(["product-list-items"]).optional(),
      }),
      response: ProductListWithItems,
    },
    put: {
      alias: "updateProductList",
      description: "Update a product list",
      summary: "Update a product list",
      params: z.object({ storeId: z.string(), id: z.string() }),
      body: ProductList.omit({
        id: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      }),
      response: ProductList,
    },
    delete: {
      alias: "deleteProductList",
      description: "Delete a product list",
      summary: "Delete a product list",
      params: z.object({ storeId: z.string(), id: z.string() }),
      response: ProductList,
    },
  },
  "/v2/commerce/stores/:storeId/product-list-items": {
    get: {
      alias: "getProductListItems",
      description: "Get all product list items",
      summary: "Get product list items",
      params: z.object({ storeId: z.string() }),
      query: z.object({
        productListId: z.string().optional(),
      }),
      response: z.object({ productListItems: ProductListItems }),
    },
    post: {
      alias: "createProductListItem",
      description: "Create a product list item",
      summary: "Create a product list item",
      params: z.object({ storeId: z.string() }),
      body: ProductListItemInput,
      response: ProductListItem,
    },
  },
  "/v2/commerce/stores/:storeId/product-list-item-batches": {
    post: {
      alias: "createProductListItemBatch",
      description: "Batch Create Product List Items",
      summary: "Batch create",
      params: z.object({ storeId: z.string() }),
      body: z.object({
        action: z.enum(["CREATE", "UPDATE"]),
        data: z.array(
          ProductListItem.partial({
            id: true,
            storeId: true,
            createdAt: true,
            updatedAt: true,
          }),
        ),
      }),
      response: z.any(),
    },
  },
  "/v2/commerce/stores/:storeId/product-list-items/:id": {
    get: {
      alias: "getProductListItem",
      description: "Get a product list item",
      summary: "Get a product list item",
      params: z.object({ storeId: z.string(), id: z.string() }),
      response: ProductListItem,
    },
    put: {
      alias: "updateProductListItem",
      description: "Update a product list item",
      summary: "Update a product list item",
      params: z.object({ storeId: z.string(), id: z.string() }),
      body: ProductListItemInput,
      response: ProductListItem,
    },
    delete: {
      alias: "deleteProductListItem",
      description: "Delete a product list item",
      summary: "Delete a product list item",
      params: z.object({ storeId: z.string(), id: z.string() }),
      response: ProductListItem,
    },
  },
});
