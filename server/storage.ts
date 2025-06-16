import { 
  users, suppliers, supplierProducts, categories, products, warehouses, stores, inventory, transactions, transactionItems,
  type User, type InsertUser, type Supplier, type InsertSupplier, type SupplierProduct, type InsertSupplierProduct,
  type Category, type InsertCategory, type Product, type InsertProduct, type Warehouse, type InsertWarehouse, 
  type Store, type InsertStore, type Inventory, type InsertInventory, type Transaction, type InsertTransaction,
  type TransactionItem, type InsertTransactionItem
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Supplier methods
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
  getSupplierProducts(supplierId: number): Promise<any[]>;
  addProductToSupplier(supplierId: number, productId: number, supplierPrice?: number): Promise<SupplierProduct>;
  removeProductFromSupplier(supplierId: number, productId: number): Promise<boolean>;
  updateSupplierProduct(supplierId: number, productId: number, updates: Partial<InsertSupplierProduct>): Promise<SupplierProduct | undefined>;

  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Warehouse methods
  getAllWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;

  // Store methods
  getAllStores(): Promise<Store[]>;
  getStore(id: number): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;

  // Inventory methods
  getAllInventory(): Promise<Inventory[]>;
  getInventoryByLocation(locationId: number, locationType: string): Promise<Inventory[]>;
  getProductInventory(productId: number): Promise<Inventory[]>;
  updateInventory(inventory: InsertInventory): Promise<Inventory>;
  getInventoryItem(productId: number, locationId: number, locationType: string): Promise<Inventory | undefined>;

  // Transaction methods
  getAllTransactions(): Promise<Transaction[]>;
  getAllTransactionsWithItems(): Promise<any[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction, items: InsertTransactionItem[]): Promise<Transaction>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Supplier methods
  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db
      .insert(suppliers)
      .values(insertSupplier)
      .returning();
    return supplier;
  }

  async updateSupplier(id: number, updateData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db
      .update(suppliers)
      .set(updateData)
      .where(eq(suppliers.id, id))
      .returning();
    return supplier || undefined;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    // First, update any products that reference this supplier to null
    await db.update(products)
      .set({ supplierId: null })
      .where(eq(products.supplierId, id));
    
    // Then delete supplier products relationships
    await db.delete(supplierProducts)
      .where(eq(supplierProducts.supplierId, id));
    
    // Finally delete the supplier
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getSupplierProducts(supplierId: number): Promise<any[]> {
    const result = await db
      .select({
        id: supplierProducts.id,
        supplierId: supplierProducts.supplierId,
        productId: supplierProducts.productId,
        supplierPrice: supplierProducts.supplierPrice,
        productName: products.name,
        productSku: products.sku,
        productPrice: products.price,
        productUnit: products.unit,
        categoryName: categories.name,
      })
      .from(supplierProducts)
      .leftJoin(products, eq(supplierProducts.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(supplierProducts.supplierId, supplierId));
    
    return result;
  }

  async addProductToSupplier(supplierId: number, productId: number, supplierPrice?: number): Promise<SupplierProduct> {
    const [supplierProduct] = await db
      .insert(supplierProducts)
      .values({
        supplierId,
        productId,
        supplierPrice: supplierPrice?.toString() || null,
      })
      .returning();
    return supplierProduct;
  }

  async removeProductFromSupplier(supplierId: number, productId: number): Promise<boolean> {
    try {
      await db
        .delete(supplierProducts)
        .where(
          and(
            eq(supplierProducts.supplierId, supplierId),
            eq(supplierProducts.productId, productId)
          )
        );
      return true;
    } catch (error) {
      console.error('Error removing product from supplier:', error);
      return false;
    }
  }

  async updateSupplierProduct(supplierId: number, productId: number, updates: Partial<InsertSupplierProduct>): Promise<SupplierProduct | undefined> {
    const [updated] = await db
      .update(supplierProducts)
      .set(updates)
      .where(
        and(
          eq(supplierProducts.supplierId, supplierId),
          eq(supplierProducts.productId, productId)
        )
      )
      .returning();
    return updated || undefined;
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Warehouse methods
  async getAllWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses);
  }

  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse || undefined;
  }

  async createWarehouse(insertWarehouse: InsertWarehouse): Promise<Warehouse> {
    const [warehouse] = await db
      .insert(warehouses)
      .values(insertWarehouse)
      .returning();
    return warehouse;
  }

  // Store methods
  async getAllStores(): Promise<Store[]> {
    return await db.select().from(stores);
  }

  async getStore(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store || undefined;
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const [store] = await db
      .insert(stores)
      .values(insertStore)
      .returning();
    return store;
  }

  // Inventory methods
  async getAllInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory);
  }

  async getInventoryByLocation(locationId: number, locationType: string): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.locationId, locationId), eq(inventory.locationType, locationType)));
  }

  async getProductInventory(productId: number): Promise<Inventory[]> {
    return await db.select().from(inventory).where(eq(inventory.productId, productId));
  }

  async getInventoryItem(productId: number, locationId: number, locationType: string): Promise<Inventory | undefined> {
    const [item] = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.locationId, locationId),
          eq(inventory.locationType, locationType)
        )
      );
    return item || undefined;
  }

  async updateInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const existing = await this.getInventoryItem(
      insertInventory.productId,
      insertInventory.locationId,
      insertInventory.locationType
    );

    if (existing) {
      const [updated] = await db
        .update(inventory)
        .set({ 
          quantity: insertInventory.quantity,
          lastUpdated: sql`NOW()`
        })
        .where(eq(inventory.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(inventory)
        .values(insertInventory)
        .returning();
      return created;
    }
  }

  // Transaction methods
  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getAllTransactionsWithItems(): Promise<any[]> {
    const transactionsWithItems = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        fromLocationId: transactions.fromLocationId,
        fromLocationType: transactions.fromLocationType,
        toLocationId: transactions.toLocationId,
        toLocationType: transactions.toLocationType,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
        itemId: transactionItems.id,
        productId: transactionItems.productId,
        quantity: transactionItems.quantity,
        price: transactionItems.price,
        productName: products.name,
      })
      .from(transactions)
      .leftJoin(transactionItems, eq(transactions.id, transactionItems.transactionId))
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .orderBy(transactions.createdAt);

    // Group by transaction
    const groupedTransactions: any = {};
    
    transactionsWithItems.forEach(row => {
      if (!groupedTransactions[row.id]) {
        groupedTransactions[row.id] = {
          id: row.id,
          type: row.type,
          fromLocationId: row.fromLocationId,
          fromLocationType: row.fromLocationType,
          toLocationId: row.toLocationId,
          toLocationType: row.toLocationType,
          notes: row.notes,
          createdAt: row.createdAt,
          items: [],
          totalAmount: 0
        };
      }
      
      if (row.itemId) {
        const price = Number(row.price) || 0;
        const quantity = row.quantity || 0;
        const item = {
          id: row.itemId,
          productId: row.productId,
          productName: row.productName,
          quantity: quantity,
          price: price,
          total: quantity * price
        };
        groupedTransactions[row.id].items.push(item);
        groupedTransactions[row.id].totalAmount += Number(item.total);
      }
    });

    return Object.values(groupedTransactions);
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async createTransaction(insertTransaction: InsertTransaction, items: InsertTransactionItem[]): Promise<Transaction> {
    return await db.transaction(async (tx) => {
      const [transaction] = await tx
        .insert(transactions)
        .values(insertTransaction)
        .returning();

      const transactionItemsWithId = items.map(item => ({
        ...item,
        transactionId: transaction.id
      }));

      await tx.insert(transactionItems).values(transactionItemsWithId);

      // Update inventory for transfers
      if (transaction.type === 'transfer' && transaction.fromLocationId && transaction.toLocationId) {
        for (const item of items) {
          // Decrease inventory at source location
          const [fromInventory] = await tx
            .select()
            .from(inventory)
            .where(
              and(
                eq(inventory.productId, item.productId),
                eq(inventory.locationId, transaction.fromLocationId),
                eq(inventory.locationType, transaction.fromLocationType || 'warehouse')
              )
            );

          if (fromInventory) {
            await tx
              .update(inventory)
              .set({ 
                quantity: fromInventory.quantity - item.quantity,
                lastUpdated: new Date()
              })
              .where(eq(inventory.id, fromInventory.id));
          }

          // Increase inventory at destination location (or create new record)
          const [toInventory] = await tx
            .select()
            .from(inventory)
            .where(
              and(
                eq(inventory.productId, item.productId),
                eq(inventory.locationId, transaction.toLocationId),
                eq(inventory.locationType, transaction.toLocationType || 'warehouse')
              )
            );

          if (toInventory) {
            await tx
              .update(inventory)
              .set({ 
                quantity: toInventory.quantity + item.quantity,
                lastUpdated: new Date()
              })
              .where(eq(inventory.id, toInventory.id));
          } else {
            await tx.insert(inventory).values({
              productId: item.productId,
              locationId: transaction.toLocationId,
              locationType: transaction.toLocationType || 'warehouse',
              quantity: item.quantity
            });
          }
        }
      }

      return transaction;
    });
  }
}

export const storage = new DatabaseStorage();
