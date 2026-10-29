import React, { useState, useEffect } from 'react';
import {
  getCurrentUser,
  getProducts,
  getTransactions,
  getSuppliers,
  getWarehouseZones,
  getPurchaseOrders,
  subscribeToStorage,
  initializeStorage,
} from './services/storage';
import { Product, StockTransaction, Supplier, WarehouseZone, PurchaseOrder, User } from './types/inventory';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { StockInView } from './components/StockInView';
import { StockOutView } from './components/StockOutView';
import { ExpirationView } from './components/ExpirationView';
import { WarehouseView } from './components/WarehouseView';
import { AuditView } from './components/AuditView';
import { PurchaseOrdersView } from './components/PurchaseOrdersView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ProductModal } from './components/ProductModal';
import { BarcodeModal } from './components/BarcodeModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [zones, setZones] = useState<WarehouseZone[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [preselectedStockInProduct, setPreselectedStockInProduct] = useState<Product | null>(null);
  const [focusedProductId, setFocusedProductId] = useState<string | undefined>(undefined);

  // Load and subscribe to storage
  const reloadData = () => {
    setCurrentUser(getCurrentUser());
    setProducts(getProducts());
    setTransactions(getTransactions());
    setSuppliers(getSuppliers());
    setZones(getWarehouseZones());
    setPurchaseOrders(getPurchaseOrders());
  };

  useEffect(() => {
    initializeStorage();
    reloadData();
    const unsubscribe = subscribeToStorage(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, []);

  // If user is not authenticated, show modern Dueñas Store Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={reloadData} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Bar */}
      <Navbar
        currentUser={currentUser}
        products={products}
        onNavigate={(tab) => setCurrentTab(tab)}
        onSearchSelect={(id) => {
          setFocusedProductId(id);
          setCurrentTab('inventory');
        }}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            setFocusedProductId(undefined);
          }}
          currentUser={currentUser}
          products={products}
        />

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                products={products}
                transactions={transactions}
                zones={zones}
                currentUser={currentUser}
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenStockIn={() => {
                  setPreselectedStockInProduct(null);
                  setCurrentTab('stock_in');
                }}
                onOpenStockOut={() => setCurrentTab('stock_out')}
              />
            )}

            {currentTab === 'inventory' && (
              <InventoryView
                products={products}
                currentUser={currentUser}
                selectedProductId={focusedProductId}
                onAddProduct={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                onEditProduct={(prod) => {
                  setEditingProduct(prod);
                  setIsProductModalOpen(true);
                }}
                onPrintBarcode={(prod) => setBarcodeProduct(prod)}
                onQuickTransfer={(prod) => {
                  setEditingProduct(prod);
                  setCurrentTab('warehouse');
                }}
                onStockInProduct={(prod) => {
                  setPreselectedStockInProduct(prod);
                  setCurrentTab('stock_in');
                }}
              />
            )}

            {currentTab === 'stock_in' && (
              <StockInView
                products={products}
                suppliers={suppliers}
                currentUser={currentUser}
                preselectedProduct={preselectedStockInProduct}
                onSuccess={(txn) => {
                  reloadData();
                }}
              />
            )}

            {currentTab === 'stock_out' && (
              <StockOutView
                products={products}
                currentUser={currentUser}
                onSuccess={(txn) => {
                  reloadData();
                }}
              />
            )}

            {currentTab === 'expiration' && (
              <ExpirationView
                products={products}
                currentUser={currentUser}
                onRefresh={reloadData}
              />
            )}

            {currentTab === 'warehouse' && (
              <WarehouseView
                zones={zones}
                products={products}
                currentUser={currentUser}
                onRefresh={reloadData}
              />
            )}

            {currentTab === 'audit' && (
              <AuditView
                products={products}
                currentUser={currentUser}
                onRefresh={reloadData}
              />
            )}

            {currentTab === 'purchase_orders' && (
              <PurchaseOrdersView
                suppliers={suppliers}
                purchaseOrders={purchaseOrders}
                products={products}
                currentUser={currentUser}
                onRefresh={reloadData}
                onReceivePO={(po) => {
                  // Direct to stock in for the first item
                  const prod = products.find((p) => p.id === po.items[0]?.productId);
                  if (prod) {
                    setPreselectedStockInProduct(prod);
                    setCurrentTab('stock_in');
                  }
                }}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                products={products}
                transactions={transactions}
                currentUser={currentUser}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView currentUser={currentUser} onRefresh={reloadData} />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        product={editingProduct}
        suppliers={suppliers}
        zones={zones}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSaved={reloadData}
      />

      <BarcodeModal
        isOpen={!!barcodeProduct}
        product={barcodeProduct}
        onClose={() => setBarcodeProduct(null)}
      />
    </div>
  );
}
