import React, { useState } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertTriangle,
  ArrowDownLeft,
  DollarSign,
} from 'lucide-react';
import { Supplier, PurchaseOrder, Product, User, PurchaseOrderItem } from '../types/inventory';
import { savePurchaseOrder, recordStockIn } from '../services/storage';

interface PurchaseOrdersViewProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  currentUser: User;
  onRefresh: () => void;
  onReceivePO: (po: PurchaseOrder) => void;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  suppliers,
  purchaseOrders,
  products,
  currentUser,
  onRefresh,
  onReceivePO,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<
    { productId: string; quantity: number; unitCost: number }[]
  >([]);

  // Find items running low to propose
  const lowStockProducts = products.filter(
    (p) => p.warehouseStock + p.storeShelfStock <= p.minReorderLevel
  );

  const handleAutoFillLowStock = () => {
    const suggested = lowStockProducts.map((p) => ({
      productId: p.id,
      quantity: Math.max(10, p.maxStockLevel - (p.warehouseStock + p.storeShelfStock)),
      unitCost: p.costPrice,
    }));
    setPoItems(suggested);
  };

  const handleAddItemToPO = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    if (poItems.some((i) => i.productId === prodId)) return;

    setPoItems((prev) => [
      ...prev,
      {
        productId: prodId,
        quantity: 20,
        unitCost: prod.costPrice,
      },
    ]);
  };

  const handleUpdateItem = (
    productId: string,
    field: 'quantity' | 'unitCost',
    val: number
  ) => {
    setPoItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, [field]: val } : i))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setPoItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleCreatePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Please add at least one product to this Purchase Order.');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
    const itemsFormatted: PurchaseOrderItem[] = poItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId)!;
      return {
        productId: item.productId,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
        receivedQty: 0,
      };
    });

    const totalAmount = itemsFormatted.reduce((acc, i) => acc + i.totalCost, 0);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: new Date(Date.now() + 86400000 * (supplier.leadTimeDays || 2))
        .toISOString()
        .split('T')[0],
      status: 'pending',
      items: itemsFormatted,
      totalAmount,
      notes: poNotes || 'Automated reorder replenishment',
      createdAt: new Date().toISOString(),
    };

    savePurchaseOrder(newPO);
    setIsCreatingPO(false);
    setPoItems([]);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            Supplier & Purchase Order Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Procure grocery inventory, track vendor lead times, and receive restock deliveries
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'orders' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'suppliers' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300'
              }`}
            >
              Vendors / Suppliers ({suppliers.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsCreatingPO(true);
              if (lowStockProducts.length > 0) handleAutoFillLowStock();
            }}
            className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Orders List View */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseOrders.map((po) => {
              const isCompleted = po.status === 'completed';
              return (
                <div
                  key={po.id}
                  className="bg-slate-850 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">{po.poNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isCompleted ? 'RECEIVED & STOCKED' : 'PENDING DELIVERY'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white">{po.supplierName}</h4>
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                      <span>Order Date: {po.orderDate}</span>
                      <span>ETA: {po.expectedDate}</span>
                    </div>

                    {/* Items Mini List */}
                    <div className="my-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Ordered Items ({po.items.length})
                      </div>
                      {po.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span className="truncate max-w-[180px]">{item.productName}</span>
                          <span className="font-bold text-white shrink-0">
                            {item.quantity} {item.unit} (₱{item.totalCost.toFixed(2)})
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-emerald-400">
                        <span>Total Order:</span>
                        <span>₱{po.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 italic truncate">{po.notes}</span>
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => onReceivePO(po)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 transition flex items-center gap-1.5 shrink-0"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Receive Delivery</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suppliers Directory View */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-slate-850 border border-slate-800 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{s.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Contact: {s.contactPerson}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  ★ {s.rating}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{s.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{s.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate">{s.address}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Lead Time: <strong className="text-white">{s.leadTimeDays} days</strong></span>
                <span>Terms: <strong className="text-white">{s.paymentTerms}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      {isCreatingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                New Dueñas Store Purchase Order
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingPO(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePOSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Supplier / Distributor
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.leadTimeDays}d lead time)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Order Memo / Instructions
                  </label>
                  <input
                    type="text"
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    placeholder="e.g. Standard weekly restock, deliver Friday morning"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Quick actions for PO */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs font-bold text-white">Order Items Breakdown</div>
                {lowStockProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAutoFillLowStock}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Auto-Add All Low Stock Items ({lowStockProducts.length})
                  </button>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-slate-850">
                {poItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No items added yet. Pick from the catalog below.
                  </div>
                ) : (
                  poItems.map((item) => {
                    const prod = products.find((p) => p.id === item.productId);
                    if (!prod) return null;
                    return (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between gap-3 p-2 bg-slate-900 rounded-lg text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white truncate">{prod.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Qty ({prod.unit})</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(item.productId, 'quantity', Number(e.target.value))
                              }
                              className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-white font-bold"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block">Cost (₱)</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) =>
                                handleUpdateItem(item.productId, 'unitCost', Number(e.target.value))
                              }
                              className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-emerald-400 font-bold"
                            />
                          </div>

                          <div className="text-right w-20">
                            <span className="text-[10px] text-slate-400 block">Subtotal</span>
                            <span className="font-bold text-white">
                              ₱{(item.quantity * item.unitCost).toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="p-1 text-slate-500 hover:text-red-400"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add item picker */}
              <div className="flex items-center gap-2">
                <select
                  id="add-item-select"
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddItemToPO(e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="" disabled>
                    + Add additional product to this order...
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.warehouseStock + p.storeShelfStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Total Purchase Order Value:</span>
                <span className="font-black text-emerald-400 text-base">
                  ₱{poItems.reduce((acc, i) => acc + i.quantity * i.unitCost, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPO(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md"
                >
                  Generate Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
