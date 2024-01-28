import { revalidatePath } from "next/cache";
import { Product, columns } from "./columns";
import { DataTable } from "./data-table";

async function getProducts() {
  const res = await fetch(
    "http://localhost:4000/v2/commerce/stores/1234/products?include=product-list-items",
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

async function getProductLists() {
  const res = await fetch(
    "http://localhost:4000/v2/commerce/stores/1234/product-lists",
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();
  const productLists = await getProductLists();

  async function onSetActive(products: Array<Product>) {
    "use server";

    const res = await fetch(
      "http://localhost:4000/v2/commerce/stores/1234/product-batches",
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

    revalidatePath("/admin/products");

    return res.json();
  }

  async function onSetDraft(products: Array<Product>) {
    "use server";

    const res = await fetch(
      "http://localhost:4000/v2/commerce/stores/1234/product-batches",
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

    revalidatePath("/admin/products");

    return res.json();
  }

  async function onAddToList(productListItems: Array<Product>) {
    "use server";

    const res = await fetch(
      "http://localhost:4000/v2/commerce/stores/1234/product-list-item-batches",
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

    revalidatePath("/admin/products");
    revalidatePath("/admin/product-lists");

    return res.json();
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Products</h2>
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
