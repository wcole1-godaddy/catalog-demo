CREATE TABLE IF NOT EXISTS "product_lists" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" varchar(255),
	"createdAt" date DEFAULT now() NOT NULL,
	"updatedAt" date,
	CONSTRAINT "product_lists_store_id_slug_unique" UNIQUE("store_id","slug")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_lists_store_index" ON "product_lists" ("store_id");