"use client";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product } from "./columns";
import { BulkActions } from "../components/bulk-actions";
import { useSearchParams } from "next/navigation";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  productLists: Array<any>;
  onSetActive: (items: Array<Product>) => Promise<void>;
  onSetDraft: (items: Array<Product>) => Promise<void>;
  onAddToList: (items: Array<any>) => Promise<void>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  productLists,
  onSetActive,
  onSetDraft,
  onAddToList,
}: DataTableProps<TData, TValue>) {
  const searchParams = useSearchParams();
  const [rowSelection, setRowSelection] = React.useState({});

  const page = Number(searchParams.get("page")) || 1;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex justify-between h-[32px]">
        {table.getFilteredSelectedRowModel().rows.length > 0 ? (
          <div className="space-x-2">
            <BulkActions<TData>
              productLists={productLists}
              rows={table.getFilteredSelectedRowModel().rows}
              onSetActive={onSetActive}
              onSetDraft={onSetDraft}
              onAddToList={onAddToList}
            />
          </div>
        ) : null}
        <div className="flex items-center ml-auto space-x-2">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href={`/products?page=${page - 1}`} />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href={`/products?page=${page + 1}`} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
