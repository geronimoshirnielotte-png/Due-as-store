export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatarUrl?: string;
  lastLogin?: string;
  phone?: string;
}

export type ProductCategory =
  | 'Canned Goods'
  | 'Grains & Rice'
  | 'Noodles & Pasta'
  | 'Dairy & Chilled'
  | 'Beverages'
  | 'Condiments & Sauces'
  | 'Snacks & Biscuits'
  | 'Household Care'
  | 'Personal Care'
  | 'Baking & Cooking'
  | 'General Grocery';

export type ProductUnit = 'pcs' | 'pack' | 'sack' | 'kg' | 'can' | 'bottle' | 'box' | 'tray' | 'case';

export interface ProductBatch {
  id: string;
  batchNumber: string;
  quantity: number;
  initialQuantity: number;
  expiryDate: string; // YYYY-MM-DD
  receivedDate: string; // YYYY-MM-DD
  supplierId?: string;
  location: 'warehouse' | 'store_front';
  unitCost: number;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  brand: string;
  category: ProductCategory;
  unit: ProductUnit;
  costPrice: number; // Cost to store (PHP)
  sellingPrice: number; // Retail price (PHP)
  warehouseStock: number; // In backroom warehouse
  storeShelfStock: number; // On active grocery store shelf
  minReorderLevel: number; // Alert threshold
  maxStockLevel: number;
  location: {
    zone: string; // e.g., 'Zone A', 'Zone B'
    aisle: string; // e.g., 'Aisle 2'
    shelf: string; // e.g., 'Shelf 3'
    binCode: string; // e.g., 'A2-S3'
  };
  batches: ProductBatch[];
  supplierId: string;
  supplierName: string;
  description?: string;
  updatedAt: string;
}

export type TransactionType =
  | 'stock_in' // Incoming delivery from supplier
  | 'stock_out' // Retail sale or outgoing dispatch
  | 'transfer_to_shelf' // Warehouse backroom to front grocery shelf
  | 'transfer_to_warehouse' // Front grocery shelf back to warehouse
  | 'damage_writeoff' // Spoiled, damaged, or broken
  | 'expired_disposal' // Expired product discarded
  | 'audit_adjustment' // Manual inventory count correction
  | 'supplier_return'; // Returned to vendor

export interface StockTransaction {
  id: string;
  timestamp: string; // ISO string
  type: TransactionType;
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  quantity: number;
  unit: ProductUnit;
  unitCost?: number;
  unitPrice?: number;
  totalValue?: number;
  fromLocation: string;
  toLocation: string;
  batchNumber?: string;
  expiryDate?: string;
  referenceNumber: string; // PO#, Delivery Receipt#, or POS#
  reason?: string;
  notes?: string;
  performedByUserId: string;
  performedByName: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  categories: ProductCategory[];
  leadTimeDays: number;
  paymentTerms: string;
  rating: number;
}

export interface WarehouseZone {
  id: string;
  code: string; // A, B, C, D, E
  name: string;
  description: string;
  type: 'Dry Ambient' | 'Bulk Grains' | 'Heavy Beverage' | 'Chilled Dairy' | 'Non-Food / Detergents';
  capacityBins: number;
  occupiedBins: number;
  color: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  unit: ProductUnit;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQty: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  status: 'draft' | 'pending' | 'partially_received' | 'completed' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export interface AuditRecordItem {
  productId: string;
  productName: string;
  sku: string;
  location: string;
  expectedWarehouseQty: number;
  expectedShelfQty: number;
  countedWarehouseQty: number;
  countedShelfQty: number;
  variance: number;
  unitCost: number;
  varianceValue: number;
  notes?: string;
}

export interface AuditSession {
  id: string;
  date: string;
  auditorId: string;
  auditorName: string;
  status: 'in_progress' | 'completed';
  items: AuditRecordItem[];
  totalVarianceCount: number;
  totalVarianceValue: number;
  notes?: string;
}
