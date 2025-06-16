import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("cashier"), // admin, manager, storekeeper, cashier
  locationId: integer("location_id"),
  locationType: text("location_type"), // store, warehouse
  createdAt: timestamp("created_at").defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  representative: text("representative"),
  representativePhone: text("representative_phone"),
  representativeEmail: text("representative_email"),
  minimumOrder: decimal("minimum_order", { precision: 10, scale: 2 }),
  paymentTerms: text("payment_terms"),
  deliveryTime: text("delivery_time"),
  deliveryCities: text("delivery_cities").array(),
  productCategories: text("product_categories").array(),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supplierProducts = pgTable("supplier_products", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  categoryId: integer("category_id").references(() => categories.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  unit: text("unit").notNull(), // мешок, метр, упаковка, лист
  weight: text("weight"), // 50кг, 12мм x 12м, etc.
  volume: decimal("volume", { precision: 8, scale: 3 }).notNull().default("0.010"), // Volume in m³
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  minStock: integer("min_stock").default(0),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // head, local
  city: text("city").notNull(),
  address: text("address").notNull(),
  contact: text("contact").notNull(),
  phone: text("phone").notNull(),
  totalCapacity: integer("total_capacity").notNull(),
  usedCapacity: integer("used_capacity").default(0),
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull(), // Флагман, Стандарт, Премиум
  monthlyRevenue: decimal("monthly_revenue", { precision: 10, scale: 2 }).default("0.00"),
  activeCustomers: integer("active_customers").default(0),
  managerId: integer("manager_id").references(() => users.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  locationId: integer("location_id").notNull(),
  locationType: text("location_type").notNull(), // warehouse, store
  quantity: integer("quantity").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // incoming, outgoing, transfer
  fromLocationId: integer("from_location_id"),
  fromLocationType: text("from_location_type"),
  toLocationId: integer("to_location_id"),
  toLocationType: text("to_location_type"),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  managedStores: many(stores),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
  supplierProducts: many(supplierProducts),
}));

export const supplierProductsRelations = relations(supplierProducts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierProducts.supplierId],
    references: [suppliers.id],
  }),
  product: one(products, {
    fields: [supplierProducts.productId],
    references: [products.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  inventory: many(inventory),
  transactionItems: many(transactionItems),
}));

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  stores: many(stores),
}));

export const storesRelations = relations(stores, ({ one }) => ({
  manager: one(users, {
    fields: [stores.managerId],
    references: [users.id],
  }),
  warehouse: one(warehouses, {
    fields: [stores.warehouseId],
    references: [warehouses.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  product: one(products, {
    fields: [transactionItems.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  locationId: true,
  locationType: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
}).extend({
  deliveryCities: z.array(z.string()).optional(),
  productCategories: z.array(z.string()).optional(),
});

export const insertSupplierProductSchema = createInsertSchema(supplierProducts).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionItemSchema = createInsertSchema(transactionItems).omit({
  id: true,
  transactionId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplierProduct = z.infer<typeof insertSupplierProductSchema>;
export type SupplierProduct = typeof supplierProducts.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;
export type TransactionItem = typeof transactionItems.$inferSelect;
