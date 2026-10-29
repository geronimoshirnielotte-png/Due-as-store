import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  FileCheck,
  Search,
  Filter,
} from 'lucide-react';
import { Product, User, AuditSession, AuditRecordItem } from '../types/inventory';
import { saveProduct, addTransaction, saveAudit, getAudits } from '../services/storage';

interface AuditViewProps {
  products: Product[];
  currentUser: User;
  onRefresh: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ products, currentUser, onRefresh }) => {
  // Initialize count sheet with current system values
  const [counts, setCounts] = useState<{
    [productId: string]: { countedWarehouse: number; countedShelf: number; notes: string };
  }>(() => {
    const map: any = {};
    products.forEach((p) => {
      map[p.id] = {
        countedWarehouse: p.warehouseStock,
        countedShelf: p.storeShelfStock,
        notes: '',
      };
    });
    return map;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [completedSession, setCompletedSession] = useState<AuditSession | null>(null);

  const pastAudits = getAudits();

  // Handle count change
  const handleCountChange = (
    productId: string,
    field: 'countedWarehouse' | 'countedShelf' | 'notes',
    value: any
  ) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: field === 'notes' ? value : Number(value) || 0,
      },
    }));
  };

  // Filter products for audit
  const auditList = products.filter((p) => {
    if (selectedZone !== 'all' && !p.location.zone.includes(selectedZone)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
    }
    return true;
  });

  // Calculate variances
  const computedItems: AuditRecordItem[] = auditList.map((p) => {
    const entry = counts[p.id] || {
      countedWarehouse: p.warehouseStock,
      countedShelf: p.storeShelfStock,
      notes: '',
    };
    const expectedTotal = p.warehouseStock + p.storeShelfStock;
    const countedTotal = entry.countedWarehouse + entry.countedShelf;
    const variance = countedTotal - expectedTotal;
    const varianceValue = variance * p.costPrice;

    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      location: `${p.location.zone} (${p.location.binCode})`,
      expectedWarehouseQty: p.warehouseStock,
      expectedShelfQty: p.storeShelfStock,
      countedWarehouseQty: entry.countedWarehouse,
      countedShelfQty: entry.countedShelf,
      variance,
      unitCost: p.costPrice,
      varianceValue,
      notes: entry.notes,
    };
  });

  const totalVarianceQty = computedItems.reduce((acc, i) => acc + i.variance, 0);
  const totalVarianceCost = computedItems.reduce((acc, i) => acc + i.varianceValue, 0);
  const discrepanciesCount = computedItems.filter((i) => i.variance !== 0).length;

  // Apply Reconciliation & Save Audit
  const handleCommitReconciliation = () => {
    if (
      !confirm(
        `Are you sure you want to apply physical stock reconciliation?\nThis will adjust inventory records for ${discrepanciesCount} items with variance.`
      )
    ) {
      return;
    }

    const auditSessionId = `audit-${Date.now()}`;
    const auditRecord: AuditSession = {
      id: auditSessionId,
      date: new Date().toISOString(),
      auditorId: currentUser.id,
      auditorName: currentUser.name,
      status: 'completed',
      items: computedItems,
      totalVarianceCount: totalVarianceQty,
      totalVarianceValue: totalVarianceCost,
      notes: `Reconciliation performed by ${currentUser.name}. ${discrepanciesCount} items adjusted.`,
    };

    // Update products with new counted amounts and post audit adjustment transaction
    computedItems.forEach((item) => {
      const originalProduct = products.find((p) => p.id === item.productId);
      if (originalProduct && item.variance !== 0) {
        saveProduct({
          ...originalProduct,
          warehouseStock: item.countedWarehouseQty,
          storeShelfStock: item.countedShelfQty,
          updatedAt: new Date().toISOString(),
        });

        addTransaction({
          type: 'audit_adjustment',
          productId: originalProduct.id,
          productName: originalProduct.name,
          sku: originalProduct.sku,
          category: originalProduct.category,
          quantity: Math.abs(item.variance),
          unit: originalProduct.unit,
          unitCost: originalProduct.costPrice,
          totalValue: Math.abs(item.varianceValue),
          fromLocation: item.variance < 0 ? 'Inventory Balance' : 'Physical Count Surplus',
          toLocation: item.variance < 0 ? 'Shrinkage / Adjustment' : 'Inventory Balance',
          referenceNumber: `AUDIT-${auditSessionId.slice(-6)}`,
          reason: item.variance < 0 ? 'Physical count deficit / shrinkage' : 'Physical count excess found',
          notes: item.notes || `Reconciled: ${item.variance > 0 ? '+' : ''}${item.variance} ${originalProduct.unit}`,
          performedByUserId: currentUser.id,
          performedByName: currentUser.name,
        });
      }
    });

    saveAudit(auditRecord);
    setCompletedSession(auditRecord);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" />
            Physical Stock Count & Reconciliation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Digital audit worksheet replacing paper clipboards. Compare physical count against system inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCommitReconciliation}
            disabled={discrepanciesCount === 0}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Physical Adjustments ({discrepanciesCount})</span>
          </button>
        </div>
      </div>

      {/* Completed Summary Banner */}
      {completedSession && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Stock Audit Successfully Applied!</div>
              <p className="text-[11px] text-emerald-200">
                Audited by {completedSession.auditorName}. Discrepancies logged to transaction ledger.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white font-semibold flex items-center gap-1.5 shrink-0"
          >
            <Printer className="w-3.5 h-3.5" /> Print Audit Sheet
          </button>
        </div>
      )}

      {/* Audit Variance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 mb-1">Discrepant Items Found</div>
          <div className={`text-2xl font-black ${discrepanciesCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {discrepanciesCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Items where count differs from records</div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 mb-1">Net Quantity Variance</div>
          <div className={`text-2xl font-black ${totalVarianceQty < 0 ? 'text-red-400' : totalVarianceQty > 0 ? 'text-emerald-400' : 'text-white'}`}>
            {totalVarianceQty > 0 ? `+${totalVarianceQty}` : totalVarianceQty} units
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Physical count vs expected system total</div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 mb-1">Net Financial Variance</div>
          <div className={`text-2xl font-black ${totalVarianceCost < 0 ? 'text-red-400' : totalVarianceCost > 0 ? 'text-emerald-400' : 'text-white'}`}>
            ₱{totalVarianceCost.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Wholesale cost difference</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items to count by SKU or name..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Warehouse Zones</option>
            <option value="Zone A">Zone A (Bulk Grains)</option>
            <option value="Zone B">Zone B (Beverages)</option>
            <option value="Zone C">Zone C (Canned & Dry)</option>
            <option value="Zone D">Zone D (Chilled Dairy)</option>
            <option value="Zone E">Zone E (Non-Food)</option>
          </select>
        </div>
      </div>

      {/* Audit Worksheet Table */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Grocery Item & Bin</th>
                <th className="py-3 px-3">System Expected</th>
                <th className="py-3 px-3">Physical Warehouse Count</th>
                <th className="py-3 px-3">Physical Shelf Count</th>
                <th className="py-3 px-3">Variance</th>
                <th className="py-3 px-3">Variance Value</th>
                <th className="py-3 px-4">Auditor Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {computedItems.map((item) => {
                const hasVariance = item.variance !== 0;
                return (
                  <tr
                    key={item.productId}
                    className={`hover:bg-slate-800/50 transition ${
                      hasVariance ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{item.productName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        SKU: {item.sku} • Bin: {item.location}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      <div>
                        Wh: <span className="font-bold text-white">{item.expectedWarehouseQty}</span>
                      </div>
                      <div>
                        Shelf: <span className="font-bold text-white">{item.expectedShelfQty}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        value={item.countedWarehouseQty}
                        onChange={(e) =>
                          handleCountChange(item.productId, 'countedWarehouse', e.target.value)
                        }
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        value={item.countedShelfQty}
                        onChange={(e) =>
                          handleCountChange(item.productId, 'countedShelf', e.target.value)
                        }
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </td>

                    <td className="py-3 px-3 font-bold font-mono">
                      {item.variance === 0 ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                        </span>
                      ) : (
                        <span className={item.variance > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {item.variance > 0 ? `+${item.variance}` : item.variance}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-bold">
                      <span className={item.varianceValue < 0 ? 'text-red-400' : item.varianceValue > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                        ₱{item.varianceValue.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Count remark..."
                        value={item.notes || ''}
                        onChange={(e) => handleCountChange(item.productId, 'notes', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
