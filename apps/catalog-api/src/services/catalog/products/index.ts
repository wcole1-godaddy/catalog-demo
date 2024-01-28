import ksuid from "ksuid";
import { and, eq } from "drizzle-orm";
import {
  Product,
  ProductWithListItems,
  ProductsWithListItems,
} from "../entities/product";
import { db } from "../../../db";
import { insertProductSchema, products } from "../../../schema";
import { takeFirst } from "../../../utils";

export async function createProduct({
  storeId,
  input,
}: {
  storeId: string;
  input: Omit<Product, "id" | "storeId" | "status" | "createdAt" | "updatedAt">;
}) {
  const id = ksuid.randomSync().string;

  const product = {
    id,
    storeId,
    status: "DRAFT",
    ...input,
  };

  const result = insertProductSchema.safeParse(product);

  if (!result.success) {
    return { status: "error", error: result.error };
  }

  try {
    const response = await db.insert(products).values(result.data).returning();
    const productResult = Product.safeParse(takeFirst(response));

    if (!productResult.success) {
      return { status: "error", error: productResult.error };
    }

    return { status: "success", data: productResult.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function updateProduct({
  id,
  storeId,
  input,
}: {
  id: string;
  storeId: string;
  input: Partial<Product>;
}) {
  const { createdAt, updatedAt, ...inputObj } = input;
  try {
    const response = await db
      .update(products)
      .set({ ...inputObj })
      .where(and(eq(products.storeId, storeId), eq(products.id, id)))
      .returning();

    const result = Product.safeParse(takeFirst(response));

    if (!result.success) {
      return { status: "error", error: result.error };
    }

    return { status: "success", data: result.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function deleteProduct({
  id,
  storeId,
}: {
  id: string;
  storeId: string;
}) {
  try {
    const response = await db
      .delete(products)
      .where(and(eq(products.storeId, storeId), eq(products.id, id)))
      .returning();

    const result = Product.safeParse(takeFirst(response));

    if (!result.success) {
      return { status: "error", error: result.error };
    }

    return { status: "success", data: result.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function getProducts({
  storeId,
  include,
  page,
  pageSize = 50,
}: {
  storeId: string;
  include?: "product-list-items" | undefined;
  page?: number;
  pageSize?: number;
}) {
  const withProductLists = include === "product-list-items";

  try {
    const response = await db.query.products.findMany({
      where: eq(products.storeId, storeId),
      with: {
        ...(withProductLists
          ? {
              productListItems: true,
            }
          : {}),
      },
      limit: pageSize,
      offset: page ? (page - 1) * pageSize : undefined,
      orderBy: (products, { desc }) => [desc(products.createdAt)],
    });

    const result = ProductsWithListItems.safeParse(response);

    if (!result.success) {
      return { status: "error", error: result.error };
    }

    return { status: "success", data: result.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function getProduct({
  id,
  storeId,
  include,
}: {
  id: string;
  storeId: string;
  include?: "product-list-items" | undefined;
}) {
  const withProductLists = include === "product-list-items";
  try {
    const response = await db.query.products.findFirst({
      where: and(eq(products.storeId, storeId), eq(products.id, id)),
      with: {
        ...(withProductLists
          ? {
              productListItems: true,
            }
          : {}),
      },
    });

    const result = ProductWithListItems.safeParse(response);

    if (!result.success) {
      return { status: "error", error: result.error };
    }

    return { status: "success", data: result.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function batchCreateProducts({
  storeId,
  input,
}: {
  storeId: string;
  input: Array<
    Omit<Product, "id" | "storeId" | "status" | "createdAt" | "updatedAt">
  >;
}) {
  const promises = input?.map((i) => createProduct({ storeId, input: i }));

  try {
    const response = await Promise.all(promises);
    return { status: "success", data: response };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function batchUpdateProducts({
  storeId,
  input,
}: {
  storeId: string;
  input: Array<Product>;
}) {
  const promises = input?.map(
    (i) => i && updateProduct({ storeId, id: i.id, input: i }),
  );

  try {
    const response = await Promise.all(promises);

    console.log(response);
    return { status: "success", data: response };
  } catch (error) {
    return { status: "error", error };
  }
}
