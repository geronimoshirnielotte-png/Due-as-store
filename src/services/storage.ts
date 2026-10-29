import {
  Product,
  Supplier,
  WarehouseZone,
  StockTransaction,
  User,
  PurchaseOrder,
  AuditSession,
  ProductCategory,
  StockStatus,
} from '../types/inventory';
import {
  INITIAL_USERS,
  INITIAL_SUPPLIERS,
  INITIAL_WAREHOUSE_ZONES,
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  INITIAL_PURCHASE_ORDERS,
} from '../data/initialData';

const STORAGE_KEYS = {
  CURRENT_USER: 'duenas_inventory_current_user',
  USERS: 'duenas_inventory_users',
  PRODUCTS: 'duenas_inventory_products',
  TRANSACTIONS: 'duenas_inventory_transactions',
  SUPPLIERS: 'duenas_inventory_suppliers',
  WAREHOUSE_ZONES: 'duenas_inventory_zones',
  PURCHASE_ORDERS: 'duenas_inventory_pos',
  AUDITS: 'duenas_inventory_audits',
};

// Simple event dispatcher for real-time reactivity
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeToStorage = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifySubscribers = () => {
  listeners.forEach((fn) => fn());
};

// Safe localStorage wrapper
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
};

// Initialize if empty
export const initializeStorage = (): void => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
    setStorageItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.WAREHOUSE_ZONES)) {
    setStorageItem(STORAGE_KEYS.WAREHOUSE_ZONES, INITIAL_WAREHOUSE_ZONES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    setStorageItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    setStorageItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS)) {
    setStorageItem(STORAGE_KEYS.PURCHASE_ORDERS, INITIAL_PURCHASE_ORDERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDITS)) {
    setStorageItem(STORAGE_KEYS.AUDITS, []);
  }

  // Set default logged in user if none
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    setStorageItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  }
};

// Auth operations
export const getCurrentUser = (): User | null => {
  initializeStorage();
  return getStorageItem<User | null>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
};

export const setCurrentUser = (user: User | null): void => {
  setStorageItem(STORAGE_KEYS.CURRENT_USER, user);
  notifySubscribers();
};

export const getUsers = (): (User & { passwordHash: string })[] => {
  initializeStorage();
  return getStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
};

export const loginUser = (email: string, password: string): { success: boolean; user?: User; error?: string } => {
  const users = getUsers();
  const matched = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.passwordHash === password
  );

  if (matched) {
    const updatedUser = {
      ...matched,
      lastLogin: new Date().toLocaleString(),
    };
    setCurrentUser(updatedUser);
    return { success: true, user: updatedUser };
  }
  return { success: false, error: 'Invalid email address or password. Please verify credentials.' };
};

export const loginAdmin = (
  email: string,
  password: string,
  securityPin?: string
): { success: boolean; user?: User; error?: string } => {
  const users = getUsers();
  const matched = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.passwordHash === password
  );

  if (!matched) {
    return { success: false, error: 'Invalid administrator email address or password.' };
  }

  if (matched.role !== 'admin') {
    return {
      success: false,
      error: `Access Denied: Account "${matched.name}" has ${matched.role.toUpperCase()} role and does not possess Administrator clearance. Please sign in via the Staff portal.`,
    };
  }

  // Optional Security PIN check (default master security PIN is 8899)
  if (securityPin && securityPin.trim() !== '' && securityPin.trim() !== '8899') {
    return { success: false, error: 'Invalid Administrator Security PIN. (Default Master PIN: 8899)' };
  }

  const updatedUser = {
    ...matched,
    lastLogin: new Date().toLocaleString(),
  };
  setCurrentUser(updatedUser);
  return { success: true, user: updatedUser };
};


export const quickLoginAsRole = (role: 'admin' | 'manager' | 'staff'): User => {
  const users = getUsers();
  const matched = users.find((u) => u.role === role) || INITIAL_USERS[0];
  setCurrentUser(matched);
  return matched;
};

export const registerUser = (userData: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'staff';
  title: string;
  phone?: string;
}): { success: boolean; user?: User; error?: string } => {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
    return { success: false, error: 'User with this email already exists.' };
  }

  const newUser: User & { passwordHash: string } = {
    id: `user-${Date.now()}`,
    name: userData.name,
    email: userData.email,
    passwordHash: userData.password,
    role: userData.role,
    title: userData.title,
    phone: userData.phone || '',
    avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    lastLogin: new Date().toLocaleString(),
  };

  const updatedUsers = [...users, newUser];
  setStorageItem(STORAGE_KEYS.USERS, updatedUsers);
  setCurrentUser(newUser);
  return { success: true, user: newUser };
};

