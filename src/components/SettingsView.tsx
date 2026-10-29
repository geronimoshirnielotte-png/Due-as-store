import React, { useState } from 'react';
import {
  Settings,
  Users,
  Database,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { User } from '../types/inventory';
import { getUsers, exportDatabaseJSON, importDatabaseJSON, resetToDefaultData } from '../services/storage';

interface SettingsViewProps {
  currentUser: User;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onRefresh }) => {
  const [successNote, setSuccessNote] = useState('');
  const [errorNote, setErrorNote] = useState('');
  const users = getUsers();

  const handleExportData = () => {
    const json = exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Duenas_Stores_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessNote('Database export downloaded successfully.');
    setTimeout(() => setSuccessNote(''), 4000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importDatabaseJSON(content);
      if (ok) {
        setSuccessNote('Database restored successfully from backup file.');
        onRefresh();
      } else {
        setErrorNote('Invalid backup file format.');
      }
      setTimeout(() => {
        setSuccessNote('');
        setErrorNote('');
      }, 4000);
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (
      confirm(
        'Warning: This will reset all inventory, transactions, and users back to initial default store state. Continue?'
      )
    ) {
      resetToDefaultData();
      setSuccessNote('System restored to original default demo state.');
      onRefresh();
      setTimeout(() => setSuccessNote(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            System Configuration & Store Administration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authorized grocery personnel, access roles, and database backups
          </p>
        </div>
      </div>

      {successNote && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successNote}</span>
        </div>
      )}

      {errorNote && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorNote}</span>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Authorized Personnel List */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Store Personnel Accounts ({users.length})
            </h3>
            <span className="text-[10px] text-slate-400">Role-Based Access Control</span>
          </div>

          <div className="divide-y divide-slate-800 space-y-2">
            {users.map((u) => (
              <div key={u.id} className="pt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      u.avatarUrl ||
                      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={u.name}
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                  />
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{u.name}</span>
                      {u.id === currentUser.id && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                    <div className="text-[10px] text-slate-400">{u.title}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : u.role === 'manager'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {u.role}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Last: {u.lastLogin || 'Recent'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Database Backup, Export & Restore */}
        <div className="space-y-6">
          {/* Backup Box */}
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Database Backup & Cloud Safeguard
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export the entire inventory database, transactions log, warehouse slotting, and staff accounts
              as an encrypted JSON file for safekeeping.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportData}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Database JSON</span>
              </button>

              <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Restore From JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset Box */}
          <div className="bg-slate-850 border border-red-500/30 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-red-400" />
              Reset Store Data to Default
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Resets all inventory records, batches, and transactions back to the default sample dataset for
              Dueñas Store. Useful for training and demonstration.
            </p>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Sample Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
