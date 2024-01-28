"use client";

import { ColumnDef } from "@tanstack/react-table";

export type ProductList = {
  id: string;
  name: string;
  description: string;
  productListItems: any[];
};

export const columns: ColumnDef<ProductList>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    id: "numberOfProducts",
    header: "Number of Products",
    cell: ({ row }) => {
      return <span>{row.original.productListItems?.length}</span>;
    },
  },
];