export const logoutUser = (): void => {
  setCurrentUser(null);
};

// Helper: Calculate product stock status & earliest expiry
export const getProductStatus = (
  product: Pick<Product, 'warehouseStock' | 'storeShelfStock' | 'minReorderLevel' | 'batches'>
): {
  status: StockStatus;
  totalStock: number;
  earliestExpiry: string | null;
  daysUntilExpiry: number | null;
} => {
  const totalStock = (product.warehouseStock || 0) + (product.storeShelfStock || 0);

  // Find earliest batch expiry
  let earliestExpiry: string | null = null;
  let minDays: number | null = null;

  if (product.batches && product.batches.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const batch of product.batches) {
      if (batch.quantity > 0 && batch.expiryDate) {
        const exp = new Date(batch.expiryDate);
        const diffMs = exp.getTime() - today.getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (minDays === null || days < minDays) {
          minDays = days;
          earliestExpiry = batch.expiryDate;
        }
      }
    }
  }

  let status: StockStatus = 'in_stock';
  if (totalStock === 0) {
    status = 'out_of_stock';
  } else if (minDays !== null && minDays <= 0) {
    status = 'expired';
  } else if (minDays !== null && minDays <= 30) {
    status = 'expiring_soon';
  } else if (totalStock <= product.minReorderLevel) {
    status = 'low_stock';
  }

  return {
    status,
    totalStock,
    earliestExpiry,
    daysUntilExpiry: minDays,
  };
};

// Product operations
export const getProducts = (): Product[] => {
  initializeStorage();
  return getStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
};

export const getProductById = (id: string): Product | undefined => {
  return getProducts().find((p) => p.id === id);
};

export const saveProduct = (product: Product): void => {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  const updatedProduct = {
    ...product,
    updatedAt: new Date().toISOString(),
  };

  let updatedList: Product[];
  if (index >= 0) {
    updatedList = [...products];
    updatedList[index] = updatedProduct;
  } else {
    updatedList = [updatedProduct, ...products];
  }

  setStorageItem(STORAGE_KEYS.PRODUCTS, updatedList);
  notifySubscribers();
};

export const deleteProduct = (id: string): void => {
  const products = getProducts().filter((p) => p.id !== id);
  setStorageItem(STORAGE_KEYS.PRODUCTS, products);
  notifySubscribers();
};

// Transactions
export const getTransactions = (): StockTransaction[] => {
  initializeStorage();
  return getStorageItem<StockTransaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
};

