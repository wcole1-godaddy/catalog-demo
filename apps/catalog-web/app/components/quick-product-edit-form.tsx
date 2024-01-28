"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "cmdk";
import { CheckIcon, ChevronsDownUp } from "lucide-react";
import React from "react";
import { Row } from "@tanstack/react-table";
import { toast } from "sonner";

const formSchema = z.object({
  list: z.string(),
});

type QuickProductEditForm<TData> = {
  rows: Array<Row<any>>;
  productLists: Array<any>;
  onAddToList: (products: Array<any>) => Promise<void>;
  onClose: () => void;
};

export function QuickProductEditForm<TData>({
  rows,
  productLists,
  onAddToList,
  onClose,
}: QuickProductEditForm<TData>) {
  const [addingToList, setAddingToList] = React.useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      list: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setAddingToList(true);
      await onAddToList(
        rows?.map((row) => ({
          productId: row.original.id,
          productListId: values.list,
          position: 0,
        })),
      );
      setAddingToList(false);
      toast.success("Added to list!");
      onClose();
    } catch (error) {
      setAddingToList(false);
      toast.error("Something went wrong!");
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="list"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>List</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-[200px] justify-between",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value
                        ? productLists?.find((list) => list.id === field.value)
                            ?.name
                        : "Select a list"}
                      <ChevronsDownUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search lists..."
                      className="h-9"
                    />
                    <CommandEmpty>No list found.</CommandEmpty>
                    <CommandGroup>
                      {productLists?.map((list) => (
                        <CommandItem
                          value={list.name}
                          key={list.id}
                          onSelect={() => {
                            form.setValue("list", list.id);
                          }}
                        >
                          {list.name}
                          <CheckIcon
                            className={cn(
                              "ml-auto h-4 w-4",
                              list.id === field.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={addingToList}>
          {addingToList ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
