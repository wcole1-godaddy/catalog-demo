import ksuid from "ksuid";
import { revalidatePath } from "next/cache";
import { Product, columns } from "./columns";
import { DataTable } from "./data-table";
import { BulkCreateButton } from "./components/bulk-create";

async function getProducts({
  page,
  pageSize = "50",
}: {
  page: string;
  pageSize: string;
}) {
  const searchParams = new URLSearchParams({
    ...(page ? { page } : {}),
    ...(pageSize ? { pageSize } : {}),
    include: "product-list-items",
  });

  const res = await fetch(
    `${
      process.env.API_URL
    }/v2/commerce/stores/1234/products?${searchParams.toString()}`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

async function getProductLists() {
  const res = await fetch(
    `${process.env.API_URL}/v2/commerce/stores/1234/product-lists`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { pageSize: string; page: string };
}) {
  const products = await getProducts(searchParams);
  const productLists = await getProductLists();

  async function onSetActive(products: Array<Product>) {
    "use server";

    const res = await fetch(
      `${process.env.API_URL}/v2/commerce/stores/1234/product-batches`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "UPDATE",
          data: products?.map(({ productListItems, ...product }) => product),
        }),
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    revalidatePath("/products");

    return res.json();
  }

  async function onSetDraft(products: Array<Product>) {
    "use server";

    const res = await fetch(
      `${process.env.API_URL}/v2/commerce/stores/1234/product-batches`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "UPDATE",
          data: products?.map(({ productListItems, ...product }) => product),
        }),
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    revalidatePath("/products");

    return res.json();
  }

  async function onAddToList(productListItems: Array<Product>) {
    "use server";

    const res = await fetch(
      `${process.env.API_URL}/v2/commerce/stores/1234/product-list-item-batches`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "CREATE",
          data: productListItems,
        }),
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    revalidatePath("/products");
    revalidatePath("/product-lists");

    return res.json();
  }

  async function onBulkCreate() {
    "use server";

    const data = {
      action: "CREATE",
      data: Array.from({ length: 100 }, (_, i) => ({
        name: `Product ${ksuid.randomSync().string}`,
        description: `Product description`,
        sku: `product - ${ksuid.randomSync().string}`,
        price: 1000,
        type: "PHYSICAL",
        status: "DRAFT",
        taxCategory: "standard",
      })),
    };

    const res = await fetch(
      `${process.env.API_URL}/v2/commerce/stores/1234/product-batches`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    revalidatePath("/products");

    return res.json();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        <div className="space-x-2">
          <BulkCreateButton onBulkCreate={onBulkCreate} />
        </div>
      </div>
      <div>
        <DataTable
          columns={columns}
          data={products?.products}
          productLists={productLists?.productLists}
          onSetDraft={onSetDraft}
          onSetActive={onSetActive}
          onAddToList={onAddToList}
        />
      </div>
    </div>
  );
}
