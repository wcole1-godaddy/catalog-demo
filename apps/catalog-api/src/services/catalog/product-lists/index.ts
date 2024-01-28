import ksuid from "ksuid";
import { and } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { productLists } from "../../../schema";
import { takeFirst } from "../../../utils";
import {
  ProductList,
  ProductListInput,
  ProductListsWithItems,
  ProductListWithItems,
} from "../entities/product-list";
import { inArray } from "drizzle-orm";

export async function createProductList({
  storeId,
  input,
}: {
  storeId: string;
  input: ProductListInput;
}) {
  try {
    const id = ksuid.randomSync().string;

    const productListResponse = takeFirst(
      await db
        .insert(productLists)
        .values({
          id,
          storeId,
          ...input,
          createdAt: new Date().toISOString(),
        })
        .returning(),
    );

    const productList = ProductList.safeParse(productListResponse);

    if (!productList.success) {
      return { status: "error", error: productList.error };
    }

    return { status: "success", data: productList.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function updateProductList({
  id,
  storeId,
  input,
}: {
  id: string;
  storeId: string;
  input: ProductListInput;
}) {
  try {
    const productListResponse = takeFirst(
      await db
        .update(productLists)
        .set({
          ...input,
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(productLists.id, id), eq(productLists.storeId, storeId)))
        .returning(),
    );

    const productList = ProductList.safeParse(productListResponse);

    if (!productList.success) {
      return { status: "error", error: productList.error };
    }

    return { status: "success", data: productList.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function deleteProductList({
  id,
  storeId,
}: {
  id: string;
  storeId: string;
}) {
  try {
    const productListResponse = takeFirst(
      await db
        .delete(productLists)
        .where(and(eq(productLists.id, id), eq(productLists.storeId, storeId)))
        .returning(),
    );

    const productList = ProductList.safeParse(productListResponse);

    if (!productList.success) {
      return { status: "error", error: productList.error };
    }

    return { status: "success", data: productList.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function getProductLists({
  storeId,
  include,
  ids,
}: {
  storeId: string;
  include?: "product-list-items" | undefined;
  ids?: string | undefined;
}) {
  const withProductListItems = include === "product-list-items";
  const idsFilter = ids ? inArray(productLists.id, ids?.split(",")) : undefined;

  try {
    const productListsResponse = await db.query.productLists.findMany({
      where: and(eq(productLists.storeId, storeId), idsFilter),
      with: {
        ...(withProductListItems ? { productListItems: true } : null),
      },
    });

    const result = ProductListsWithItems.safeParse(productListsResponse);

    if (!result.success) {
      return { status: "error", error: result.error };
    }

    return { status: "success", data: result.data };
  } catch (error) {
    console.log(error);
    return { status: "error", error };
  }
}

export async function getProductList({
  id,
  storeId,
  include,
}: {
  id: string;
  storeId: string;
  include: "product-list-items" | undefined;
}) {
  const withProductListItems = include === "product-list-items";
  try {
    const productListResponse = await db.query.productLists.findFirst({
      where: and(eq(productLists.id, id), eq(productLists.storeId, storeId)),
      with: {
        ...(withProductListItems ? { productListItems: true } : null),
      },
    });

    const result = ProductListWithItems.safeParse(productListResponse);

    if (!result.success) {
      return { status: "error", error: result.error };
    }

    return { status: "success", data: result.data };
  } catch (error) {
    return { status: "error", error };
  }
}
