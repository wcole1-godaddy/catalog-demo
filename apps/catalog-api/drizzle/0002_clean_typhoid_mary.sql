ALTER TABLE "products" ADD COLUMN "ean" varchar(128);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type" "product_type";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_status" "product_status";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price" varchar(255);