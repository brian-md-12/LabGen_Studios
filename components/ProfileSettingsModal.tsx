
import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Check, Loader2, RefreshCw, ShieldCheck, Key, Zap, Info, ShieldAlert, Settings2, Database, Film, Image as ImageIcon, Eye } from 'lucide-react';
import { User } from '../types';
import * as authService from '../services/authService';
import * as geminiService from '../services/geminiService';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const AVATAR_PRESETS = [
  'avataaars', 'bottts', 'adventurer', 'fun-emoji', 'micah'
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [apiMode, setApiMode] = useState<'admin' | 'user'>(user.apiMode || 'admin');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Personal Keys State
  const [personalKeys, setPersonalKeys] = useState<{
    primary: string;
    text: string;
    image: string;
    video: string;
  }>({ primary: '', text: '', image: '', video: '' });

  useEffect(() => {
    if (isOpen) {
      const savedKeys = JSON.parse(localStorage.getItem('labgen_user_keys') || '{}');
      setPersonalKeys({
        primary: savedKeys.primary || '',
        text: savedKeys.text || '',
        image: savedKeys.image || '',
        video: savedKeys.video || ''
      });
    }
  }, [isOpen]);

  const generateNewAvatar = () => {
    const style = AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];
    const seed = Math.random().toString(36).substring(7);
    setAvatar(`https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`);
  };

  const handleKeyChange = (field: keyof typeof personalKeys, value: string) => {
    setPersonalKeys(prev => ({ ...prev, [field]: value }));
  };

  const validateAndTestKey = async (field: keyof typeof personalKeys) => {
    const key = personalKeys[field];
    if (!key) return;
    setIsValidating(field);
    const isValid = await geminiService.validateKey(key);
    setIsValidating(null);
    // Convert field to string to satisfy TypeScript that it's not a symbol or number
    if (!isValid) setError(`API Key for ${String(field).toUpperCase()} failed verification.`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (apiMode === 'user' && !personalKeys.primary) {
        throw new Error("Personal Tier requires at least a Primary API Key.");
      }

      localStorage.setItem('labgen_user_keys', JSON.stringify(personalKeys));
      const updated = await authService.updateUserProfile({ name, avatar, apiMode });
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10">
          <X size={24} />
        </button>

        <div className="p-12 border-b bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-900 border"><Settings2 size={24} /></div>
             <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Scientific Identity</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">v5.0 Neural Infrastructure Panel</p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
          <form onSubmit={handleSave} className="space-y-12">
            {/* Avatar & Basic Info */}
            <div className="flex items-center gap-10">
              <div className="relative group">
                <div className="w-28 h-28 rounded-3xl bg-slate-100 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center group-hover:ring-8 ring-science-50 transition-all">
                  {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon size={48} className="text-slate-300" />}
                </div>
                <button type="button" onClick={generateNewAvatar} className="absolute -bottom-2 -right-2 p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-science-600 transition-all active:scale-95"><RefreshCw size={18} /></button>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Researcher Display Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-science-200 outline-none transition-all text-sm font-semibold shadow-inner" required />
              </div>
            </div>

            {/* API Tier Selection */}
            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Zap size={14} className="text-amber-500" /> Infrastructure Resource Tier
              </label>
              <div className="grid grid-cols-2 gap-6">
                <button type="button" onClick={() => setApiMode('admin')} className={`p-8 rounded-[40px] border-2 text-left transition-all relative overflow-hidden ${apiMode === 'admin' ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}>
                   {apiMode === 'admin' && <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck size={64} /></div>}
                   <ShieldCheck size={28} className={apiMode === 'admin' ? 'text-science-400 mb-4' : 'text-slate-300 mb-4'} />
                   <span className="text-xs font-black uppercase tracking-widest block">Admin Managed</span>
                   <span className="text-[9px] font-bold uppercase opacity-60">High-Performance Cluster</span>
                </button>
                <button type="button" onClick={() => setApiMode('user')} className={`p-8 rounded-[40px] border-2 text-left transition-all relative overflow-hidden ${apiMode === 'user' ? 'bg-blue-600 border-blue-600 text-white shadow-2xl' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}>
                   <Key size={28} className={apiMode === 'user' ? 'text-white mb-4' : 'text-slate-300 mb-4'} />
                   <span className="text-xs font-black uppercase tracking-widest block">Personal BYOK</span>
                   <span className="text-[9px] font-bold uppercase opacity-60">Researcher Personal Keys</span>
                </button>
              </div>

              {/* Personal Key Configuration */}
              {apiMode === 'user' && (
                <div className="space-y-6 p-8 bg-blue-50/50 rounded-[40px] border border-blue-100 animate-in slide-in-from-top-4">
                  <div className="flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Neural Key Configuration</h4>
                     <p className="text-[8px] font-bold text-blue-400 uppercase">Input and Validate personal keys</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-blue-800 uppercase tracking-tighter flex items-center gap-2 px-1">
                         <Database size={12} /> Primary Core Key (Essential)
                       </label>
                       <div className="relative">
                         <input type="password" value={personalKeys.primary} onChange={(e) => handleKeyChange('primary', e.target.value)} onBlur={() => validateAndTestKey('primary')} className="w-full px-5 py-3.5 bg-white border border-blue-200 rounded-2xl text-[10px] font-mono outline-none focus:ring-2 ring-blue-500/20 shadow-sm" placeholder="PRIMARY_GEMINI_KEY" />
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                            {isValidating === 'primary' ? <Loader2 size={12} className="animate-spin text-blue-500" /> : personalKeys.primary && <Check size={12} className="text-green-500" />}
                         </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-1.5 px-1">
                           <ImageIcon size={10} /> Imaging Key
                         </label>
                         <input type="password" value={personalKeys.image} onChange={(e) => handleKeyChange('image', e.target.value)} className="w-full px-4 py-3 bg-white/60 border border-slate-200 rounded-xl text-[9px] font-mono outline-none focus:border-blue-400" placeholder="Optional" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-1.5 px-1">
                           <Film size={10} /> Motion Key (Veo)
                         </label>
                         <input type="password" value={personalKeys.video} onChange={(e) => handleKeyChange('video', e.target.value)} className="w-full px-4 py-3 bg-white/60 border border-slate-200 rounded-xl text-[9px] font-mono outline-none focus:border-blue-400" placeholder="Optional" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {apiMode === 'admin' && (
                <div className="p-6 bg-science-50 rounded-[32px] border border-science-100 flex items-start gap-4 animate-in fade-in duration-500">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-science-600"><Info size={16} /></div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-science-900 uppercase">Self-Healing Infrastructure Active</p>
                    <p className="text-[9px] font-bold text-science-700/70 uppercase leading-relaxed tracking-tight">
                      Administrators have provided a pool of rotating sub-APIs. If the primary hits a quota limit, the engine will automatically failover to secondary nodes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-10 bg-slate-50 border-t flex flex-col items-center gap-6 shrink-0">
          {error && <div className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={12} /> {error}</div>}
          <button onClick={handleSave} disabled={isLoading} className="w-full max-w-lg py-5 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-science-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
            Commit Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
