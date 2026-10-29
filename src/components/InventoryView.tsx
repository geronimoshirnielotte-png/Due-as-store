import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Barcode,
  Layers,
  AlertTriangle,
  Clock,
  Printer,
  Edit,
  Trash2,
  RefreshCw,
  ArrowRight,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { Product, ProductCategory, StockStatus, User } from '../types/inventory';
import { getProductStatus, deleteProduct } from '../services/storage';

interface InventoryViewProps {
  products: Product[];
  currentUser: User;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onPrintBarcode: (product: Product) => void;
  onQuickTransfer: (product: Product) => void;
  onStockInProduct: (product: Product) => void;
  selectedProductId?: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  currentUser,
  onAddProduct,
  onEditProduct,
  onPrintBarcode,
  onQuickTransfer,
  onStockInProduct,
  selectedProductId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price' | 'category'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Categories list
  const categories: ProductCategory[] = [
    'Grains & Rice',
    'Canned Goods',
    'Noodles & Pasta',
    'Dairy & Chilled',
    'Beverages',
    'Condiments & Sauces',
    'Snacks & Biscuits',
    'Household Care',
    'Personal Care',
    'Baking & Cooking',
    'General Grocery',
  ];

  // Filtering and Sorting
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search term
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.barcode.includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.location.binCode.toLowerCase().includes(term);

        if (!matchesSearch) return false;

        // Category filter
        if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;

        // Status filter
        if (statusFilter !== 'all') {
          const { status } = getProductStatus(p);
          if (statusFilter === 'low_stock' && status !== 'low_stock') return false;
          if (statusFilter === 'out_of_stock' && status !== 'out_of_stock') return false;
          if (statusFilter === 'expiring_soon' && status !== 'expiring_soon') return false;
          if (statusFilter === 'in_stock' && status !== 'in_stock') return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortBy === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortBy === 'stock') {
          valA = a.warehouseStock + a.storeShelfStock;
          valB = b.warehouseStock + b.storeShelfStock;
        } else if (sortBy === 'price') {
          valA = a.sellingPrice;
          valB = b.sellingPrice;
        } else if (sortBy === 'category') {
          valA = a.category;
          valB = b.category;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Barcode',
      'Product Name',
      'Brand',
      'Category',
      'Unit',
      'Cost Price (PHP)',
      'Selling Price (PHP)',
      'Warehouse Stock',
      'Shelf Stock',
      'Total Stock',
      'Min Reorder Level',
      'Storage Bin',
      'Supplier',
    ];

    const rows = products.map((p) => [
      `"${p.sku}"`,
      `"${p.barcode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brand}"`,
      `"${p.category}"`,
      `"${p.unit}"`,
      p.costPrice.toFixed(2),
      p.sellingPrice.toFixed(2),
      p.warehouseStock,
      p.storeShelfStock,
      p.warehouseStock + p.storeShelfStock,
      p.minReorderLevel,
      `"${p.location.binCode}"`,
      `"${p.supplierName.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Duenas_Stores_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from Dueñas Stores catalog?`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            Inventory Master Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time stock balance across warehouse backroom and grocery storefront shelves
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>

          {currentUser.role !== 'staff' && (
            <button
              type="button"
              onClick={onAddProduct}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by product name, SKU, barcode, bin..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-52">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Grocery Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (Healthy)</option>
              <option value="low_stock">Low Stock (Reorder)</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="expiring_soon">Expiring Soon (FEFO)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="w-full md:w-44">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="name">Sort by: Product Name</option>
              <option value="stock">Sort by: Stock Quantity</option>
              <option value="price">Sort by: Retail Price</option>
              <option value="category">Sort by: Category</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Summary Pill Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          <div>
            Showing <span className="font-bold text-white">{filteredProducts.length}</span> of {products.length} total items
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> In Stock
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Low Stock
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Out of Stock
            </span>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Bin Location</th>
                <th className="py-3 px-3">Warehouse vs Shelf</th>
                <th className="py-3 px-3">Total Balance</th>
                <th className="py-3 px-3">Pricing & Margin</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-medium text-slate-300">No products matching the selected criteria</p>
                    <p className="text-[11px] mt-1">Try resetting the search bar or filters</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const { status, totalStock, earliestExpiry, daysUntilExpiry } = getProductStatus(p);
                  const marginPct = (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(0);
                  const isSelected = selectedProductId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/60 transition ${
                        isSelected ? 'bg-emerald-950/30 border-l-4 border-l-emerald-400' : ''
                      }`}
                    >
                      {/* Item & SKU */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white leading-tight">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>{p.sku}</span>
                          <span>•</span>
                          <span className="text-slate-400">{p.brand}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Barcode: {p.barcode}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                          {p.category}
                        </span>
                      </td>

                      {/* Bin Location */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-emerald-400 font-semibold">{p.location.binCode}</div>
                        <div className="text-[10px] text-slate-400">{p.location.zone}</div>
                      </td>

                      {/* Stock Split (Warehouse vs Shelf) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-slate-400">Wh:</span>
                          <span className="font-bold text-slate-200">{p.warehouseStock}</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-400">Shelf:</span>
                          <span className="font-bold text-emerald-400">{p.storeShelfStock}</span>
                        </div>
                        {p.warehouseStock > 0 && p.storeShelfStock <= 5 && (
                          <button
                            type="button"
                            onClick={() => onQuickTransfer(p)}
                            className="mt-1 text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Refill Shelf
                          </button>
                        )}
                      </td>

                      {/* Total Stock */}
                      <td className="py-3 px-3">
                        <div className="font-black text-sm text-white">
                          {totalStock} <span className="text-xs font-normal text-slate-400">{p.unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Min: {p.minReorderLevel}</div>
                      </td>

                      {/* Pricing & Margin */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">₱{p.sellingPrice.toFixed(2)}</div>
                        <div className="text-[11px] text-slate-400">
                          Cost: ₱{p.costPrice.toFixed(2)}{' '}
                          <span className="text-emerald-400 font-semibold">({marginPct}%)</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {status === 'out_of_stock' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Out of Stock
                          </span>
                        )}
                        {status === 'low_stock' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        )}
                        {status === 'expiring_soon' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" /> Expiring {daysUntilExpiry}d
                          </span>
                        )}
                        {status === 'in_stock' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Healthy
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Barcode Label */}
                          <button
                            type="button"
                            onClick={() => onPrintBarcode(p)}
                            title="Print Shelf Barcode Tag"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Barcode className="w-4 h-4 text-emerald-400" />
                          </button>

                          {/* Quick Stock-In receiving */}
                          <button
                            type="button"
                            onClick={() => onStockInProduct(p)}
                            title="Receive Incoming Stock"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          {currentUser.role !== 'staff' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onEditProduct(p)}
                                title="Edit Product Details"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {currentUser.role === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p.id, p.name)}
                                  title="Delete Product"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
