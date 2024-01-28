ALTER TABLE "product_list_items" ADD COLUMN "store_id" varchar(255) NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_list_items_store_index" ON "product_list_items" ("store_id");