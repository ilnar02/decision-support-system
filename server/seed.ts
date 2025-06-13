import { storage } from "./storage";

export async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Create demo users
    const users = [
      {
        username: "admin",
        password: "password",
        name: "Администратор Системы",
        email: "admin@example.com",
        role: "admin",
        locationId: null,
        locationType: null,
      },
      {
        username: "manager",
        password: "password", 
        name: "Менеджер Склада",
        email: "manager@example.com",
        role: "manager",
        locationId: 1,
        locationType: "warehouse",
      },
      {
        username: "storekeeper",
        password: "password",
        name: "Кладовщик",
        email: "storekeeper@example.com", 
        role: "storekeeper",
        locationId: 1,
        locationType: "warehouse",
      },
      {
        username: "cashier",
        password: "password",
        name: "Кассир",
        email: "cashier@example.com",
        role: "cashier", 
        locationId: 1,
        locationType: "store",
      },
    ];

    for (const user of users) {
      await storage.createUser(user);
    }

    // Create categories
    const categories = [
      { name: "Цемент и бетон", description: "Цементы, бетонные смеси, добавки" },
      { name: "Металлопрокат", description: "Арматура, трубы, листы металла" },
      { name: "Пиломатериалы", description: "Доски, брус, фанера" },
      { name: "Плитка и напольные покрытия", description: "Керамическая плитка, ламинат" },
      { name: "Сантехника", description: "Трубы, фитинги, сантехника" },
      { name: "Крепежные изделия", description: "Болты, гайки, саморезы" },
    ];

    for (const category of categories) {
      await storage.createCategory(category);
    }

    // Create suppliers
    const suppliers = [
      {
        name: "СтройПоставка",
        category: "Общие строительные материалы",
        email: "orders@stroypostavka.ru",
        phone: "+7 (495) 123-4567",
        address: "ул. Промышленная, 123, Москва",
        rating: "4.8",
      },
      {
        name: "МеталлИндустрия", 
        category: "Металлопрокат",
        email: "sales@metallprom.ru",
        phone: "+7 (812) 123-4567",
        address: "ул. Металлургов, 456, Санкт-Петербург",
        rating: "4.6",
      },
      {
        name: "ЛесПром",
        category: "Пиломатериалы",
        email: "orders@lesotrade.ru",
        phone: "+7 (495) 765-4321",
        address: "ул. Лесная, 789, Москва",
        rating: "4.7",
      },
      {
        name: "КерамикаПлюс",
        category: "Плитка и напольные покрытия",
        email: "info@keramikaplus.ru",
        phone: "+7 (495) 555-0123",
        address: "пр. Керамический, 15, Москва",
        rating: "4.5",
      },
      {
        name: "СантехСнаб",
        category: "Сантехника",
        email: "orders@santehsnab.ru", 
        phone: "+7 (495) 777-8899",
        address: "ул. Сантехническая, 42, Москва",
        rating: "4.4",
      },
    ];

    for (const supplier of suppliers) {
      await storage.createSupplier(supplier);
    }

    // Create warehouses
    const warehouses = [
      {
        name: "Центральный распределительный центр",
        type: "head",
        city: "Москва",
        address: "ул. Промышленная, 123",
        contact: "Иванов Иван",
        phone: "(495) 123-4567",
        totalCapacity: 5000,
        usedCapacity: 3750,
      },
      {
        name: "Западный региональный склад",
        type: "head", 
        city: "Санкт-Петербург",
        address: "пр. Индустриальный, 456",
        contact: "Петрова Мария",
        phone: "(812) 765-4321",
        totalCapacity: 4000,
        usedCapacity: 2800,
      },
      {
        name: "Центральный локальный склад",
        type: "local",
        city: "Москва", 
        address: "ул. Складская, 789",
        contact: "Сидоров Дмитрий",
        phone: "(495) 987-6543",
        totalCapacity: 1200,
        usedCapacity: 950,
      },
    ];

    for (const warehouse of warehouses) {
      await storage.createWarehouse(warehouse);
    }

    // Create stores
    const stores = [
      {
        name: "Центральный магазин",
        region: "Москва",
        address: "ул. Ленина, д. 15",
        type: "Флагман",
        monthlyRevenue: "285000.00",
        activeCustomers: 1250,
        managerId: 2, // manager user
        warehouseId: 1, // central warehouse
      },
      {
        name: "Западный магазин",
        region: "Москва", 
        address: "Невский проспект, д. 28",
        type: "Стандарт",
        monthlyRevenue: "195000.00",
        activeCustomers: 850,
        managerId: 2,
        warehouseId: 2,
      },
      {
        name: "Восточный магазин",
        region: "Казань",
        address: "ул. Малышева, д. 56", 
        type: "Премиум",
        monthlyRevenue: "425000.00",
        activeCustomers: 980,
        managerId: 2,
        warehouseId: 1,
      },
    ];

    for (const store of stores) {
      await storage.createStore(store);
    }

    // Create products
    const products = [
      {
        name: "Цемент Портландский",
        sku: "ЦП-001",
        categoryId: 1,
        supplierId: 1,
        unit: "мешок",
        weight: "50кг",
        price: "450.00",
        minStock: 100,
        image: "https://stroy-ekspert-ekologiya.ru/images/cement-powder-in-white-bag.jpg",
      },
      {
        name: "Арматура 12мм",
        sku: "АРМ-012", 
        categoryId: 2,
        supplierId: 2,
        unit: "метр",
        weight: "12мм x 12м",
        price: "890.50",
        minStock: 50,
        image: "https://st44.stpulscen.ru/images/product/486/384/900_original.png",
      },
      {
        name: "Фанера строительная 18мм",
        sku: "ФАН-018",
        categoryId: 3,
        supplierId: 3,
        unit: "лист",
        weight: "15кг/лист",
        price: "890.95",
        minStock: 30,
        image: "https://stkperspektiva.ru/uploadedFiles/eshopimages/big/fanera-nekond_12.jpg",
      },
      {
        name: "Плитка напольная Терракота",
        sku: "ПЛТ-ТЕРРА",
        categoryId: 4,
        supplierId: 4,
        unit: "упаковка",
        weight: "15кг/уп.",
        price: "1250.75",
        minStock: 40,
        image: "https://sochi.kwadratura.ru/_mod_files/ce_images/eshop/generated/11133_d826bbade21470f47983b3b903bb05d1_540x443_pc.jpg",
      },
      {
        name: "Труба ПВХ 100мм",
        sku: "ПВХ-100",
        categoryId: 5,
        supplierId: 5,
        unit: "метр",
        weight: "3кг/м",
        price: "345.45",
        minStock: 25,
        image: "https://example.com/pipe.jpg",
      },
    ];

    for (const product of products) {
      await storage.createProduct(product);
    }

    // Create inventory records
    const inventoryRecords = [
      // Product 1 (Cement) inventory
      { productId: 1, locationId: 1, locationType: "warehouse", quantity: 400 },
      { productId: 1, locationId: 2, locationType: "warehouse", quantity: 200 },
      { productId: 1, locationId: 1, locationType: "store", quantity: 100 },
      { productId: 1, locationId: 2, locationType: "store", quantity: 150 },
      
      // Product 2 (Rebar) inventory
      { productId: 2, locationId: 1, locationType: "warehouse", quantity: 300 },
      { productId: 2, locationId: 2, locationType: "warehouse", quantity: 50 },
      { productId: 2, locationId: 3, locationType: "store", quantity: 50 },
      
      // Product 3 (Plywood) inventory
      { productId: 3, locationId: 2, locationType: "warehouse", quantity: 80 },
      { productId: 3, locationId: 2, locationType: "store", quantity: 20 },
      { productId: 3, locationId: 3, locationType: "store", quantity: 20 },
      
      // Product 4 (Tile) inventory  
      { productId: 4, locationId: 3, locationType: "warehouse", quantity: 150 },
      { productId: 4, locationId: 1, locationType: "store", quantity: 30 },
      { productId: 4, locationId: 3, locationType: "store", quantity: 30 },
      
      // Product 5 (Pipe) inventory
      { productId: 5, locationId: 1, locationType: "warehouse", quantity: 200 },
      { productId: 5, locationId: 1, locationType: "store", quantity: 75 },
    ];

    for (const inventory of inventoryRecords) {
      await storage.updateInventory(inventory);
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}