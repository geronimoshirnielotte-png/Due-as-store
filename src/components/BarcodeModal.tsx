import React from 'react';
import { Barcode, Printer, X, Download } from 'lucide-react';
import { Product } from '../types/inventory';

interface BarcodeModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate SVG barcode stripes representation
  const renderBarcodeBars = (code: string) => {
    const bars: boolean[] = [];
    // Simple deterministic barcode pattern based on string characters
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      bars.push(charCode % 2 === 0);
      bars.push(charCode % 3 === 0);
      bars.push(charCode % 5 === 0);
      bars.push(true);
      bars.push(false);
    }

    return (
      <div className="flex items-center justify-center gap-[2px] h-14 bg-white py-1 px-4">
        {bars.slice(0, 48).map((isDark, idx) => (
          <div
            key={idx}
            className={`h-full ${isDark ? 'bg-black' : 'bg-transparent'} ${
              idx % 5 === 0 ? 'w-[3px]' : 'w-[1.5px]'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Barcode className="w-4 h-4 text-emerald-400" />
            <span>Storefront Shelf Price Tag & Barcode</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Printable Tag */}
        <div className="bg-white text-slate-900 p-5 rounded-xl shadow-inner border border-slate-300 font-sans text-center space-y-2 select-all print:p-0">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200 pb-1">
            DUEÑAS STORES • GROCERY RETAIL
          </div>

          <div className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
            {product.name}
          </div>

          <div className="text-[11px] text-slate-600 font-medium">
            Category: {product.category} • Brand: {product.brand}
          </div>

          {/* Barcode Representation */}
          <div className="my-2 border border-slate-300 rounded p-1 bg-white">
            {renderBarcodeBars(product.barcode)}
            <div className="font-mono text-xs tracking-widest font-bold text-slate-800 mt-1">
              {product.barcode}
            </div>
          </div>

          {/* Price & Location */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <div className="text-left">
              <span className="text-[10px] text-slate-500 block uppercase">Shelf Bin</span>
              <span className="font-mono font-bold text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                {product.location.binCode}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase">Retail Price</span>
              <span className="font-black text-xl text-slate-950">
                ₱{product.sellingPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-[9px] text-slate-400 font-mono pt-1">
            SKU: {product.sku} | Unit: {product.unit.toUpperCase()}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <span className="text-[11px] text-slate-400">Fits standard 2&quot;x3&quot; shelf channel tags</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
