import React, { useState, useEffect } from 'react';
import { Package, X, Check, Barcode, MapPin } from 'lucide-react';
import { Product, ProductCategory, ProductUnit, Supplier, WarehouseZone } from '../types/inventory';
import { saveProduct } from '../services/storage';

interface ProductModalProps {
  product?: Product | null;
  suppliers: Supplier[];
  zones: WarehouseZone[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  suppliers,
  zones,
  isOpen,
  onClose,
  onSaved,
}) => {
  const isEditing = !!product;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Canned Goods');
  const [unit, setUnit] = useState<ProductUnit>('pcs');
  const [costPrice, setCostPrice] = useState<number>(30);
  const [sellingPrice, setSellingPrice] = useState<number>(40);
  const [warehouseStock, setWarehouseStock] = useState<number>(20);
  const [storeShelfStock, setStoreShelfStock] = useState<number>(5);
  const [minReorderLevel, setMinReorderLevel] = useState<number>(10);
  const [maxStockLevel, setMaxStockLevel] = useState<number>(100);
  const [zone, setZone] = useState('Zone C');
  const [aisle, setAisle] = useState('Aisle 1');
  const [shelf, setShelf] = useState('Shelf 1');
  const [binCode, setBinCode] = useState('C1-S1');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setBrand(product.brand);
      setSku(product.sku);
      setBarcode(product.barcode);
      setCategory(product.category);
      setUnit(product.unit);
      setCostPrice(product.costPrice);
      setSellingPrice(product.sellingPrice);
      setWarehouseStock(product.warehouseStock);
      setStoreShelfStock(product.storeShelfStock);
      setMinReorderLevel(product.minReorderLevel);
      setMaxStockLevel(product.maxStockLevel);
      setZone(product.location.zone);
      setAisle(product.location.aisle);
      setShelf(product.location.shelf);
      setBinCode(product.location.binCode);
      setSupplierId(product.supplierId);
      setDescription(product.description || '');
    } else {
      // Defaults for new item
      setName('');
      setBrand('');
      const randomSku = `SKU-${Date.now().toString().slice(-6)}`;
      setSku(randomSku);
      setBarcode(`48000${Math.floor(10000000 + Math.random() * 90000000)}`);
      setCostPrice(30);
      setSellingPrice(40);
      setWarehouseStock(20);
      setStoreShelfStock(5);
      setMinReorderLevel(10);
      setMaxStockLevel(100);
      setBinCode('C1-S1');
      setDescription('');
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === supplierId);

    const savedData: Product = {
      id: product?.id || `prod-${Date.now()}`,
      sku,
      barcode,
      name,
      brand,
      category,
      unit,
      costPrice,
      sellingPrice,
      warehouseStock,
      storeShelfStock,
      minReorderLevel,
      maxStockLevel,
      location: {
        zone,
        aisle,
        shelf,
        binCode,
      },
      batches: product?.batches || [
        {
          id: `batch-${Date.now()}`,
          batchNumber: `LOT-${Date.now().toString().slice(-6)}`,
          quantity: warehouseStock + storeShelfStock,
          initialQuantity: warehouseStock + storeShelfStock,
          expiryDate: new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0],
          receivedDate: new Date().toISOString().split('T')[0],
          supplierId,
          location: 'warehouse',
          unitCost: costPrice,
        },
      ],
      supplierId,
      supplierName: sup ? sup.name : 'Direct Wholesaler',
      description,
      updatedAt: new Date().toISOString(),
    };

    saveProduct(savedData);
    onSaved();
    onClose();
  };

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

  const units: ProductUnit[] = ['pcs', 'pack', 'sack', 'kg', 'can', 'bottle', 'box', 'tray', 'case'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>{isEditing ? `Edit "${product?.name}"` : 'Register New Grocery Product'}</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Argentina Corned Beef 175g"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Argentina"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SKU, Barcode, Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Barcode *</label>
                <button
                  type="button"
                  onClick={() => setBarcode(`48000${Math.floor(10000000 + Math.random() * 90000000)}`)}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Gen EAN
                </button>
              </div>
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measure *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Wholesale Cost Price (PHP ₱) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Storefront Selling Price (PHP ₱) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Stock Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-850 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Warehouse Stock
              </label>
              <input
                type="number"
                min="0"
                value={warehouseStock}
                onChange={(e) => setWarehouseStock(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white text-center"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Front Shelf Stock
              </label>
              <input
                type="number"
                min="0"
                value={storeShelfStock}
                onChange={(e) => setStoreShelfStock(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-emerald-400 text-center"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Min Reorder Level
              </label>
              <input
                type="number"
                min="1"
                value={minReorderLevel}
                onChange={(e) => setMinReorderLevel(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-amber-400 text-center"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Max Stock Cap
              </label>
              <input
                type="number"
                min="1"
                value={maxStockLevel}
                onChange={(e) => setMaxStockLevel(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white text-center"
              />
            </div>
          </div>

          {/* Warehouse Slotting Location */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Zone</label>
              <select
                value={zone}
                onChange={(e) => {
                  setZone(e.target.value);
                  setBinCode(`${e.target.value.replace('Zone ', '')}1-S1`);
                }}
                className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="Zone A">Zone A (Grains)</option>
                <option value="Zone B">Zone B (Beverages)</option>
                <option value="Zone C">Zone C (Canned/Dry)</option>
                <option value="Zone D">Zone D (Chilled)</option>
                <option value="Zone E">Zone E (Non-Food)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Aisle</label>
              <input
                type="text"
                value={aisle}
                onChange={(e) => setAisle(e.target.value)}
                placeholder="Aisle 1"
                className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shelf / Bay</label>
              <input
                type="text"
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                placeholder="Shelf 1"
                className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bin Code *</label>
              <input
                type="text"
                required
                value={binCode}
                onChange={(e) => setBinCode(e.target.value)}
                placeholder="C1-S1"
                className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400"
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier / Distributor</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Register Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
