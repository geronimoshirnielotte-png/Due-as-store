import React, { useState } from 'react';
import {
  Store,
  Warehouse,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  Package,
  Layers,
  Sparkles,
  KeyRound,
  ShieldAlert,
  Crown,
  CheckCircle2,
} from 'lucide-react';
import { loginUser, loginAdmin, registerUser, quickLoginAsRole } from '../services/storage';
import { UserRole } from '../types/inventory';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // Auth portal mode: 'admin' vs 'staff'
  const [authMode, setAuthMode] = useState<'admin' | 'staff'>('admin');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('owner@duenas.store');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [adminPin, setAdminPin] = useState('8899');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Staff form state
  const [staffEmail, setStaffEmail] = useState('warehouse@duenas.store');
  const [staffPassword, setStaffPassword] = useState('warehouse123');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register modal state
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('staff');
  const [regTitle, setRegTitle] = useState('Inventory Clerk');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');

  // Handle Admin Authentication
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = loginAdmin(adminEmail, adminPassword, adminPin);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(res.error || 'Administrator authentication failed');
      }
    }, 350);
  };

  // Handle Staff Authentication
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = loginUser(staffEmail, staffPassword);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(res.error || 'Authentication failed');
      }
    }, 300);
  };

  const handleQuickLogin = (role: 'admin' | 'manager' | 'staff') => {
    quickLoginAsRole(role);
    onLoginSuccess();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName || !regEmail || !regPassword) {
      setRegError('Please complete all required fields.');
      return;
    }

    const res = registerUser({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      title: regTitle,
      phone: regPhone,
    });

    if (res.success) {
      setIsRegistering(false);
      onLoginSuccess();
    } else {
      setRegError(res.error || 'Could not register user');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Decorative top bar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
              DUEÑAS STORES
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                WMS & IMS
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Integrated Warehouse & Inventory Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="hidden sm:flex items-center gap-2 text-slate-300 bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-700/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Role-Based Security & Audit Trail Active</span>
          </div>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row items-center justify-center gap-10">
        {/* Left Side: System Highlights & Role Evaluation Shortcuts */}
        <div className="flex-1 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Dueñas Stores Management Portal
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Integrated Warehouse & Grocery Inventory Control.
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Eliminate inventory discrepancies, lost paper logbooks, and unmonitored expiration dates. Sign in as an
            authorized Administrator to manage valuations, supplier purchase orders, and user access, or as store
            personnel for stock receiving and dispatch.
          </p>

          {/* Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <Package className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5">Dual Stock Tracking</h4>
              <p className="text-[11px] text-slate-400">Warehouse backroom vs. storefront retail shelves.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5">FEFO Expiration</h4>
              <p className="text-[11px] text-slate-400">Automated 15d & 30d spoilage warnings.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                <Crown className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5">Admin Security</h4>
              <p className="text-[11px] text-slate-400">Protected valuation, audits & backups.</p>
            </div>
          </div>

          {/* Quick 1-Click Evaluation Logins */}
          <div className="pt-2">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              Instant Role Testing (1-Click Evaluation):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="group text-left p-3 rounded-xl bg-slate-900/90 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/60 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-purple-300">
                    Don Carlos Dueñas
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Admin / Owner
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Full system & financial oversight</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager')}
                className="group text-left p-3 rounded-xl bg-slate-900/90 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/60 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-blue-300">
                    Elena Santos
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    Warehouse Mgr
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Receiving, bin slotting, audits</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="group text-left p-3 rounded-xl bg-slate-900/90 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/60 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                    Mateo Ramos
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Store Clerk
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Sales dispatch, shelf refills</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Box with Dedicated Admin Tab */}
        <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative">
          {/* Portal Switcher Tabs */}
          <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('admin');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('staff');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === 'staff'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Staff Portal</span>
            </button>
          </div>

          {/* Heading */}
          <div className="mb-5 text-center">
            {authMode === 'admin' ? (
              <>
                <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Administrator Authentication
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sign in with Administrator credentials &amp; Security PIN
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Store Personnel Sign In
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sign in with registered Dueñas Store staff account
                </p>
              </>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ADMIN FORM */}
          {authMode === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Administrator Email *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminEmail('owner@duenas.store');
                      setAdminPassword('admin123');
                      setAdminPin('8899');
                      setErrorMessage('');
                    }}
                    className="text-[10px] text-purple-400 hover:text-purple-300 transition"
                  >
                    Auto-Fill Default Admin
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 text-purple-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="owner@duenas.store"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Master Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-purple-400" />
                  </div>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Admin Security PIN / 2FA Passkey */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Security Passkey / 2FA PIN
                  </label>
                  <span className="text-[10px] text-slate-400">Master PIN: 8899</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4 text-purple-400" />
                  </div>
                  <input
                    type="password"
                    maxLength={6}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="8899"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
              </div>

              {/* Clearance Note */}
              <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[10px] text-purple-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  Grants full access to profit margins, valuations, physical audit approvals, and user accounts.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>Log In as Administrator</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STAFF FORM */}
          {authMode === 'staff' && (
            <form onSubmit={handleStaffLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Staff Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 text-emerald-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="warehouse@duenas.store"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Provides daily operational access for Stock In receiving, sales dispatch, and shelf refills.
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Staff Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* New Personnel Registration Link */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register New Dueñas Personnel Account
            </button>
          </div>
        </div>
      </main>

      {/* Register Staff Modal */}
      {isRegistering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Register Dueñas Store Personnel
            </h3>
            <p className="text-xs text-slate-400 mb-4">Create access credentials for warehouse or front-store staff</p>

            {regError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Clara Lopez"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@duenas.store"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Create password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">System Role *</label>
                  <select
                    value={regRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setRegRole(r);
                      if (r === 'staff') setRegTitle('Inventory Clerk / Cashier');
                      if (r === 'manager') setRegTitle('Warehouse Supervisor');
                      if (r === 'admin') setRegTitle('Store Owner / Co-Manager');
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="staff">Store Staff / Clerk</option>
                    <option value="manager">Warehouse Manager</option>
                    <option value="admin">Administrator / Owner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={regTitle}
                    onChange={(e) => setRegTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+63 912 345 6789"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition"
                >
                  Create & Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-sm text-center text-xs text-slate-500">
        Dueñas Stores Warehouse & Inventory Management System &copy; 2026. Secure Administrator &amp; Staff Authentication.
      </footer>
    </div>
  );
};
