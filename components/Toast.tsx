
import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X, Terminal } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    error: <AlertCircle className="text-red-500" size={20} />,
    success: <CheckCircle2 className="text-green-500" size={20} />,
    info: <Info className="text-science-500" size={20} />,
  };

  const backgrounds = {
    error: 'bg-red-50 border-red-200 shadow-red-900/5',
    success: 'bg-green-50 border-green-200 shadow-green-900/5',
    info: 'bg-blue-50 border-blue-200 shadow-blue-900/5',
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[300] flex items-center gap-4 px-6 py-4 rounded-3xl border shadow-2xl animate-in slide-in-from-right-8 fade-in duration-300 ${backgrounds[type]}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-xl shadow-sm">
          {icons[type]}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Terminal size={10} className="text-slate-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">System Log</span>
          </div>
          <p className="text-xs font-bold text-slate-800 leading-tight max-w-[280px]">{message}</p>
        </div>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-lg transition-colors ml-2 text-slate-400">
        <X size={16} />
      </button>
    </div>
  );
};
