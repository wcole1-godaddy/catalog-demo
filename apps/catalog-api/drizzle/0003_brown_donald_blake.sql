DO $$ BEGIN
 CREATE TYPE "product_status" AS ENUM('ACTIVE', 'DRAFT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "product_type" AS ENUM('PHYSICAL', 'DIGITAL', 'SERVICE', 'GIFTCARD');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
