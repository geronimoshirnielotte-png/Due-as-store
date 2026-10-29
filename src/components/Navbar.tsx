import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Crown,
} from 'lucide-react';
import { User, Product } from '../types/inventory';
import { logoutUser, getProductStatus, quickLoginAsRole } from '../services/storage';

interface NavbarProps {
  currentUser: User;
  products: Product[];
  onNavigate: (tab: string) => void;
  onSearchSelect?: (productId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, products, onNavigate, onSearchSelect }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live alerts
  const lowStockProducts = products.filter((p) => {
    const total = p.warehouseStock + p.storeShelfStock;
    return total <= p.minReorderLevel;
  });

  const expiringProducts = products
    .map((p) => {
      const { earliestExpiry, daysUntilExpiry } = getProductStatus(p);
      return { product: p, earliestExpiry, daysUntilExpiry };
    })
    .filter((item) => item.daysUntilExpiry !== null && item.daysUntilExpiry <= 30);

  const totalAlerts = lowStockProducts.length + expiringProducts.length;

  // Search filtered products
  const searchResults = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode.includes(searchQuery) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Owner / Admin</span>;
      case 'manager':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Warehouse Mgr</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Inventory Clerk</span>;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">DUEÑAS STORES</span>
              <span className="hidden md:inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                Main Grocery & Warehouse
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Integrated Warehouse & Inventory Management</p>
          </div>
        </div>

        {/* Global Live Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search product name, barcode (e.g. 480001...), SKU, or brand..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-700/60">
                Matching Products ({searchResults.length})
              </div>
              <div className="divide-y divide-slate-700/50 max-h-72 overflow-y-auto">
                {searchResults.map((prod) => {
                  const total = prod.warehouseStock + prod.storeShelfStock;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        if (onSearchSelect) onSearchSelect(prod.id);
                        onNavigate('inventory');
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-3 hover:bg-slate-700/60 transition flex items-center justify-between gap-3 group"
                    >
                      <div>
                        <div className="font-semibold text-xs text-white group-hover:text-emerald-300">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>SKU: {prod.sku}</span>
                          <span>•</span>
                          <span>Loc: {prod.location.binCode}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">₱{prod.sellingPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-slate-200">
                          {total} {prod.unit}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Wh: {prod.warehouseStock} | Shelf: {prod.storeShelfStock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Alert Bell, Quick Role Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications / Alerts Bell */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Inventory Alerts"
            >
              <Bell className="w-4 h-4" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {totalAlerts}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-850 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 bg-slate-800">
                <div className="p-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-850">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white">Critical Stock & Expiry Alerts</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    {totalAlerts} active
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/60">
                  {totalAlerts === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      <span>All inventory levels and expiration dates are healthy!</span>
                    </div>
                  ) : (
                    <>
                      {/* Low Stock Alerts */}
                      {lowStockProducts.map((p) => {
                        const total = p.warehouseStock + p.storeShelfStock;
                        return (
                          <div
                            key={p.id}
                            className="p-3 hover:bg-slate-750 transition flex items-start gap-3 cursor-pointer"
                            onClick={() => {
                              onNavigate('inventory');
                              setShowNotifications(false);
                            }}
                          >
                            <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                                <span className="text-[10px] text-red-400 font-bold shrink-0">
                                  {total === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Current: <span className="text-white font-medium">{total} {p.unit}</span> (Min Threshold: {p.minReorderLevel})
                              </p>
                              <p className="text-[10px] text-amber-400 mt-0.5">
                                Supplier: {p.supplierName}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Expiring Soon Alerts */}
                      {expiringProducts.map(({ product, earliestExpiry, daysUntilExpiry }) => (
                        <div
                          key={`exp-${product.id}`}
                          className="p-3 hover:bg-slate-750 transition flex items-start gap-3 cursor-pointer"
                          onClick={() => {
                            onNavigate('expiration');
                            setShowNotifications(false);
                          }}
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-white truncate">{product.name}</p>
                              <span className="text-[10px] text-amber-400 font-bold shrink-0">
                                {daysUntilExpiry && daysUntilExpiry <= 0
                                  ? 'EXPIRED'
                                  : `${daysUntilExpiry}d remaining`}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Earliest Batch Expiry: <span className="text-white">{earliestExpiry}</span>
                            </p>
                            <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                              FEFO Action: Prioritize display or markdown clearance
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="p-2 border-t border-slate-700 bg-slate-900 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('expiration');
                      setShowNotifications(false);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
                  >
                    Open Expiration & FEFO Control Center <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition shadow-sm"
              title="Admin Console & Security Settings"
            >
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Console</span>
            </button>
          )}

          {/* User Profile Menu */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 transition"
            >
              <img
                src={
                  currentUser.avatarUrl ||
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
                }
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/50"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  {getRoleBadge(currentUser.role)}
                </div>
              </div>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-slate-700 bg-slate-850">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {getRoleBadge(currentUser.role)}
                    <span className="text-[10px] text-slate-400">{currentUser.title}</span>
                  </div>
                </div>

                {/* Switch Role Fast for Demonstration */}
                <div className="p-3 border-b border-slate-700/60">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                    Quick Role Switcher (Evaluation)
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        quickLoginAsRole('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                    >
                      <span>Store Owner (Admin)</span>
                      <span className="text-[10px] text-purple-300">Full Access</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        quickLoginAsRole('manager');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                    >
                      <span>Warehouse Supervisor</span>
                      <span className="text-[10px] text-blue-300">WMS & Audits</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        quickLoginAsRole('staff');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                    >
                      <span>Store Clerk / Cashier</span>
                      <span className="text-[10px] text-emerald-300">POS & Shelf</span>
                    </button>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      logoutUser();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/10 hover:text-red-200 transition flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Dueñas Stores</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
