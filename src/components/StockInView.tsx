import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Barcode,
  Search,
  CheckCircle2,
  Printer,
  Calendar,
  Layers,
  Truck,
  Plus,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Product, Supplier, User, StockTransaction } from '../types/inventory';
import { recordStockIn } from '../services/storage';

interface StockInViewProps {
  products: Product[];
  suppliers: Supplier[];
  currentUser: User;
  onSuccess: (txn: StockTransaction) => void;
  preselectedProduct?: Product | null;
}

export const StockInView: React.FC<StockInViewProps> = ({
  products,
  suppliers,
  currentUser,
  onSuccess,
  preselectedProduct,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProduct ? preselectedProduct.id : products[0]?.id || ''
  );
  const [barcodeScanInput, setBarcodeScanInput] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(
    preselectedProduct ? preselectedProduct.costPrice : products[0]?.costPrice || 50
  );
  const [batchNumber, setBatchNumber] = useState(`LOT-${Date.now().toString().slice(-6)}`);

  // Default expiration date: 6 months from now
  const defaultExp = new Date();
  defaultExp.setMonth(defaultExp.getMonth() + 6);
  const [expiryDate, setExpiryDate] = useState(defaultExp.toISOString().split('T')[0]);

  const [targetLocation, setTargetLocation] = useState<'warehouse' | 'store_front'>('warehouse');
  const [referenceNumber, setReferenceNumber] = useState(`DR-${Math.floor(100000 + Math.random() * 900000)}`);
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    preselectedProduct ? preselectedProduct.supplierId : products[0]?.supplierId || ''
  );
  const [notes, setNotes] = useState('Standard supplier replenishment delivery');
  const [lastSubmittedTxn, setLastSubmittedTxn] = useState<StockTransaction | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const currentProduct = products.find((p) => p.id === selectedProductId);

  // When selected product changes, sync supplier and unit cost
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setUnitCost(prod.costPrice);
      setSelectedSupplierId(prod.supplierId);
      setBatchNumber(`LOT-${Date.now().toString().slice(-6)}`);
    }
  };

  // Barcode quick lookup simulator
  const handleBarcodeSearch = (code: string) => {
    setBarcodeScanInput(code);
    const matched = products.find((p) => p.barcode === code.trim() || p.sku.toLowerCase() === code.trim().toLowerCase());
    if (matched) {
      handleProductSelect(matched.id);
      setErrorMsg('');
    } else if (code.trim().length > 5) {
      setErrorMsg(`No product found with barcode or SKU "${code}"`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedProductId) {
      setErrorMsg('Please select a valid product.');
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    if (!expiryDate) {
      setErrorMsg('Please specify the expiration date for this grocery batch.');
      return;
    }

    try {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      const txn = recordStockIn({
        productId: selectedProductId,
        quantity,
        unitCost,
        batchNumber,
        expiryDate,
        targetLocation,
        supplierId: selectedSupplierId,
        supplierName: supplier ? supplier.name : currentProduct?.supplierName,
        referenceNumber,
        notes,
        currentUser,
      });

      setLastSubmittedTxn(txn);
      onSuccess(txn);

      // Reset reference and batch for next fast scan
      setBatchNumber(`LOT-${Date.now().toString().slice(-6)}`);
      setReferenceNumber(`DR-${Math.floor(100000 + Math.random() * 900000)}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording incoming stock');
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
            Stock In & Receiving Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record incoming supplier deliveries, assign batch/lot numbers, and register expiration dates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fast Receiving Mode Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-sm">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Barcode Quick Scan Bar */}
          <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-emerald-500/30">
            <label className="block text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Barcode className="w-4 h-4" />
              Barcode Scanner / Fast SKU Search
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={barcodeScanInput}
                onChange={(e) => handleBarcodeSearch(e.target.value)}
                placeholder="Scan product barcode (e.g. 4800016001012) or type SKU..."
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  // Simulate scanning first product
                  if (products[0]) handleBarcodeSearch(products[0].barcode);
                }}
                className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold transition"
              >
                Scan Sample
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports handheld USB/Bluetooth barcode scanners. Press enter or scan barcode directly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Grocery Item *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — [SKU: {p.sku}] (Current Stock: {p.warehouseStock + p.storeShelfStock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Product Info Snapshot */}
            {currentProduct && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Category:</span>{' '}
                  <span className="font-semibold text-white">{currentProduct.category}</span>
                </div>
                <div>
                  <span className="text-slate-400">Storage Location:</span>{' '}
                  <span className="font-mono text-emerald-400 font-bold">{currentProduct.location.binCode}</span>{' '}
                  <span className="text-slate-400">({currentProduct.location.zone})</span>
                </div>
                <div>
                  <span className="text-slate-400">Current Balance:</span>{' '}
                  <span className="font-bold text-white">
                    {currentProduct.warehouseStock} Wh / {currentProduct.storeShelfStock} Shelf
                  </span>
                </div>
              </div>
            )}

            {/* Quantity and Unit Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Quantity Received ({currentProduct?.unit || 'units'}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Unit Cost (PHP ₱) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Batch / Lot and Expiration Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Batch / Lot Number *
                </label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. LOT-2610-A"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Expiration Date (Perishable / Grocery) *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Target Location and Supplier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Slotting Destination *
                </label>
                <select
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="warehouse">Warehouse Backroom Storage ({currentProduct?.location.zone})</option>
                  <option value="store_front">Direct to Front Store Shelf</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Distributor / Supplier
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Delivery Reference & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Delivery Receipt # / Invoice Ref *
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. DR-882910"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Receiving Notes / Condition
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Inspected good seal, cold chain verified"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Total Cost Display */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <span>Total Shipment Line Value:</span>
              <span className="font-bold text-emerald-400 text-sm">
                ₱{(quantity * unitCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Delivery & Update Inventory</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Instant Receiving Receipt & Best Practices */}
        <div className="space-y-6">
          {/* Printable Receipt Card */}
          {lastSubmittedTxn ? (
            <div className="bg-slate-850 border border-emerald-500/40 rounded-2xl p-5 shadow-lg relative">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Stock Received Successfully!</span>
                </div>
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Slip
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="text-center font-bold text-white text-sm">
                  DUEÑAS STORES - GOODS RECEIVING NOTE
                </div>
                <div className="text-center text-[10px] text-slate-400">
                  Ref: {lastSubmittedTxn.referenceNumber} • {new Date(lastSubmittedTxn.timestamp).toLocaleString()}
                </div>
                <div className="border-t border-dashed border-slate-700 my-2 pt-2 text-[11px] space-y-1">
                  <div className="text-white font-bold">{lastSubmittedTxn.productName}</div>
                  <div className="text-slate-400">SKU: {lastSubmittedTxn.sku}</div>
                  <div className="flex justify-between text-slate-300">
                    <span>Received Qty:</span>
                    <span className="font-bold text-emerald-400">
                      +{lastSubmittedTxn.quantity} {lastSubmittedTxn.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Unit Cost:</span>
                    <span>₱{lastSubmittedTxn.unitCost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Value:</span>
                    <span className="font-bold">₱{lastSubmittedTxn.totalValue?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Batch Number:</span>
                    <span className="text-white">{lastSubmittedTxn.batchNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Batch Expiry:</span>
                    <span className="text-amber-400 font-bold">{lastSubmittedTxn.expiryDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Stored At:</span>
                    <span className="text-white">{lastSubmittedTxn.toLocation}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px] pt-1">
                    <span>Receiver:</span>
                    <span>{lastSubmittedTxn.performedByName}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-400">
              <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <div className="font-bold text-slate-300">No recent receiving slip in session</div>
              <p className="text-[11px] mt-1">Submit the receiving form to generate an instant printable acceptance slip.</p>
            </div>
          )}

          {/* Receiving Guidelines for Dueñas Store */}
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-400" />
              Standard Receiving Protocols
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Physical Verification:</strong> Count sacks, cartons, and cases against supplier delivery receipt before signing.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Expiration Check:</strong> Reject items with less than 90 days validity unless clearance pricing agreed with management.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>FEFO Slotting:</strong> Place newer batches behind existing stock in backroom warehouse racks.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
