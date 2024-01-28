CREATE TABLE IF NOT EXISTS "product_list_items" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"product_list_id" varchar(255) NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"createdAt" date DEFAULT now() NOT NULL,
	"updatedAt" date
);
--> statement-breakpoint
DROP TABLE "products_to_product_lists";