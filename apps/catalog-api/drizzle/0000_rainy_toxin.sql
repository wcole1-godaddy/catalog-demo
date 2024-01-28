CREATE TABLE IF NOT EXISTS "products" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"sku" varchar(128) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" date DEFAULT now() NOT NULL,
	"updated_at" date,
	CONSTRAINT "products_id_sku_unique" UNIQUE("id","sku")
);
