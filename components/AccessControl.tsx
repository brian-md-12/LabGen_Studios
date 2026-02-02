
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Unlock, ArrowRight, FlaskConical, X, CreditCard, Sparkles, AlertCircle, Shield, CheckCircle2 } from 'lucide-react';
import { validateAccessCode, incrementCodeUsage } from '../data/accessCodes';

interface AccessControlProps {
  isOpen: boolean;
  onAccessGranted: () => void;
  onOpenBilling?: () => void;
  onClose?: () => void;
}

const MAX_TRIAL_USES = 5;
const STORAGE_KEYS = {
  TRIAL_COUNT: 'labgen_trial_count_v5',
};

export const AccessControl: React.FC<AccessControlProps> = ({ isOpen, onAccessGranted, onOpenBilling, onClose }) => {
  const [mode, setMode] = useState<'trial_check' | 'enter_code' | 'exhausted'>('trial_check');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [isShake, setIsShake] = useState(false);
  const [trialCount, setTrialCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const count = parseInt(localStorage.getItem(STORAGE_KEYS.TRIAL_COUNT) || '0');
      setTrialCount(count);
      
      if (count >= MAX_TRIAL_USES) {
        setMode('exhausted');
      } else {
        setMode('trial_check');
      }
      setInputCode('');
      setError('');
    }
  }, [isOpen]);

  const handleUseTrial = () => {
    const newCount = trialCount + 1;
    localStorage.setItem(STORAGE_KEYS.TRIAL_COUNT, newCount.toString());
    onAccessGranted();
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAccessCode(inputCode);

    if (validation.valid) {
      incrementCodeUsage(inputCode);
      onAccessGranted();
    } else {
      setError(validation.message || 'Invalid access code.');
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />

      <div className="relative bg-white max-w-md w-full rounded-[48px] shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden border border-white/20 flex flex-col">
        <div className="bg-slate-50 p-10 text-center border-b border-slate-100 shrink-0">
          <div className="w-20 h-20 bg-slate-900 rounded-[32px] mx-auto flex items-center justify-center mb-6 shadow-2xl relative">
             <FlaskConical className="text-science-400" size={40} />
             <div className="absolute -top-1 -right-1 p-1 bg-blue-500 rounded-full border-2 border-white">
                <ShieldCheck className="text-white" size={14} />
             </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tighter">Access Firewall</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Verification Sequence v5.2</p>
        </div>

        <div className="p-10 flex-1 overflow-y-auto">
          {mode === 'trial_check' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-center space-y-3">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Researcher Trial</h2>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  You have <span className="font-black text-science-600 px-1.5 py-0.5 bg-science-50 rounded-md border border-science-100">{MAX_TRIAL_USES - trialCount} sessions</span> remaining in your current credential cycle.
                </p>
              </div>
              
              <div className="bg-science-50 border border-science-100 rounded-3xl p-8 flex items-start gap-4 shadow-inner">
                <Sparkles className="text-science-600 shrink-0" size={24} />
                <div className="text-[10px] text-science-800 font-bold uppercase tracking-tight leading-relaxed">
                  Trial permits full generation of multimodal cinematic assets. After 5 uses, a permanent researcher subscription or institutional waiver is required.
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleUseTrial}
                  className="w-full bg-slate-900 hover:bg-science-600 text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 group active:scale-95"
                >
                  Initiate Session <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button onClick={() => setMode('enter_code')} className="w-full py-4 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">
                  Apply Authorization / Waiver Code
                </button>
              </div>
            </div>
          )}

          {mode === 'exhausted' && (
            <div className="space-y-10 animate-in zoom-in-95 duration-500">
              <div className="text-center space-y-4">
                <div className="relative w-24 h-24 mx-auto">
                   <Lock className="text-red-500 w-full h-full" strokeWidth={1.5} />
                   <div className="absolute -top-1 -right-1 p-2 bg-white rounded-full shadow-lg">
                      <AlertCircle className="text-amber-500" size={24} />
                   </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Trial Exhausted</h2>
                <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-[280px] mx-auto">
                  Research sessions have concluded. Choose a tier to unlock Online Search ($2) or Infinite Multimodal Access ($12).
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onOpenBilling}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all group"
                >
                  <CreditCard size={18} className="group-hover:-rotate-12 transition-transform" /> Select Upgrade Tier
                </button>
                <button
                  onClick={() => setMode('enter_code')}
                  className="w-full bg-slate-50 text-slate-600 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Enter Waiver Code
                </button>
              </div>
            </div>
          )}

          {mode === 'enter_code' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Authorization Hub</h2>
                <p className="text-slate-500 text-xs font-medium">Input your unique institutional access code.</p>
              </div>

              <form onSubmit={handleVerifyCode} className={`space-y-6 ${isShake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Institutional Code</label>
                   <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="CODE-XXXX-XXXX"
                    className="w-full p-6 rounded-[24px] border-2 border-slate-100 bg-slate-50 text-slate-900 font-mono text-center text-sm outline-none focus:border-science-400 focus:bg-white transition-all uppercase shadow-inner"
                  />
                </div>
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase text-center flex items-center justify-center gap-2">
                     <AlertCircle size={14} /> {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 hover:bg-science-600 transition-all"
                >
                  <Unlock size={18} /> Authenticate Code
                </button>
              </form>
              
              <button 
                onClick={() => setMode(trialCount >= MAX_TRIAL_USES ? 'exhausted' : 'trial_check')} 
                className="w-full text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
              >
                Return to Sequence
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 p-8 text-center border-t border-slate-100 shrink-0">
          <div className="flex items-center justify-center gap-3 mb-1 opacity-40">
             <Shield size={12} className="text-slate-400" />
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">
               Institutional Security
             </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};
