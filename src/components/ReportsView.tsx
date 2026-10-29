import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Package,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import { Product, StockTransaction, User, ProductCategory } from '../types/inventory';

interface ReportsViewProps {
  products: Product[];
  transactions: StockTransaction[];
  currentUser: User;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ products, transactions, currentUser }) => {
  const [selectedTxnType, setSelectedTxnType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReportTab, setActiveReportTab] = useState<'movements' | 'valuation' | 'daily_sheet'>('movements');

  // Categorical valuation
  const categoryValuations: { [key in ProductCategory]?: { cost: number; retail: number; count: number } } = {};
  products.forEach((p) => {
    const total = p.warehouseStock + p.storeShelfStock;
    if (!categoryValuations[p.category]) {
      categoryValuations[p.category] = { cost: 0, retail: 0, count: 0 };
    }
    categoryValuations[p.category]!.cost += total * p.costPrice;
    categoryValuations[p.category]!.retail += total * p.sellingPrice;
    categoryValuations[p.category]!.count += total;
  });

  const totalCostVal = products.reduce((acc, p) => acc + (p.warehouseStock + p.storeShelfStock) * p.costPrice, 0);
  const totalRetailVal = products.reduce((acc, p) => acc + (p.warehouseStock + p.storeShelfStock) * p.sellingPrice, 0);

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    if (selectedTxnType !== 'all' && t.type !== selectedTxnType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.productName.toLowerCase().includes(q) ||
        t.sku.toLowerCase().includes(q) ||
        t.referenceNumber.toLowerCase().includes(q) ||
        t.performedByName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportTransactionsCSV = () => {
    const headers = [
      'Timestamp',
      'Reference #',
      'Type',
      'Product Name',
      'SKU',
      'Category',
      'Quantity',
      'Unit',
      'Total Value (PHP)',
      'From Location',
      'To Location',
      'Batch Number',
      'Expiry Date',
      'Performed By',
      'Notes',
    ];

    const rows = filteredTransactions.map((t) => [
      `"${new Date(t.timestamp).toLocaleString()}"`,
      `"${t.referenceNumber}"`,
      `"${t.type}"`,
      `"${t.productName.replace(/"/g, '""')}"`,
      `"${t.sku}"`,
      `"${t.category}"`,
      t.quantity,
      `"${t.unit}"`,
      t.totalValue?.toFixed(2) || '0.00',
      `"${t.fromLocation}"`,
      `"${t.toLocation}"`,
      `"${t.batchNumber || ''}"`,
      `"${t.expiryDate || ''}"`,
      `"${t.performedByName}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Duenas_Stores_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Centralized Reports & Audit Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant digital summaries eliminating handwritten paper records and data fragmentation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveReportTab('movements')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeReportTab === 'movements' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              Movement Ledger
            </button>
            <button
              type="button"
              onClick={() => setActiveReportTab('valuation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeReportTab === 'valuation' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              Category Valuation
            </button>
            <button
              type="button"
              onClick={() => setActiveReportTab('daily_sheet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeReportTab === 'daily_sheet' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              Printable Summary Sheet
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportTransactionsCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Movement Ledger View */}
      {activeReportTab === 'movements' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transaction reference, product, staff name..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="w-full sm:w-56">
              <select
                value={selectedTxnType}
                onChange={(e) => setSelectedTxnType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Movement Types</option>
                <option value="stock_in">Stock In (Receiving)</option>
                <option value="stock_out">Stock Out (Customer Sales)</option>
                <option value="transfer_to_shelf">Transfer to Shelf</option>
                <option value="damage_writeoff">Damage / Spoilage</option>
                <option value="expired_disposal">Expired Disposal</option>
                <option value="audit_adjustment">Physical Count Audit</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-850 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Date & Ref #</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Grocery Item</th>
                    <th className="py-3 px-3">Quantity</th>
                    <th className="py-3 px-3">From / To Route</th>
                    <th className="py-3 px-3">Transaction Value</th>
                    <th className="py-3 px-4">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredTransactions.map((t) => {
                    const isIn = t.type === 'stock_in';
                    const isTransfer = t.type.startsWith('transfer');
                    const isDamage = t.type.includes('damage') || t.type.includes('expired');

                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-white">{t.referenceNumber}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isIn
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isTransfer
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : isDamage
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {t.type.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{t.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">SKU: {t.sku}</div>
                        </td>

                        <td className="py-3 px-3 font-bold font-mono">
                          <span
                            className={
                              isIn
                                ? 'text-emerald-400'
                                : isTransfer
                                ? 'text-blue-400'
                                : 'text-slate-200'
                            }
                          >
                            {isIn ? '+' : isTransfer ? '⇄' : '-'}{t.quantity} {t.unit}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          <div>{t.fromLocation}</div>
                          <div className="text-white">&rarr; {t.toLocation}</div>
                        </td>

                        <td className="py-3 px-3 font-bold text-white">
                          ₱{t.totalValue?.toFixed(2) || '0.00'}
                        </td>

                        <td className="py-3 px-4 text-slate-300 text-[11px]">
                          <div>{t.performedByName}</div>
                          {t.notes && <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{t.notes}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Category Valuation Breakdown */}
      {activeReportTab === 'valuation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryValuations).map(([category, data]) => {
              if (!data) return null;
              const margin = data.retail > 0 ? (((data.retail - data.cost) / data.retail) * 100).toFixed(1) : '0';
              return (
                <div
                  key={category}
                  className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white">{category}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      +{margin}% margin
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Units in Stock:</span>
                      <span className="font-bold text-white">{data.count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Wholesale Cost Value:</span>
                      <span className="font-bold text-emerald-400">₱{data.cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Retail Sales Potential:</span>
                      <span className="font-bold text-white">₱{data.retail.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Printable Daily Store Inventory Summary Sheet */}
      {activeReportTab === 'daily_sheet' && (
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">Dueñas Store - Daily Inventory Status Summary</h3>
              <p className="text-xs text-slate-400">
                Official management audit sheet for daily opening/closing verification
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Sheet</span>
            </button>
          </div>

          <div className="p-6 bg-white text-slate-900 rounded-xl font-sans text-xs space-y-4 print:p-0">
            <div className="text-center border-b pb-3">
              <h1 className="text-lg font-black tracking-tight uppercase">DUEÑAS STORES</h1>
              <p className="text-[11px] text-slate-600">Integrated Warehouse and Inventory Management System</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} | Auditor: {currentUser.name} ({currentUser.title})
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 border p-3 rounded bg-slate-50 text-[11px]">
              <div>
                <span className="text-slate-500 block">Total Active SKUs:</span>
                <strong className="text-sm">{products.length} Items</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Total Inventory Valuation:</span>
                <strong className="text-sm">₱{totalCostVal.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Low Stock / Attention:</span>
                <strong className="text-sm text-red-600">
                  {products.filter((p) => p.warehouseStock + p.storeShelfStock <= p.minReorderLevel).length} Items
                </strong>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="py-1">SKU</th>
                  <th className="py-1">Item Description</th>
                  <th className="py-1">Location</th>
                  <th className="py-1 text-center">Warehouse</th>
                  <th className="py-1 text-center">Shelf</th>
                  <th className="py-1 text-center">Total</th>
                  <th className="py-1 text-right">Cost (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-1 font-mono">{p.sku}</td>
                    <td className="py-1 font-semibold">{p.name}</td>
                    <td className="py-1">{p.location.binCode}</td>
                    <td className="py-1 text-center">{p.warehouseStock}</td>
                    <td className="py-1 text-center">{p.storeShelfStock}</td>
                    <td className="py-1 text-center font-bold">{p.warehouseStock + p.storeShelfStock}</td>
                    <td className="py-1 text-right">₱{p.costPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-8 grid grid-cols-2 gap-8 text-[11px] border-t">
              <div>
                <div className="border-b border-slate-400 w-48 h-8 mb-1" />
                <p className="font-bold">Prepared By: {currentUser.name}</p>
                <p className="text-slate-500">{currentUser.title}</p>
              </div>
              <div className="text-right">
                <div className="border-b border-slate-400 w-48 h-8 mb-1 ml-auto" />
                <p className="font-bold">Store Owner Approval: Don Carlos Dueñas</p>
                <p className="text-slate-500">General Manager, Dueñas Stores</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
