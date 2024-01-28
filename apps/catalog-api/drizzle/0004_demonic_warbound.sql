ALTER TABLE "products" DROP CONSTRAINT "products_id_sku_unique";--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_sku_unique" UNIQUE("store_id","sku");