import { columns } from "./columns";
import { DataTable } from "./data-table";

async function getData() {
  const res = await fetch(
    `${process.env.API_URL}/v2/commerce/stores/1234/product-lists?include=product-list-items`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

export default async function ProductListsPage() {
  const data = await getData();

  console.log(data);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Product Lists</h2>
      <div>
        <DataTable columns={columns} data={data?.productLists} />
      </div>
    </div>
  );
}
