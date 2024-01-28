"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React from "react";

type BulkCreateButtonProps = {
  onBulkCreate: () => Promise<void>;
};

export function BulkCreateButton({ onBulkCreate }: BulkCreateButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  async function handleOnBulkCreate() {
    try {
      setCreating(true);
      await onBulkCreate();
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
      setOpen(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Bulk create
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk create products</DialogTitle>
          <DialogDescription>
            This will generate 100 fake products in your store.
          </DialogDescription>
          <div className="pt-6">
            <Button disabled={creating} onClick={handleOnBulkCreate}>
              {creating ? "Creating..." : "Create 100 products"}
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
