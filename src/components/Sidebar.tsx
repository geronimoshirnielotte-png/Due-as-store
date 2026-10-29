import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Warehouse,
  ClipboardCheck,
  Truck,
  BarChart3,
  Settings,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { User, Product } from '../types/inventory';
import { getProductStatus } from '../services/storage';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  currentUser: User;
  products: Product[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, currentUser, products }) => {
  // Compute badge indicators
  const lowStockCount = products.filter((p) => {
    const total = p.warehouseStock + p.storeShelfStock;
    return total <= p.minReorderLevel;
  }).length;

  const expiringCount = products.filter((p) => {
    const { daysUntilExpiry } = getProductStatus(p);
    return daysUntilExpiry !== null && daysUntilExpiry <= 30;
  }).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Store Overview',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'staff'],
    },
    {
      id: 'inventory',
      label: 'Inventory Catalog',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
      roles: ['admin', 'manager', 'staff'],
    },
    {
      id: 'stock_in',
      label: 'Stock In / Receiving',
      icon: ArrowDownLeft,
      roles: ['admin', 'manager', 'staff'],
    },
    {
      id: 'stock_out',
      label: 'Stock Out / Dispatch',
      icon: ArrowUpRight,
      roles: ['admin', 'manager', 'staff'],
    },
    {
      id: 'expiration',
      label: 'FEFO & Expirations',
      icon: Clock,
      badge: expiringCount > 0 ? `${expiringCount}` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      roles: ['admin', 'manager', 'staff'],
    },
    {
      id: 'warehouse',
      label: 'Warehouse & Bins',
      icon: Warehouse,
      roles: ['admin', 'manager', 'staff'],
    },
    {
      id: 'audit',
      label: 'Physical Stock Count',
      icon: ClipboardCheck,
      roles: ['admin', 'manager'],
    },
    {
      id: 'purchase_orders',
      label: 'Suppliers & Orders',
      icon: Truck,
      roles: ['admin', 'manager'],
    },
    {
      id: 'reports',
      label: 'Reports & Audit Logs',
      icon: BarChart3,
      roles: ['admin', 'manager', 'staff'],
    },
    {
      id: 'settings',
      label: 'System & Users',
      icon: Settings,
      roles: ['admin'],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-1">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-2">
          Operations Menu
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const hasAccess = item.roles.includes(currentUser.role);
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            if (!hasAccess) {
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 opacity-60 cursor-not-allowed"
                  title="Restricted by role access policy"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Store Quick Status Box at Bottom */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700/80 text-xs">
        <div className="flex items-center justify-between text-slate-300 font-bold mb-1">
          <span>Dueñas Store DB</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <p className="text-[11px] text-slate-400">
          Sync status: <span className="text-emerald-400 font-medium">Real-time local</span>
        </p>
        <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-slate-400 flex justify-between">
          <span>SKUs Tracked: {products.length}</span>
          <span>Role: {currentUser.role.toUpperCase()}</span>
        </div>
      </div>
    </aside>
  );
};
