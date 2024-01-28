import { Badge } from "@/components/ui/badge";

async function getProduct({ id }: { id: string }) {
  const res = await fetch(
    `${process.env.API_URL}/v2/commerce/stores/1234/products/${id}?include=product-list-items`,
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

async function getProductLists({ ids }: { ids: Array<string> }) {
  const res = await fetch(
    `${
      process.env.API_URL
    }/v2/commerce/stores/1234/product-lists?ids=${ids.join(",")}`,
    { cache: "force-cache" },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

export default async function ProductPage({
  params,
}: {
  params: { productId: string };
}) {
  const id = params.productId;

  const data = await getProduct({ id });

  const listItemIds = data?.productListItems?.map(
    (listItem: any) => listItem?.productListId,
  );

  const productLists = await getProductLists({ ids: listItemIds });

  console.log(productLists);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">{data?.name}</h2>
      <div className="space-y-2">
        <h4 className="font-semibold">Lists</h4>
        {productLists?.productLists?.map((productList: any) => (
          <Badge>{productList?.name}</Badge>
        ))}
      </div>
    </div>
  );
}
