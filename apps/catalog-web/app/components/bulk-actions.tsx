"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Row } from "@tanstack/react-table";
import { toast } from "sonner";
import { Product } from "../products/columns";
import { QuickProductEditForm } from "./quick-product-edit-form";

type BulkActionProps<TData> = {
  rows: Array<Row<TData>>;
  productLists: Array<any>;
  onSetActive: (items: Array<Product>) => Promise<void>;
  onSetDraft: (items: Array<Product>) => Promise<void>;
  onAddToList: (items: Array<any>) => Promise<void>;
};

export function BulkActions<TData>({
  rows,
  productLists,
  onSetActive,
  onSetDraft,
  onAddToList,
}: BulkActionProps<TData>) {
  const [open, setOpen] = React.useState(false);
  const [settingActive, setSettingActive] = React.useState(false);
  const [settingDraft, setSettingDraft] = React.useState(false);

  async function handleSetActive() {
    setSettingActive(true);
    const items = rows
      ?.map?.((row) => row.original)
      ?.map((item) => ({
        ...item,
        status: "ACTIVE",
      })) as unknown as Array<Product>;

    try {
      await onSetActive(items);
      setSettingActive(false);
      toast.success("Products set to active.");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong.");
      setSettingActive(false);
    }
  }

  async function handleSetDraft() {
    setSettingDraft(true);
    const items = rows
      ?.map?.((row) => row.original)
      ?.map((item) => ({
        ...item,
        status: "DRAFT",
      })) as unknown as Array<Product>;

    try {
      await onSetDraft(items);
      toast.success("Products set to draft.");
      setSettingDraft(false);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong.");
      setSettingDraft(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Add to list
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit all selected products</DialogTitle>
            <div className="pt-6">
              <QuickProductEditForm<TData>
                rows={rows}
                productLists={productLists}
                onAddToList={onAddToList}
                onClose={() => setOpen(false)}
              />
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <Button
        variant="outline"
        size="sm"
        disabled={settingActive}
        onClick={handleSetActive}
      >
        {settingActive ? "Saving..." : "Set active"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={settingDraft}
        onClick={handleSetDraft}
      >
        {settingDraft ? "Saving..." : "Set draft"}
      </Button>
    </>
  );
}
