import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Percent,
  RefreshCw,
  Trash2,
  Calendar,
  Filter,
  Package,
} from 'lucide-react';
import { Product, ProductBatch, User } from '../types/inventory';
import { recordStockOut, transferStockToShelf } from '../services/storage';

interface ExpirationViewProps {
  products: Product[];
  currentUser: User;
  onRefresh: () => void;
}

interface FlattenedBatch {
  product: Product;
  batch: ProductBatch;
  daysRemaining: number;
  status: 'expired' | 'urgent_15' | 'warning_30' | 'notice_60' | 'healthy';
}

export const ExpirationView: React.FC<ExpirationViewProps> = ({ products, currentUser, onRefresh }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Collect all batches across all products
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allBatches: FlattenedBatch[] = [];

  products.forEach((prod) => {
    if (prod.batches && prod.batches.length > 0) {
      prod.batches.forEach((b) => {
        if (b.quantity > 0 && b.expiryDate) {
          const expDate = new Date(b.expiryDate);
          const diffMs = expDate.getTime() - today.getTime();
          const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          let status: FlattenedBatch['status'] = 'healthy';
          if (days <= 0) status = 'expired';
          else if (days <= 15) status = 'urgent_15';
          else if (days <= 30) status = 'warning_30';
          else if (days <= 60) status = 'notice_60';

          allBatches.push({
            product: prod,
            batch: b,
            daysRemaining: days,
            status,
          });
        }
      });
    }
  });

  // Sort: most critical / earliest expiry first
  allBatches.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const filteredBatches = allBatches.filter((item) => {
    if (filterStatus === 'expired' && item.status !== 'expired') return false;
    if (filterStatus === 'urgent' && item.status !== 'urgent_15') return false;
    if (filterStatus === 'warning' && !['urgent_15', 'warning_30'].includes(item.status)) return false;
    if (filterStatus === 'healthy' && item.status !== 'healthy') return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.product.name.toLowerCase().includes(term) ||
        item.batch.batchNumber.toLowerCase().includes(term) ||
        item.product.sku.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Totals for metrics
  const expiredCount = allBatches.filter((b) => b.status === 'expired').length;
  const urgentCount = allBatches.filter((b) => b.status === 'urgent_15').length;
  const warningCount = allBatches.filter((b) => b.status === 'warning_30').length;
  const atRiskValuation = allBatches
    .filter((b) => b.daysRemaining <= 30)
    .reduce((sum, b) => sum + b.batch.quantity * b.product.costPrice, 0);

  // Quick action: Write off expired batch
  const handleDisposeBatch = (item: FlattenedBatch) => {
    if (
      confirm(
        `Confirm disposal of ${item.batch.quantity} ${item.product.unit} of "${item.product.name}" (Batch ${item.batch.batchNumber})?`
      )
    ) {
      try {
        recordStockOut({
          productId: item.product.id,
          quantity: item.batch.quantity,
          sourceLocation: item.batch.location,
          type: 'expired_disposal',
          reason: `Condemned due to expiration (${item.batch.expiryDate})`,
          referenceNumber: `EXP-DISP-${Date.now().toString().slice(-5)}`,
          notes: `Batch ${item.batch.batchNumber} safely condemned and removed from storage`,
          currentUser,
        });
        setActionSuccessMsg(`Successfully written off batch ${item.batch.batchNumber} for disposal.`);
        onRefresh();
        setTimeout(() => setActionSuccessMsg(''), 4000);
      } catch (err: any) {
        alert(err.message || 'Error disposing batch');
      }
    }
  };

  // Quick action: Push to front shelf
  const handlePushToShelf = (item: FlattenedBatch) => {
    try {
      const qty = Math.min(item.batch.quantity, item.product.warehouseStock);
      if (qty <= 0) {
        alert('Items are already on the store shelf.');
        return;
      }
      transferStockToShelf({
        productId: item.product.id,
        quantity: qty,
        currentUser,
        notes: `FEFO Priority: Moving earliest expiring batch (${item.batch.batchNumber}) to front checkout display`,
      });
      setActionSuccessMsg(`Moved ${qty} ${item.product.unit} to storefront shelf for priority sale.`);
      onRefresh();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error transferring stock');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            FEFO & Expiration Tracking Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            First-Expired, First-Out grocery monitor to eliminate spoilage and prioritize retail stock movement
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Total Active Batches: <strong className="text-white">{allBatches.length}</strong>
          </span>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Expiry Risk KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Expired Goods</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{expiredCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Requires immediate disposal</div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Urgent (&le; 15 Days)</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400">{urgentCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Markdown or priority clearance</div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Watchlist (16–30 Days)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{warningCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Rotate to front retail shelf</div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Stock Value at Risk (&le; 30d)</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">₱{atRiskValuation.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Estimated wholesale cost value</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            All Batches ({allBatches.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('expired')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'expired'
                ? 'bg-red-500 text-white font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Expired ({expiredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'urgent'
                ? 'bg-orange-500 text-white font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Urgent &le;15d ({urgentCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('warning')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === 'warning'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            All &le;30d ({urgentCount + warningCount})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search batch or product..."
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBatches.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-850 border border-slate-800 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
            <p className="font-bold text-white">No batches found for this filter</p>
            <p className="text-xs mt-1">All grocery stocks meet expiration standards.</p>
          </div>
        ) : (
          filteredBatches.map((item) => {
            const isExpired = item.status === 'expired';
            const isUrgent = item.status === 'urgent_15';
            const isWarning = item.status === 'warning_30';

            return (
              <div
                key={`${item.product.id}-${item.batch.id}`}
                className={`bg-slate-850 border rounded-2xl p-4 flex flex-col justify-between transition ${
                  isExpired
                    ? 'border-red-500/60 shadow-red-950/20'
                    : isUrgent
                    ? 'border-orange-500/60'
                    : isWarning
                    ? 'border-amber-500/60'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {item.batch.batchNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isExpired
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : isUrgent
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {isExpired ? 'EXPIRED' : `${item.daysRemaining} days left`}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white">{item.product.name}</h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>SKU: {item.product.sku}</span>
                    <span>•</span>
                    <span>Bin: {item.product.location.binCode}</span>
                  </div>

                  {/* Batch Details Breakdown */}
                  <div className="my-3 p-2.5 rounded-xl bg-slate-900 text-xs space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Expiration Date:</span>
                      <span className="font-bold text-white flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        {item.batch.expiryDate}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Batch Qty:</span>
                      <span className="font-bold text-emerald-400">
                        {item.batch.quantity} {item.product.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Batch Cost Value:</span>
                      <span>₱{(item.batch.quantity * item.product.costPrice).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  {isExpired ? (
                    <button
                      type="button"
                      onClick={() => handleDisposeBatch(item)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Condemn & Discard</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handlePushToShelf(item)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition flex items-center justify-center gap-1"
                        title="Transfer to front grocery shelf immediately for priority checkout sale"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Move to Front Shelf</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          alert(
                            `Dueñas Store Clearance Notice:\nMark "${item.product.name}" (Batch ${item.batch.batchNumber}) with special 25% off markdown tag at front checkout counter.`
                          );
                        }}
                        className="py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1"
                        title="Clearance Discount Tag"
                      >
                        <Percent className="w-3 h-3" />
                        <span>Discount</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
