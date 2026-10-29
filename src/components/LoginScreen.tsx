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
} from 'lucide-react';
import { loginUser, registerUser, quickLoginAsRole } from '../services/storage';
import { UserRole } from '../types/inventory';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('owner@duenas.store');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = loginUser(email, password);
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-slate-900 to-slate-950 pointer-events-none" />

      {/* Decorative top bar */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black tracking-wider">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
              DUEÑAS STORES
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                WMS & IMS
              </span>
            </h1>
            <p className="text-xs text-slate-400">Integrated Warehouse & Inventory Management System</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Authentication Secured</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row items-center justify-center gap-10">
        {/* Left Side: Brand Story & Problems Solved */}
        <div className="flex-1 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Designed specifically for Dueñas Store Operations
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Stop inventory discrepancies, lost paper logs, and overlooked expiration dates.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Dueñas Stores replaces manual paper logbooks and inaccurate counting with an integrated digital
            management platform. Experience real-time stock balances across warehouse shelves and store displays,
            automated stock-in receiving, and proactive FEFO expiration alerts.
          </p>

          {/* Quick Problem-Solver Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <Package className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">Real-Time Stock</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Eliminates counting guesswork between backroom and store aisles.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">FEFO Expiration Alert</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Prevents grocery spoilage with early 30-day and 7-day warnings.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">Fast Receiving Slips</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Zero repetitive handwriting; instant PO and delivery receiving.
              </p>
            </div>
          </div>

          {/* Quick Demo Login Switcher */}
          <div className="pt-2">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              Quick 1-Click Role Access (Evaluation & Demo):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="group text-left p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-950/40 border border-slate-700/80 hover:border-emerald-500/50 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300">Don Carlos Dueñas</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Owner
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Full control, margins, reports</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager')}
                className="group text-left p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-950/40 border border-slate-700/80 hover:border-emerald-500/50 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300">Elena Santos</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Manager
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Warehouse, receiving, audits</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="group text-left p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-950/40 border border-slate-700/80 hover:border-emerald-500/50 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300">Mateo Ramos</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Clerk
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Sales dispatch, shelf refills</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Standard Login Box */}
        <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="mb-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Staff Sign In</h3>
            <p className="text-xs text-slate-400 mt-1">Enter your Dueñas Store credentials to continue</p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@duenas.store"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('owner@duenas.store');
                    setPassword('admin123');
                    setErrorMessage('');
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 transition"
                >
                  Use Default Password
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span>Keep me signed in</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  alert(
                    'For testing, you can use:\n• owner@duenas.store (pass: admin123)\n• warehouse@duenas.store (pass: warehouse123)\n• staff@duenas.store (pass: staff123)'
                  );
                }}
                className="text-slate-400 hover:text-emerald-400 transition"
              >
                Help / Sample Logins
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Create New Account Button */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400 mb-2">New grocery store personnel or trainee?</p>
            <button
              type="button"
              onClick={() => setIsRegistering(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register New Personnel Account
            </button>
          </div>
        </div>
      </main>

      {/* Register Staff Modal */}
      {isRegistering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
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
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
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
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition"
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
        Dueñas Stores Warehouse & Inventory Management System &copy; 2026. Designed for grocery store accuracy,
        efficiency, and stock visibility.
      </footer>
    </div>
  );
};
