"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Image } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export type Product = {
  id: string;
  status: "ACTIVE" | "DRAFT";
  name: string;
  price: number;
  taxCategory?: string;
  productListItems: any[];
  createdAt: string;
};

const USDollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const columns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value: any) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: any) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "image",
    header: "Image",
    cell: () => (
      <div className="border rounded-md p-2 inline-flex">
        <Image className="h-4 w-4" />
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link href={`/products/${row.original.id}`} className="underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => <span>{USDollar.format(row.original.price / 100)}</span>,
  },
  {
    accessorKey: "taxCategory",
    header: "Tax Category",
    cell: ({ row }) => (
      <span>
        {row?.original?.taxCategory
          ? `${row.original.taxCategory?.charAt(0).toUpperCase()}${
              row.original?.taxCategory && row?.original?.taxCategory.slice(1)
            }`
          : ""}
      </span>
    ),
  },
  {
    id: "lists",
    header: "Lists",
    cell: ({ row }) => <span>{row.original.productListItems?.length}</span>,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <span>{format(row.original.createdAt, "MMM d, yyyy")}</span>
    ),
  },
];
