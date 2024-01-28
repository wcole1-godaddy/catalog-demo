CREATE TABLE IF NOT EXISTS "products_to_product_lists" (
	"product_id" varchar(255) NOT NULL,
	"product_list_id" varchar(255) NOT NULL,
	CONSTRAINT "products_to_product_lists_product_id_product_list_id_pk" PRIMARY KEY("product_id","product_list_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products_to_product_lists" ADD CONSTRAINT "products_to_product_lists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products_to_product_lists" ADD CONSTRAINT "products_to_product_lists_product_list_id_product_lists_id_fk" FOREIGN KEY ("product_list_id") REFERENCES "product_lists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
