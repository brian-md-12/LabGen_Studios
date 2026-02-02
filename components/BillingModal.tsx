
import React, { useState } from 'react';
/* Added AlertCircle to imports */
import { X, CreditCard, Zap, Check, Loader2, Sparkles, Award, Key, CheckCircle2, Info, Settings, Terminal, AlertTriangle, Eye, EyeOff, ShieldCheck, Lock, Shield, Trash2, ArrowLeft, ArrowUpCircle, AlertCircle } from 'lucide-react';
import { User } from '../types';
import * as authService from '../services/authService';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export const BillingModal: React.FC<BillingModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [selectedTier, setSelectedTier] = useState<'basic' | 'pro' | 'upgrade' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminTool, setShowAdminTool] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
  const PLAN_BASIC = process.env.PAYPAL_PLAN_BASIC || '';
  const PLAN_PRO = process.env.PAYPAL_PLAN_PRO || '';
  const PLAN_UPGRADE = process.env.PAYPAL_PLAN_UPGRADE || ''; // New: $10 plan

  const handleApprove = async (data: any) => {
    setIsProcessing(true);
    setError(null);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const finalStatus = (selectedTier === 'pro' || selectedTier === 'upgrade') ? 'pro' : 'basic';

      const updated = await authService.updateUserProfile({ 
        subscriptionStatus: finalStatus,
        subscriptionExpiresAt: expiresAt.toISOString()
      });
      onUpdate(updated);
      setSuccess(true);
    } catch (e: any) {
      setError("SYNC ALERT: Transaction successful but profile mapping failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const updated = await authService.updateUserProfile({ 
        subscriptionStatus: 'none'
      });
      onUpdate(updated);
      setShowCancelConfirm(false);
      onClose();
    } catch (e: any) {
      setError("REVOCATION FAILED: Unable to sync cancellation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaypalError = (err: any) => {
    setError(`LIVE GATEWAY ERROR: Plan processing failure.`);
  };

  if (!isOpen) return null;

  const isBasic = user.subscriptionStatus === 'basic';
  const isPro = user.subscriptionStatus === 'pro';
  const hasActivePlan = (user.subscriptionStatus && user.subscriptionStatus !== 'none') || 
                        (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date());

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden relative flex flex-col max-h-[90vh] border border-white/10">
        
        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10">
          <X size={24} />
        </button>

        <div className={`p-10 border-b flex items-center justify-between shrink-0 bg-slate-900 text-white`}>
          <div className="flex items-center gap-6">
            <div className={`p-4 rounded-3xl shadow-xl bg-white text-slate-900`}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black tracking-tight uppercase">Billing Hub</h2>
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 text-slate-300`}>
                Current Access: <span className="font-black text-science-400">{hasActivePlan ? (user.subscriptionStatus !== 'none' ? user.subscriptionStatus?.toUpperCase() : 'PENDING EXPIRATION') : 'GUEST'}</span>
              </p>
            </div>
          </div>
          {user.isSuperAdmin && (
            <button onClick={() => setShowAdminTool(!showAdminTool)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all bg-white/10 text-white/50 hover:bg-white hover:text-slate-900`}>
              <Terminal size={14} /> Diagnostic Layer
            </button>
          )}
        </div>

        <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95">
               <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[40px] flex items-center justify-center shadow-2xl border-4 border-white"><Award size={48} /></div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black text-slate-900 uppercase">Researcher Provisioned</h3>
                 <p className="text-slate-500 text-xs font-medium">Your account tier has been updated. Access is now unlocked.</p>
               </div>
               <button onClick={onClose} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em]">Access Studio</button>
            </div>
          ) : showAdminTool ? (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="p-8 bg-slate-950 rounded-[40px] text-white border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                    <Shield size={14} /> Production Audit
                  </h3>
                </div>
                <div className="space-y-3 font-mono text-[9px]">
                  <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-400">EXPIRES_AT</span>
                    <span className="text-white">{user.subscriptionExpiresAt || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-400">REVIEW_HUB_USES</span>
                    <span className="text-white">{user.reviewHubUses || 0}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowAdminTool(false)} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Exit Diagnostics</button>
            </div>
          ) : showCancelConfirm ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-10 animate-in zoom-in-95">
               <div className="w-24 h-24 bg-red-100 text-red-600 rounded-[40px] flex items-center justify-center shadow-xl border-4 border-white">
                 <AlertTriangle size={48} />
               </div>
               <div className="space-y-4 max-w-sm">
                 <h3 className="text-2xl font-black text-slate-900 uppercase">Retention Active</h3>
                 <p className="text-slate-500 text-xs font-medium leading-relaxed">
                   Canceling will stop future billing. You will retain current access until your current period ends {user.subscriptionExpiresAt ? `on ${new Date(user.subscriptionExpiresAt).toLocaleDateString()}` : ''}.
                 </p>
               </div>
               <div className="flex flex-col gap-4 w-full max-w-xs">
                 <button onClick={handleCancelSubscription} disabled={isProcessing} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-xl disabled:opacity-50">{isProcessing ? <Loader2 className="animate-spin" /> : 'Confirm Cancellation'}</button>
                 <button onClick={() => setShowCancelConfirm(false)} className="w-full py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200">Keep Access</button>
               </div>
            </div>
          ) : hasActivePlan && !selectedTier ? (
            <div className="space-y-12 animate-in fade-in duration-500 py-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Active Subscription</h3>
                <div className="px-4 py-2 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-tighter border border-green-100 flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Status: Verified Active
                </div>
              </div>

              <div className="p-10 rounded-[48px] border-2 border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center gap-10">
                <div className="w-32 h-32 bg-slate-900 rounded-[40px] flex items-center justify-center text-science-400 shadow-2xl relative">
                   {isPro ? <Zap size={48} /> : <Key size={48} />}
                   <div className="absolute -bottom-2 -right-2 p-2 bg-blue-500 rounded-full border-4 border-white text-white">
                     <Check size={16} />
                   </div>
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                   <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Researcher {user.subscriptionStatus?.toUpperCase()}</h4>
                   <p className="text-xs text-slate-500 font-medium">Your {user.subscriptionStatus} access is currently active.</p>
                   {isBasic && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-left">
                         <p className="text-[10px] font-black text-blue-900 uppercase mb-1">Basic Tier Limit:</p>
                         <p className="text-[9px] text-blue-600 font-bold uppercase leading-relaxed tracking-tighter">Admin core restricted to Grounded Search. 5 Review HUB uses total.</p>
                         <button onClick={() => setSelectedTier('upgrade')} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-blue-200">
                           <ArrowUpCircle size={14} /> Upgrade to Pro — $10.00
                         </button>
                      </div>
                   )}
                </div>
              </div>

              <div className="p-8 bg-red-50 border border-red-100 rounded-[40px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl text-red-500 border border-red-50"><Trash2 size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Manage Plan</p>
                    <p className="text-[9px] font-bold text-red-400 uppercase tracking-tight">Stop recurring payments but retain current access.</p>
                  </div>
                </div>
                <button onClick={() => setShowCancelConfirm(true)} className="px-8 py-4 bg-white text-red-600 border border-red-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">Cancel Recurring</button>
              </div>
            </div>
          ) : !selectedTier ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="p-10 rounded-[48px] border-2 bg-white border-slate-100 hover:border-blue-200 transition-all flex flex-col group shadow-sm hover:shadow-xl">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6"><Key size={24} /></div>
                  <h3 className="text-lg font-black text-slate-900 uppercase">Researcher Basic</h3>
                  <p className="text-3xl font-black text-slate-900 mt-2">$2.00 <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">/ mo</span></p>
                </div>
                <ul className="space-y-3 mb-10 flex-1">
                   <li className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><Check size={14} className="text-green-500" /> Admin Grounded Search</li>
                   <li className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><Check size={14} className="text-green-500" /> 5 Review Hub Generations</li>
                   <li className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><AlertCircle size={14} className="text-blue-400" /> Use BYOK for Storyboards</li>
                </ul>
                <button onClick={() => setSelectedTier('basic')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">Select Basic</button>
              </div>

              <div className="p-10 rounded-[48px] border-2 bg-slate-50 border-transparent hover:border-science-200 transition-all flex flex-col shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-science-100 opacity-20"><Zap size={100} /></div>
                <div className="mb-8 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-science-100 text-science-600 flex items-center justify-center mb-6"><Zap size={24} /></div>
                  <h3 className="text-lg font-black text-slate-900 uppercase">Researcher Pro</h3>
                  <p className="text-3xl font-black text-slate-900 mt-2">$12.00 <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">/ mo</span></p>
                </div>
                <ul className="space-y-3 mb-10 flex-1 relative z-10">
                   <li className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase"><Sparkles size={14} className="text-science-400" /> Full Admin Synthesis</li>
                   <li className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase"><Sparkles size={14} className="text-science-400" /> Veo 1080p Priority</li>
                   <li className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase"><Sparkles size={14} className="text-science-400" /> Unlimited Review Hub</li>
                </ul>
                <button onClick={() => setSelectedTier('pro')} className="w-full py-5 bg-science-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-science-700 transition-all shadow-xl shadow-science-600/20 relative z-10">Select Pro</button>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto py-10 space-y-10 text-center animate-in zoom-in-95">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-slate-900 uppercase">Secure Checkout</h3>
                <p className="text-xs text-slate-500 font-medium">Authorizing {selectedTier.toUpperCase()} tier via encrypted PayPal gateway.</p>
              </div>
              
              <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 min-h-[250px] flex items-center justify-center relative">
                <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, intent: "subscription", vault: true, components: "buttons" }}>
                  <PayPalButtons 
                    style={{ shape: 'pill', color: 'blue', layout: 'vertical', label: 'subscribe' }}
                    createSubscription={(data, actions) => {
                      let planId = PLAN_BASIC;
                      if (selectedTier === 'pro') planId = PLAN_PRO;
                      if (selectedTier === 'upgrade') planId = PLAN_UPGRADE;
                      return actions.subscription.create({ plan_id: planId });
                    }}
                    onApprove={handleApprove}
                    onError={handlePaypalError}
                    className="w-full"
                  />
                </PayPalScriptProvider>
                {isProcessing && (
                   <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-[40px] z-50">
                      <Loader2 className="animate-spin text-blue-600 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Provisioning Access...</p>
                   </div>
                )}
              </div>
              <button onClick={() => setSelectedTier(null)} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"><ArrowLeft size={12} /> Change Selection</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
