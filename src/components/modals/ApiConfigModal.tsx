import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Globe, Server, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    apiMode,
    setApiMode,
    backendUrl,
    setBackendUrl,
    isBackendHealthy,
    checkBackendHealth,
    showToast,
  } = useApp();

  const [tempUrl, setTempUrl] = useState(backendUrl);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setBackendUrl(tempUrl);
    showToast('Base URL API berhasil diperbarui.');
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    await checkBackendHealth();
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Pengaturan Koneksi API</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mode Live Backend vs Smart Fallback Deterministic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Mode Operasi Aplikasi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setApiMode('demo')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                  apiMode === 'demo'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Smart Fallback</span>
                    {apiMode === 'demo' && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                    100% Kalkulasi deterministik lokal PRD tanpa dependensi server luar. Aman untuk demo!
                  </p>
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md self-start">
                  Rekomendasi Demo
                </span>
              </button>

              <button
                type="button"
                onClick={() => setApiMode('live')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                  apiMode === 'live'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Live Backend</span>
                    {apiMode === 'live' && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                    Memanggil REST API server dengan token Bearer & X-Session-Token.
                  </p>
                </div>
                <span className="inline-block mt-3 px-2 py-0.5 text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-md self-start">
                  Integrasi REST
                </span>
              </button>
            </div>
          </div>

          {/* Backend URL Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Base URL REST API Backend</span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">Default: Port 8000</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="http://localhost:8000/api/v1"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition border border-slate-200 dark:border-slate-700 shrink-0"
              >
                {isTesting ? 'Cek...' : 'Uji Koneksi'}
              </button>
            </div>
            {isBackendHealthy !== null && (
              <p
                className={`text-xs flex items-center gap-1.5 mt-1 ${
                  isBackendHealthy ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBackendHealthy ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {isBackendHealthy
                  ? 'Server live aktif dan siap menerima request!'
                  : 'Server live tidak merespons (Offline). Fallback otomatis aktif jika mode live dipilih.'}
              </p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-200">Prinsip Anti-Gagal:</strong> Jika Anda memilih mode{' '}
            <em>Live Backend</em> namun server gagal dihubungi (network error/offline), sistem JalurKu
            akan otomatis menjalankan algoritma deterministik lokal tanpa memutus alur pengguna.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
