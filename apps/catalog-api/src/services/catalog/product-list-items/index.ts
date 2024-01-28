import ksuid from "ksuid";
import {
  ProductListItem,
  ProductListItemInput,
  ProductListItems,
} from "../entities";
import { db } from "../../../db";
import { insertProductListItemSchema, productListItems } from "../../../schema";
import { takeFirst } from "../../../utils";
import { and } from "drizzle-orm";
import { eq } from "drizzle-orm";

export async function createProductListItem({
  storeId,
  input,
}: {
  storeId: string;
  input: ProductListItemInput;
}) {
  try {
    const id = ksuid.randomSync().string;

    const productListItemInput = {
      id,
      storeId,
      ...input,
      createdAt: new Date().toISOString(),
    };

    const result = insertProductListItemSchema.safeParse(productListItemInput);

    if (!result.success) {
      return { status: "error", error: result.error };
    }

    const response = takeFirst(
      await db.insert(productListItems).values(result.data).returning(),
    );

    const productListItem = ProductListItem.safeParse(response);

    if (!productListItem.success) {
      return { status: "error", error: productListItem.error };
    }

    return { status: "success", data: productListItem.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function updateProductListItem({
  storeId,
  id,
  input,
}: {
  storeId: string;
  id: string;
  input: ProductListItemInput;
}) {
  try {
    const response = takeFirst(
      await db
        .update(productListItems)
        .set({ ...input, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(productListItems.storeId, storeId),
            eq(productListItems.id, id),
          ),
        )
        .returning(),
    );

    console.log(response);

    const result = ProductListItem.safeParse(response);

    if (!result.success) {
      return { status: "error", error: result.error };
    }

    return { status: "success", data: result.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function deleteProductListItem({
  storeId,
  id,
}: {
  storeId: string;
  id: string;
}) {
  try {
    const response = takeFirst(
      await db
        .delete(productListItems)
        .where(
          and(
            eq(productListItems.storeId, storeId),
            eq(productListItems.id, id),
          ),
        )
        .returning(),
    );

    const result = ProductListItem.safeParse(response);

    if (!result.success) {
      return { status: "error", error: result.error };
    }

    return { status: "success", data: result.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function getProductListItems({
  storeId,
  productListId,
  productId,
}: {
  storeId: string;
  productListId: string | undefined;
  productId?: string | undefined;
}) {
  const productListIdFilter = productListId
    ? eq(productListItems.productListId, productListId)
    : undefined;

  const productIdFilter = productId
    ? eq(productListItems.productId, productId)
    : undefined;
  const storeIdFilter = eq(productListItems.storeId, storeId);

  try {
    const response = await db.query.productListItems.findMany({
      where: and(storeIdFilter, productListIdFilter, productIdFilter),
    });

    const result = ProductListItems.safeParse(response);

    if (!result.success) {
      return { status: "error", error: result.error };
    }

    return { status: "success", data: result.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function getProductListItem({
  storeId,
  id,
}: {
  storeId: string;
  id: string;
}) {
  try {
    const response = await db.query.productListItems.findFirst({
      where: and(
        eq(productListItems.storeId, storeId),
        eq(productListItems.id, id),
      ),
    });

    const result = ProductListItem.safeParse(response);

    if (!result.success) {
      return { status: "error", error: result.error };
    }

    return { status: "success", data: result.data };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function batchCreateProductListItems({
  storeId,
  input,
}: {
  storeId: string;
  input: Array<ProductListItemInput>;
}) {
  const promises = input?.map((i) =>
    createProductListItem({ storeId, input: i }),
  );

  try {
    const response = await Promise.all(promises);
    return { status: "success", data: response };
  } catch (error) {
    return { status: "error", error };
  }
}

export async function batchUpdateProductListItems({
  storeId,
  input,
}: {
  storeId: string;
  input: Array<ProductListItem>;
}) {
  const promises = input?.map((i) =>
    updateProductListItem({ storeId, id: i.id, input: i }),
  );

  try {
    const response = await Promise.all(promises);
    return { status: "success", data: response };
  } catch (error) {
    return { status: "error", error };
  }
}
