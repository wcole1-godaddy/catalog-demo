import {
  pgTable,
  varchar,
  date,
  index,
  unique,
  integer,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";

export const productTypeEnum = pgEnum("product_type", [
  "PHYSICAL",
  "DIGITAL",
  "SERVICE",
  "GIFTCARD",
]);

export const productStatusEnum = pgEnum("product_status", ["ACTIVE", "DRAFT"]);

export const products = pgTable(
  "products",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    storeId: varchar("store_id", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 128 }).notNull(),
    ean: varchar("ean", { length: 128 }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: productTypeEnum("product_type"),
    status: productStatusEnum("product_status"),
    price: integer("price").default(0).notNull(),
    taxCategory: varchar("tax_category", { length: 255 }),
    createdAt: date("created_at").notNull().defaultNow(),
    updatedAt: date("updated_at"),
  },
  (t) => ({
    prodStoreIndx: index("store_id_idx").on(t.storeId),
    unqSku: unique().on(t.storeId, t.sku),
  }),
);
export type ProductModel = typeof products.$inferSelect;
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

export const productRelations = relations(products, ({ many }) => ({
  productListItems: many(productListItems),
}));

export const productLists = pgTable(
  "product_lists",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    storeId: varchar("store_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: varchar("description", { length: 255 }),
    createdAt: date("createdAt").notNull().defaultNow(),
    updatedAt: date("updatedAt"),
  },
  (t) => ({
    pListStoreInd: index("product_lists_store_index").on(t.storeId),
    unqSlug: unique().on(t.storeId, t.slug),
  }),
);

export const productListRelations = relations(productLists, ({ many }) => ({
  productListItems: many(productListItems),
}));

export const productListItems = pgTable(
  "product_list_items",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    storeId: varchar("store_id", { length: 255 }).notNull(),
    productListId: varchar("product_list_id", { length: 255 }).notNull(),
    productId: varchar("product_id", { length: 255 }).notNull(),
    position: integer("position").notNull().default(0),
    createdAt: date("createdAt").notNull().defaultNow(),
    updatedAt: date("updatedAt"),
  },
  (t) => ({
    storeIndex: index("product_list_items_store_index").on(t.storeId),
    unq: unique().on(t.storeId, t.productListId, t.productId),
  }),
);

export const insertProductListItemSchema = createInsertSchema(productListItems);

export const productListItemsRelations = relations(
  productListItems,
  ({ one }) => ({
    productList: one(productLists, {
      fields: [productListItems.productListId],
      references: [productLists.id],
    }),
    product: one(products, {
      fields: [productListItems.productId],
      references: [products.id],
    }),
  }),
);