export const addTransaction = (txn: Omit<StockTransaction, 'id' | 'timestamp'>): StockTransaction => {
  const transactions = getTransactions();
  const newTxn: StockTransaction = {
    ...txn,
    id: `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };

  setStorageItem(STORAGE_KEYS.TRANSACTIONS, [newTxn, ...transactions]);
  notifySubscribers();
  return newTxn;
};

// Execute stock in (Receiving)
export const recordStockIn = (params: {
  productId: string;
  quantity: number;
  unitCost: number;
  batchNumber: string;
  expiryDate: string;
  targetLocation: 'warehouse' | 'store_front';
  supplierId?: string;
  supplierName?: string;
  referenceNumber: string;
  notes?: string;
  currentUser: User;
}): StockTransaction => {
  const product = getProductById(params.productId);
  if (!product) throw new Error('Product not found');

  const newBatch = {
    id: `batch-${Date.now()}`,
    batchNumber: params.batchNumber || `LOT-${Date.now().toString().slice(-6)}`,
    quantity: params.quantity,
    initialQuantity: params.quantity,
    expiryDate: params.expiryDate,
    receivedDate: new Date().toISOString().split('T')[0],
    supplierId: params.supplierId || product.supplierId,
    location: params.targetLocation,
    unitCost: params.unitCost,
  };

  const updatedBatches = [...(product.batches || []), newBatch];
  const updatedWarehouse =
    params.targetLocation === 'warehouse' ? product.warehouseStock + params.quantity : product.warehouseStock;
  const updatedShelf =
    params.targetLocation === 'store_front' ? product.storeShelfStock + params.quantity : product.storeShelfStock;

  saveProduct({
    ...product,
    warehouseStock: updatedWarehouse,
    storeShelfStock: updatedShelf,
    costPrice: params.unitCost || product.costPrice,
    batches: updatedBatches,
    updatedAt: new Date().toISOString(),
  });

  return addTransaction({
    type: 'stock_in',
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    category: product.category,
    quantity: params.quantity,
    unit: product.unit,
    unitCost: params.unitCost,
    totalValue: params.unitCost * params.quantity,
    fromLocation: params.supplierName || product.supplierName || 'Supplier Delivery',
    toLocation: params.targetLocation === 'warehouse' ? `Warehouse (${product.location.zone})` : 'Storefront Shelf',
    batchNumber: newBatch.batchNumber,
    expiryDate: params.expiryDate,
    referenceNumber: params.referenceNumber,
    notes: params.notes,
    performedByUserId: params.currentUser.id,
    performedByName: params.currentUser.name,
  });
};

// Execute stock out (Sale or Dispatch or Disposal)
export const recordStockOut = (params: {
  productId: string;
  quantity: number;
  sourceLocation: 'store_front' | 'warehouse';
  type: 'stock_out' | 'damage_writeoff' | 'expired_disposal' | 'supplier_return';
  sellingPrice?: number;
  reason?: string;
  referenceNumber: string;
  notes?: string;
  currentUser: User;
}): StockTransaction => {
  const product = getProductById(params.productId);
  if (!product) throw new Error('Product not found');

  let remainingToDeduct = params.quantity;
  const isShelf = params.sourceLocation === 'store_front';

  let currentWarehouse = product.warehouseStock;
  let currentShelf = product.storeShelfStock;

  if (isShelf) {
    if (currentShelf < params.quantity) {
      throw new Error(`Insufficient shelf stock. Available: ${currentShelf}, Requested: ${params.quantity}`);
    }
    currentShelf -= params.quantity;
  } else {
    if (currentWarehouse < params.quantity) {
      throw new Error(`Insufficient warehouse stock. Available: ${currentWarehouse}, Requested: ${params.quantity}`);
    }
    currentWarehouse -= params.quantity;
  }

  // Deduct from batches using FIFO / FEFO (earliest expiry first)
  const sortedBatches = [...(product.batches || [])].sort((a, b) => {
    return new Date(a.expiryDate || '9999').getTime() - new Date(b.expiryDate || '9999').getTime();
  });

  const updatedBatches = sortedBatches.map((b) => {
    if (remainingToDeduct <= 0 || b.quantity <= 0) return b;
    const deduct = Math.min(b.quantity, remainingToDeduct);
    remainingToDeduct -= deduct;
    return {
      ...b,
      quantity: b.quantity - deduct,
    };
  });

  saveProduct({
    ...product,
    warehouseStock: currentWarehouse,
    storeShelfStock: currentShelf,
    batches: updatedBatches,
    updatedAt: new Date().toISOString(),
  });

  const price = params.sellingPrice ?? product.sellingPrice;
  return addTransaction({
    type: params.type,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    category: product.category,
    quantity: params.quantity,
    unit: product.unit,
    unitPrice: price,
    unitCost: product.costPrice,
    totalValue: params.type === 'stock_out' ? price * params.quantity : product.costPrice * params.quantity,
    fromLocation: isShelf ? 'Storefront Shelf' : `Warehouse (${product.location.zone})`,
    toLocation:
      params.type === 'stock_out'
        ? 'Customer Checkout'
        : params.type === 'damage_writeoff'
        ? 'Damage Bin'
        : params.type === 'expired_disposal'
        ? 'Disposal/Discard'
        : 'Supplier Return',
    referenceNumber: params.referenceNumber,
    reason: params.reason,
    notes: params.notes,
    performedByUserId: params.currentUser.id,
    performedByName: params.currentUser.name,
  });
};

// Transfer from warehouse to store shelf (replenishment)
export const transferStockToShelf = (params: {
  productId: string;
  quantity: number;
  currentUser: User;
  notes?: string;
}): StockTransaction => {
  const product = getProductById(params.productId);
  if (!product) throw new Error('Product not found');

  if (product.warehouseStock < params.quantity) {
    throw new Error(`Insufficient warehouse stock to transfer. Available: ${product.warehouseStock}`);
  }

  saveProduct({
    ...product,
    warehouseStock: product.warehouseStock - params.quantity,
    storeShelfStock: product.storeShelfStock + params.quantity,
    updatedAt: new Date().toISOString(),
  });

  return addTransaction({
    type: 'transfer_to_shelf',
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    category: product.category,
    quantity: params.quantity,
    unit: product.unit,
    unitCost: product.costPrice,
    totalValue: product.costPrice * params.quantity,
    fromLocation: `Warehouse Backroom (${product.location.zone} - ${product.location.binCode})`,
    toLocation: `Storefront Shelf (${product.location.aisle})`,
    referenceNumber: `TRF-${Date.now().toString().slice(-6)}`,
    notes: params.notes || 'Front shelf replenishment from backroom warehouse',
    performedByUserId: params.currentUser.id,
    performedByName: params.currentUser.name,
  });
};

// Suppliers
export const getSuppliers = (): Supplier[] => {
  initializeStorage();
  return getStorageItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
};

export const saveSupplier = (supplier: Supplier): void => {
  const suppliers = getSuppliers();
  const idx = suppliers.findIndex((s) => s.id === supplier.id);
  let updated: Supplier[];
  if (idx >= 0) {
    updated = [...suppliers];
    updated[idx] = supplier;
  } else {
    updated = [supplier, ...suppliers];
  }
  setStorageItem(STORAGE_KEYS.SUPPLIERS, updated);
  notifySubscribers();
};

// Warehouse zones
export const getWarehouseZones = (): WarehouseZone[] => {
  initializeStorage();
  return getStorageItem(STORAGE_KEYS.WAREHOUSE_ZONES, INITIAL_WAREHOUSE_ZONES);
};

// Purchase Orders
export const getPurchaseOrders = (): PurchaseOrder[] => {
  initializeStorage();
  return getStorageItem(STORAGE_KEYS.PURCHASE_ORDERS, INITIAL_PURCHASE_ORDERS);
};

export const savePurchaseOrder = (po: PurchaseOrder): void => {
  const list = getPurchaseOrders();
  const idx = list.findIndex((p) => p.id === po.id);
  let updated: PurchaseOrder[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = po;
  } else {
    updated = [po, ...list];
  }
  setStorageItem(STORAGE_KEYS.PURCHASE_ORDERS, updated);
  notifySubscribers();
};

// Audits
export const getAudits = (): AuditSession[] => {
  initializeStorage();
  return getStorageItem(STORAGE_KEYS.AUDITS, []);
};

export const saveAudit = (audit: AuditSession): void => {
  const list = getAudits();
  const idx = list.findIndex((a) => a.id === audit.id);
  let updated: AuditSession[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = audit;
  } else {
    updated = [audit, ...list];
  }
  setStorageItem(STORAGE_KEYS.AUDITS, updated);
  notifySubscribers();
};

// Backup and Restore
export const exportDatabaseJSON = (): string => {
  const backup = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    storeName: 'Dueñas Store',
    users: getUsers(),
    products: getProducts(),
    transactions: getTransactions(),
    suppliers: getSuppliers(),
    zones: getWarehouseZones(),
    purchaseOrders: getPurchaseOrders(),
    audits: getAudits(),
  };
  return JSON.stringify(backup, null, 2);
};

export const importDatabaseJSON = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.products || !Array.isArray(data.products)) return false;

    if (data.users) setStorageItem(STORAGE_KEYS.USERS, data.users);
    if (data.products) setStorageItem(STORAGE_KEYS.PRODUCTS, data.products);
    if (data.transactions) setStorageItem(STORAGE_KEYS.TRANSACTIONS, data.transactions);
    if (data.suppliers) setStorageItem(STORAGE_KEYS.SUPPLIERS, data.suppliers);
    if (data.zones) setStorageItem(STORAGE_KEYS.WAREHOUSE_ZONES, data.zones);
    if (data.purchaseOrders) setStorageItem(STORAGE_KEYS.PURCHASE_ORDERS, data.purchaseOrders);
    if (data.audits) setStorageItem(STORAGE_KEYS.AUDITS, data.audits);

    notifySubscribers();
    return true;
  } catch (err) {
    console.error('Import failed:', err);
    return false;
  }
};

export const resetToDefaultData = (): void => {
  setStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  setStorageItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  setStorageItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  setStorageItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  setStorageItem(STORAGE_KEYS.WAREHOUSE_ZONES, INITIAL_WAREHOUSE_ZONES);
  setStorageItem(STORAGE_KEYS.PURCHASE_ORDERS, INITIAL_PURCHASE_ORDERS);
  setStorageItem(STORAGE_KEYS.AUDITS, []);
  setStorageItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  notifySubscribers();
};
