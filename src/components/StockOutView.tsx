import React, { useState } from 'react';
import {
  ArrowUpRight,
  ShoppingCart,
  Trash2,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  Barcode,
} from 'lucide-react';
import { Product, User, StockTransaction } from '../types/inventory';
import { recordStockOut } from '../services/storage';

interface StockOutViewProps {
  products: Product[];
  currentUser: User;
  onSuccess: (txn: StockTransaction) => void;
}

export const StockOutView: React.FC<StockOutViewProps> = ({ products, currentUser, onSuccess }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [dispatchType, setDispatchType] = useState<
    'stock_out' | 'damage_writeoff' | 'expired_disposal' | 'supplier_return'
  >('stock_out');
  const [sourceLocation, setSourceLocation] = useState<'store_front' | 'warehouse'>('store_front');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('Standard grocery customer sale');
  const [referenceNumber, setReferenceNumber] = useState(`POS-${Math.floor(10000 + Math.random() * 90000)}`);
  const [notes, setNotes] = useState('');
  const [lastTxn, setLastTxn] = useState<StockTransaction | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const product = products.find((p) => p.id === selectedProductId);
  const availableStock =
    sourceLocation === 'store_front'
      ? product?.storeShelfStock || 0
      : product?.warehouseStock || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!product) {
      setErrorMsg('Please select a valid grocery item');
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('Quantity must be at least 1 unit');
      return;
    }

    if (quantity > availableStock) {
      setErrorMsg(
        `Insufficient stock in ${
          sourceLocation === 'store_front' ? 'Store Shelf' : 'Warehouse Backroom'
        }. Available: ${availableStock} ${product.unit}`
      );
      return;
    }

    try {
      const txn = recordStockOut({
        productId: product.id,
        quantity,
        sourceLocation,
        type: dispatchType,
        sellingPrice: product.sellingPrice,
        reason,
        referenceNumber,
        notes,
        currentUser,
      });

      setLastTxn(txn);
      onSuccess(txn);

      // Refresh reference
      setReferenceNumber(`POS-${Math.floor(10000 + Math.random() * 90000)}`);
      setQuantity(1);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing stock out');
    }
  };

  const setPresetReason = (type: typeof dispatchType) => {
    setDispatchType(type);
    if (type === 'stock_out') setReason('Customer retail sale / counter dispatch');
    if (type === 'damage_writeoff') setReason('Damaged packaging / can dent / punctured seal');
    if (type === 'expired_disposal') setReason('Past expiration date - condemned for disposal');
    if (type === 'supplier_return') setReason('Return to supplier for credit memo');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            Stock Out & Dispatch Recording
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Process customer retail dispatches, damage write-offs, and supplier returns with automatic deduction
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPresetReason('stock_out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              dispatchType === 'stock_out'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Customer Sale
          </button>

          <button
            type="button"
            onClick={() => setPresetReason('damage_writeoff')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              dispatchType === 'damage_writeoff'
                ? 'bg-red-500 text-white font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Damage / Spoilage
          </button>

          <button
            type="button"
            onClick={() => setPresetReason('supplier_return')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              dispatchType === 'supplier_return'
                ? 'bg-blue-500 text-white font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Supplier Return
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-sm">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Grocery Item *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — [Shelf: {p.storeShelfStock} | Warehouse: {p.warehouseStock} {p.unit}] (₱{p.sellingPrice.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Source Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Deduct Stock From Location *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceLocation('store_front')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      sourceLocation === 'store_front'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    Store Front Shelf ({product?.storeShelfStock || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceLocation('warehouse')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      sourceLocation === 'warehouse'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    Warehouse Backroom ({product?.warehouseStock || 0})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Quantity to Deduct ({product?.unit || 'units'}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={availableStock}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Available in selected location: <span className="text-emerald-400 font-bold">{availableStock} {product?.unit}</span>
                </p>
              </div>
            </div>

            {/* Reason & Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dispatch / Deduction Reason *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reference # (POS Slip, Incident Ref, RMA) *
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Clerk Remarks / Internal Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional customer name, shelf attendant notes, or reason for return"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Value Preview */}
            {product && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Total Transaction Value:</span>
                  <div className="font-bold text-white text-base">
                    ₱{((dispatchType === 'stock_out' ? product.sellingPrice : product.costPrice) * quantity).toFixed(2)}
                  </div>
                </div>
                <div className="text-right text-slate-400 text-[11px]">
                  <span>Item Retail: ₱{product.sellingPrice.toFixed(2)}</span>
                  <div>Item Cost: ₱{product.costPrice.toFixed(2)}</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={availableStock <= 0}
              className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Stock Out & Post Transaction</span>
            </button>
          </form>
        </div>

        {/* Right Column: Receipt / Dispatch Slip */}
        <div className="space-y-6">
          {lastTxn ? (
            <div className="bg-slate-850 border border-emerald-500/40 rounded-2xl p-5 shadow-lg relative">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dispatch Recorded</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="text-center font-bold text-white text-sm">
                  DUEÑAS STORES - DISPATCH MEMO
                </div>
                <div className="text-center text-[10px] text-slate-400">
                  Ref: {lastTxn.referenceNumber} • {new Date(lastTxn.timestamp).toLocaleTimeString()}
                </div>
                <div className="border-t border-dashed border-slate-700 my-2 pt-2 text-[11px] space-y-1">
                  <div className="text-white font-bold">{lastTxn.productName}</div>
                  <div className="text-slate-400">SKU: {lastTxn.sku}</div>
                  <div className="flex justify-between text-slate-300">
                    <span>Dispatched Qty:</span>
                    <span className="font-bold text-red-400">
                      -{lastTxn.quantity} {lastTxn.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Reason:</span>
                    <span>{lastTxn.reason}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>From:</span>
                    <span>{lastTxn.fromLocation}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Value:</span>
                    <span className="font-bold text-white">₱{lastTxn.totalValue?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px] pt-1">
                    <span>Clerk:</span>
                    <span>{lastTxn.performedByName}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-400">
              <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <div className="font-bold text-slate-300">No active dispatch slip</div>
              <p className="text-[11px] mt-1">Submit the dispatch form to generate a printable record.</p>
            </div>
          )}

          {/* Quick stock rules */}
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-2.5 text-xs text-slate-300">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Dueñas Store Dispatch Rules
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Always record cash sales and customer take-outs promptly to keep the digital shelf stock in sync
              with physical inventory. If items are found damaged during shelf restocking, file under
              <strong> Damage / Spoilage</strong> so loss reconciliation remains accurate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
