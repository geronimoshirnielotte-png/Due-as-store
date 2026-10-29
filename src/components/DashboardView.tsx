import React from 'react';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Warehouse,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { Product, StockTransaction, WarehouseZone, User } from '../types/inventory';
import { getProductStatus } from '../services/storage';

interface DashboardViewProps {
  products: Product[];
  transactions: StockTransaction[];
  zones: WarehouseZone[];
  currentUser: User;
  onNavigate: (tab: string) => void;
  onOpenStockIn: () => void;
  onOpenStockOut: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  transactions,
  zones,
  currentUser,
  onNavigate,
  onOpenStockIn,
  onOpenStockOut,
}) => {
  // Compute Key Metrics
  const totalSKUs = products.length;
  const totalUnits = products.reduce((acc, p) => acc + p.warehouseStock + p.storeShelfStock, 0);

  const totalCostValuation = products.reduce(
    (acc, p) => acc + (p.warehouseStock + p.storeShelfStock) * p.costPrice,
    0
  );

  const totalRetailValuation = products.reduce(
    (acc, p) => acc + (p.warehouseStock + p.storeShelfStock) * p.sellingPrice,
    0
  );

  const estimatedGrossMargin =
    totalRetailValuation > 0
      ? (((totalRetailValuation - totalCostValuation) / totalRetailValuation) * 100).toFixed(1)
      : '0.0';

  const lowStockItems = products.filter((p) => {
    const total = p.warehouseStock + p.storeShelfStock;
    return total <= p.minReorderLevel;
  });

  const expiringItems = products
    .map((p) => {
      const { earliestExpiry, daysUntilExpiry } = getProductStatus(p);
      return { product: p, earliestExpiry, daysUntilExpiry };
    })
    .filter((item) => item.daysUntilExpiry !== null && item.daysUntilExpiry <= 30)
    .sort((a, b) => (a.daysUntilExpiry || 0) - (b.daysUntilExpiry || 0));

  // Today's Transactions
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.timestamp.startsWith(todayStr));
  const todayInCount = todayTransactions.filter((t) => t.type === 'stock_in').length;
  const todayOutCount = todayTransactions.filter((t) =>
    ['stock_out', 'damage_writeoff', 'expired_disposal'].includes(t.type)
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Dueñas Store Main Branch & Storage Facility
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {currentUser.name}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              System active. All warehouse shelves and storefront inventory synchronized in real-time. Review
              incoming stock shipments, outgoing sales dispatches, and perishable expiration thresholds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenStockIn}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Stock In (Receiving)</span>
            </button>

            <button
              type="button"
              onClick={onOpenStockOut}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex items-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Stock Out (Dispatch)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('warehouse')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-2"
            >
              <Warehouse className="w-4 h-4" />
              <span>Warehouse Layout</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Units & SKUs */}
        <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total In-Stock Items</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalUnits.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Across {totalSKUs} Active SKUs</span>
            <span className="text-emerald-400 font-medium">100% catalogued</span>
          </div>
        </div>

        {/* Card 2: Inventory Valuation */}
        <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Inventory Valuation (Cost)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ₱{totalCostValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Retail: ₱{totalRetailValuation.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            <span className="text-emerald-300 font-bold">+{estimatedGrossMargin}% margin</span>
          </div>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-slate-850/80 border border-slate-800 rounded-2xl p-5 hover:border-red-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Low Stock / Reorder</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-400">{lowStockItems.length}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Items below safety threshold</span>
            <span className="text-red-400 font-semibold group-hover:underline">Review &rarr;</span>
          </div>
        </div>

        {/* Card 4: Expiring in 30 Days */}
        <div
          onClick={() => onNavigate('expiration')}
          className="bg-slate-850/80 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>FEFO Watch (&le; 30 Days)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">{expiringItems.length}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Perishables needing FEFO action</span>
            <span className="text-amber-400 font-semibold group-hover:underline">Inspect &rarr;</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Operational Highlights & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Stock Transactions Log */}
        <div className="lg:col-span-2 bg-slate-850 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                Latest Stock Movements & Audit Trail
              </h3>
              <p className="text-[11px] text-slate-400">
                Digital record of deliveries, dispatches, transfers, and shelf refills
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              Full Movement Log &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto">
            {transactions.slice(0, 6).map((txn) => {
              const isIn = txn.type === 'stock_in';
              const isTransfer = txn.type.startsWith('transfer');
              const isDamage = txn.type === 'damage_writeoff' || txn.type === 'expired_disposal';

              return (
                <div key={txn.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isIn
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : isTransfer
                          ? 'bg-blue-500/15 text-blue-400'
                          : isDamage
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-purple-500/15 text-purple-400'
                      }`}
                    >
                      {isIn ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isTransfer ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{txn.productName}</div>
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-300">{txn.referenceNumber}</span>
                        <span>•</span>
                        <span>
                          {txn.fromLocation} &rarr; {txn.toLocation}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">{new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-bold ${
                        isIn
                          ? 'text-emerald-400'
                          : isTransfer
                          ? 'text-blue-400'
                          : isDamage
                          ? 'text-red-400'
                          : 'text-white'
                      }`}
                    >
                      {isIn ? '+' : isTransfer ? '⇄' : '-'}{txn.quantity} {txn.unit}
                    </div>
                    <div className="text-[10px] text-slate-400">By: {txn.performedByName}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Action Required & Warehouse Zone Utilization */}
        <div className="space-y-6">
          {/* Low Stock Watchlist */}
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Items to Reorder ({lowStockItems.length})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('purchase_orders')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Create PO
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {lowStockItems.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">All stock levels adequate!</p>
              ) : (
                lowStockItems.slice(0, 4).map((p) => {
                  const total = p.warehouseStock + p.storeShelfStock;
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Supplier: {p.supplierName} • Bin: {p.location.binCode}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            total === 0
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {total} {p.unit} left
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Min: {p.minReorderLevel}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Warehouse Zones Status */}
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <Warehouse className="w-4 h-4 text-emerald-400" />
                Warehouse Backroom Zones
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('warehouse')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Slotting Map
              </button>
            </div>

            <div className="space-y-2.5">
              {zones.slice(0, 4).map((z) => {
                const percent = Math.round((z.occupiedBins / z.capacityBins) * 100);
                return (
                  <div key={z.id} className="text-xs">
                    <div className="flex items-center justify-between text-slate-300 mb-1">
                      <span className="font-semibold text-white">{z.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {z.occupiedBins}/{z.capacityBins} bins ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percent > 85 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
