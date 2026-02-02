
import React, { useState } from 'react';
import { FlaskConical, Mail, Lock, User as UserIcon, Loader2, ShieldCheck, Key, Dna, Atom, Beaker, Microscope, Binary, Activity, ChevronRight, Layers, ShieldAlert, Sparkles, MonitorPlay } from 'lucide-react';
import * as authService from '../services/authService';
import { validateAccessCode } from '../data/accessCodes';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onAuthenticated: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const isSupabaseConfigured = !!supabase;

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      setError('Google Sign-In requires VITE_SUPABASE_URL configuration. See guide.md.');
      return;
    }
    setError('');
    setIsGoogleLoading(true);
    try {
      await authService.signInWithGoogle();
      // Note: Redirect will happen, so loading state stays until page leaves
    } catch (err: any) {
      setError(err.message || 'Google Sign-In handshake failed.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name || !email || !password || !accessCode) throw new Error('Incomplete credentials.');
        const codeValidation = validateAccessCode(accessCode);
        if (!codeValidation.valid) throw new Error(codeValidation.message || 'Invalid Beta Code.');
        // Fix: signUp in authService expects (name, email)
        const sbUser = await authService.signUp(name, email);
        onAuthenticated(sbUser);
      } else {
        if (!email || !password) throw new Error('Email and password required.');
        // Fix: signIn in authService expects 0 arguments
        const sbUser = await authService.signIn();
        onAuthenticated(sbUser);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch bg-[#020617] overflow-hidden">
      {/* Left Column: Studio Branding */}
      <div className="hidden lg:flex flex-col w-[45%] bg-gradient-to-br from-[#050810] via-science-900 to-[#020617] p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-science-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-24 animate-in fade-in duration-1000">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl">
              <FlaskConical className="text-science-400" size={28} />
            </div>
            <div>
              <span className="text-white font-black tracking-[0.4em] text-xs uppercase block">LabGen Studio</span>
              <span className="text-science-500 text-[8px] font-black uppercase tracking-[0.2em] mt-0.5">Premier Scientific Suite</span>
            </div>
          </div>

          <div className="flex-1 space-y-12">
            <div className="space-y-6">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-science-400 text-[10px] font-black uppercase tracking-widest shadow-inner">
                 <Activity size={12} className="animate-pulse" /> Production Ready
               </div>
              <h2 className="text-5xl xl:text-7xl font-black text-white leading-[1.05] tracking-tighter animate-in slide-in-from-left-8 duration-700">
                Visualize the <br />
                <span className="bg-gradient-to-r from-science-400 via-blue-200 to-white bg-clip-text text-transparent">Invisible World.</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed font-medium opacity-90 animate-in slide-in-from-left-12 duration-1000">
                The definitive platform for creating scientific instructional media using high-fidelity generative models.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-12 duration-1000">
               {[
                 { icon: <MonitorPlay className="text-blue-400" />, label: "Resolution", value: "4K Cinema" },
                 { icon: <Sparkles className="text-purple-400" />, label: "Engine", value: "Gemini 3 Pro" },
                 { icon: <Layers className="text-green-400" />, label: "Grounding", value: "Live Search" },
                 { icon: <ShieldCheck className="text-amber-400" />, label: "Workflow", value: "Authenticated" }
               ].map((stat, i) => (
                 <div key={i} className="bg-white/5 backdrop-blur-3xl border border-white/10 p-6 rounded-[32px] group hover:bg-white/10 transition-all cursor-default">
                    <div className="mb-4 transform group-hover:scale-110 transition-transform duration-500">{stat.icon}</div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-sm font-bold text-white tracking-tight">{stat.value}</p>
                 </div>
               ))}
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex items-center justify-between opacity-50">
             <div className="flex items-center gap-10">
               <Dna size={22} className="text-white hover:text-science-400 transition-colors" />
               <Atom size={22} className="text-white hover:text-science-400 transition-colors" />
               <Microscope size={22} className="text-white hover:text-science-400 transition-colors" />
             </div>
             <p className="text-[8px] text-slate-500 font-bold tracking-[0.5em] uppercase">Scientific Accuracy Matters</p>
          </div>
        </div>
      </div>

      {/* Right Column: Auth Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 relative overflow-y-auto">
        <div className="max-w-md w-full animate-in slide-in-from-right-8 duration-700 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Control</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Studio Verification Sequence</p>
          </div>

          <div className="bg-white p-10 rounded-[56px] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-science-50 rounded-full blur-[80px] -mr-24 -mt-24 opacity-60" />
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Researcher Identity</label>
                  <div className="relative">
                    <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-science-200 outline-none transition-all text-sm font-semibold shadow-inner"
                      placeholder="Dr. Researcher"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Institutional Email</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-science-200 outline-none transition-all text-sm font-semibold shadow-inner"
                    placeholder="research@institute.org"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Security Key</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-science-200 outline-none transition-all text-sm font-semibold shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Authorization Code</label>
                  <div className="relative">
                    <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-science-200 outline-none transition-all text-sm font-black uppercase tracking-[0.2em] shadow-inner"
                      placeholder="XXXX-XXXX"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-3xl text-red-600 text-[10px] font-black uppercase text-center flex items-center justify-center gap-3 animate-in shake duration-300">
                   <ShieldAlert size={16} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all hover:bg-science-600 hover:shadow-[0_20px_40px_rgba(37,99,235,0.3)] active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    {isSignUp ? 'Initiate Workspace' : 'Enter Studio'}
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center my-10">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="px-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">External Auth</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className={`w-full py-5 border-2 rounded-[24px] flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50 group ${
                isGoogleLoading ? 'bg-science-50 border-science-200' : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="animate-spin text-science-600" size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-science-600">Verifying Identity...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.705A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996/0 000 9c0 1.452.348 2.827.957 4.037l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.963L3.964 7.295C4.672 5.168 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900 transition-colors">Institutional Single Sign-On</span>
                </>
              )}
            </button>
            
            {!isSupabaseConfigured && (
              <p className="mt-5 text-[9px] text-amber-600 font-bold uppercase tracking-widest text-center animate-pulse">
                Offline Mode Detected. Google SSO Disabled.
              </p>
            )}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-science-600 transition-colors"
            >
              {isSignUp ? "Registered Scientific Member? Sign In" : "Request New Workspace Access"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
