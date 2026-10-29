import React, { useState } from 'react';
import {
  Warehouse,
  Layers,
  MapPin,
  RefreshCw,
  Box,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  PackageCheck,
} from 'lucide-react';
import { WarehouseZone, Product, User } from '../types/inventory';
import { transferStockToShelf } from '../services/storage';

interface WarehouseViewProps {
  zones: WarehouseZone[];
  products: Product[];
  currentUser: User;
  onRefresh: () => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({
  zones,
  products,
  currentUser,
  onRefresh,
}) => {
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>('C');
  const [transferQtyModal, setTransferQtyModal] = useState<{ product: Product; maxQty: number } | null>(null);
  const [transferQty, setTransferQty] = useState<number>(5);
  const [successNote, setSuccessNote] = useState('');

  const activeZone = zones.find((z) => z.code === selectedZoneCode) || zones[0];
  const zoneProducts = products.filter((p) => p.location.zone.includes(`Zone ${selectedZoneCode}`));

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferQtyModal) return;

    try {
      transferStockToShelf({
        productId: transferQtyModal.product.id,
        quantity: transferQty,
        currentUser,
        notes: `Replenished storefront from Warehouse Bin ${transferQtyModal.product.location.binCode}`,
      });
      setSuccessNote(
        `Successfully transferred ${transferQty} ${transferQtyModal.product.unit} of "${transferQtyModal.product.name}" to the storefront shelf.`
      );
      setTransferQtyModal(null);
      onRefresh();
      setTimeout(() => setSuccessNote(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Transfer failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-emerald-400" />
            Warehouse Backroom & Storage Layout
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical layout of Dueñas Store storage facility, bin slotting, capacity meters, and shelf replenishment
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
            5 Distinct Storage Zones
          </span>
        </div>
      </div>

      {successNote && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
          <PackageCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successNote}</span>
        </div>
      )}

      {/* Zone Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {zones.map((zone) => {
          const isSelected = zone.code === selectedZoneCode;
          const occupancyPct = Math.round((zone.occupiedBins / zone.capacityBins) * 100);
          const zoneItemCount = products.filter((p) => p.location.zone.includes(`Zone ${zone.code}`)).length;

          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => setSelectedZoneCode(zone.code)}
              className={`text-left p-4 rounded-2xl border transition relative overflow-hidden group ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500/70 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-850 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-lg font-mono ${
                    isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  ZONE {zone.code}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{occupancyPct}% full</span>
              </div>

              <div className="font-bold text-xs text-white leading-tight mb-1 truncate">{zone.name}</div>
              <div className="text-[10px] text-slate-400">{zone.type}</div>

              {/* Mini progress bar */}
              <div className="w-full h-1.5 bg-slate-900 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    occupancyPct > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>

              <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                <span>{zoneItemCount} SKUs</span>
                <span>{zone.occupiedBins}/{zone.capacityBins} bins</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Zone Detail & Slotting Map */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE ZONE {activeZone.code}
              </span>
              <h3 className="text-base font-extrabold text-white">{activeZone.name}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">{activeZone.description}</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <span>{activeZone.type}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Box className="w-4 h-4 text-emerald-400" />
              <span>Capacity: {activeZone.capacityBins} standard bin slots</span>
            </div>
          </div>
        </div>

        {/* Assigned Products in this Zone */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Bins & Assigned Items in Zone {activeZone.code} ({zoneProducts.length})
            </h4>
            <span className="text-[11px] text-slate-400">
              Click &quot;Refill Store Shelf&quot; to transfer items from warehouse to retail floor
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zoneProducts.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 bg-slate-900 rounded-xl">
                <Box className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p>No products currently assigned to this storage zone.</p>
              </div>
            ) : (
              zoneProducts.map((p) => {
                const total = p.warehouseStock + p.storeShelfStock;
                const needReplenish = p.storeShelfStock <= 5 && p.warehouseStock > 0;

                return (
                  <div
                    key={p.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                          BIN {p.location.binCode}
                        </span>
                        <span className="text-[10px] text-slate-400">{p.location.shelf}</span>
                      </div>

                      <h5 className="font-bold text-xs text-white line-clamp-1">{p.name}</h5>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {p.sku}</div>

                      <div className="my-3 p-2.5 rounded-lg bg-slate-850 text-xs space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Warehouse Backroom:</span>
                          <span className="font-bold text-white">
                            {p.warehouseStock} {p.unit}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Store Shelf Front:</span>
                          <span
                            className={`font-bold ${
                              p.storeShelfStock <= 5 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {p.storeShelfStock} {p.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {needReplenish && (
                        <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                          Shelf Running Low!
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={p.warehouseStock <= 0}
                        onClick={() => {
                          setTransferQtyModal({ product: p, maxQty: p.warehouseStock });
                          setTransferQty(Math.min(10, p.warehouseStock));
                        }}
                        className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Transfer to Shelf</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Transfer Stock Modal */}
      {transferQtyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              Transfer to Storefront Shelf
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Move inventory from backroom bin {transferQtyModal.product.location.binCode} to customer retail display
            </p>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-xs">
                <div className="font-bold text-white">{transferQtyModal.product.name}</div>
                <div className="text-slate-400 mt-1">
                  Available in Warehouse: <strong className="text-white">{transferQtyModal.product.warehouseStock} {transferQtyModal.product.unit}</strong>
                </div>
                <div className="text-slate-400">
                  Current on Shelf: <strong className="text-emerald-400">{transferQtyModal.product.storeShelfStock} {transferQtyModal.product.unit}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity to Transfer ({transferQtyModal.product.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={transferQtyModal.maxQty}
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferQtyModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
