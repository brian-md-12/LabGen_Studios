import React, { useState } from 'react';
import { 
  FlaskConical, Search, Layers, ChevronLeft, ChevronRight, 
  Target, CreditCard, BrainCircuit, HelpCircle, Info, LogOut, 
  User as UserIcon, Save, Box, CheckCircle2, MessageSquareHeart,
  Sparkles
} from 'lucide-react';
import { User } from '../../types';
import { ApiKeySelector } from '../ApiKeySelector';

interface StudioShellProps {
  children: React.ReactNode;
  user: User | null;
  onSignOut: () => void;
  onOpenBilling: () => void;
  onOpenJenhi: () => void;
  onOpenTutorial: () => void;
  onOpenAbout: () => void;
  onOpenProfile: () => void;
  onOpenReviewHub: () => void;
  onOpenExport: () => void;
  onOpenFeedback: () => void;
  onSave: () => void;
  activeTab: 'write' | 'search' | 'projects';
  setActiveTab: (tab: 'write' | 'search' | 'projects') => void;
  projectName: string;
  setProjectName: (name: string) => void;
  lastSaved: Date | null;
  sceneCount: number;
}

export const StudioShell: React.FC<StudioShellProps> = ({
  children, user, onSignOut, onOpenBilling, onOpenJenhi, 
  onOpenTutorial, onOpenAbout, onOpenProfile, onOpenReviewHub,
  onOpenExport, onOpenFeedback, onSave, activeTab, setActiveTab, projectName,
  setProjectName, lastSaved, sceneCount
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex text-slate-900 font-sans selection:bg-science-100 selection:text-science-700 overflow-hidden bg-slate-50">
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-20'} shrink-0 flex flex-col bg-white border-r transition-all duration-300 z-50 shadow-2xl`}>
        <div className="p-6 border-b flex items-center justify-between h-16">
           <div className={`flex items-center gap-3 transition-opacity ${!isSidebarOpen ? 'opacity-0 invisible absolute' : 'opacity-100'}`}>
              <div className="bg-science-600 p-2 rounded-xl text-white shadow-lg"><FlaskConical size={20} /></div>
              <h1 className="font-black text-xs tracking-tight uppercase">LABGEN STUDIO</h1>
           </div>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
             {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
           </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
           <button onClick={() => setActiveTab('write')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'write' ? 'bg-science-50 text-science-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
             <Layers size={20} /> {isSidebarOpen && <span className="text-sm">Workspace Editor</span>}
           </button>
           <button onClick={() => setActiveTab('search')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'search' ? 'bg-science-50 text-science-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
             <Search size={20} /> {isSidebarOpen && <span className="text-sm">Online Search</span>}
           </button>
           <button onClick={onOpenReviewHub} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 group`}>
             <Target size={20} className="group-hover:scale-110 transition-transform" /> 
             {isSidebarOpen && <span className="text-sm">Review HUB</span>}
           </button>
           <button onClick={onOpenBilling} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-slate-500 hover:bg-blue-50 hover:text-blue-600 group`}>
             <CreditCard size={20} className="group-hover:rotate-12 transition-transform" />
             {isSidebarOpen && <span className="text-sm">Billing Hub</span>}
           </button>

           <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
             <button onClick={onOpenJenhi} className={`w-full flex items-center gap-3 px-3 py-4 rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-200 group relative overflow-hidden`}>
               <div className="absolute inset-0 bg-gradient-to-r from-science-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
               <BrainCircuit size={20} className="relative z-10 text-science-400 group-hover:text-white" />
               {isSidebarOpen && <span className="text-sm font-bold relative z-10">Jenhi Assistant</span>}
             </button>
             <button onClick={onOpenFeedback} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-slate-500 hover:bg-science-50 hover:text-science-600`}>
               <MessageSquareHeart size={18} /> {isSidebarOpen && <span className="text-sm">Share Feedback</span>}
             </button>
             <button onClick={onOpenTutorial} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-slate-400 hover:bg-slate-50 hover:text-slate-900`}>
               <HelpCircle size={18} /> {isSidebarOpen && <span className="text-xs font-black uppercase tracking-widest">Tutorial</span>}
             </button>
             <button onClick={onOpenAbout} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-slate-400 hover:bg-slate-50 hover:text-slate-900`}>
               <Info size={18} /> {isSidebarOpen && <span className="text-xs font-black uppercase tracking-widest">About LabGen</span>}
             </button>
           </div>
        </nav>

        {isSidebarOpen && (
          <div className="mx-4 mb-2 p-4 bg-slate-900 rounded-[24px] border border-white/10 shadow-lg animate-in slide-in-from-bottom-4">
             <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-science-600 rounded text-white"><Sparkles size={10} /></div>
                <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Neural Engine</p>
             </div>
             <p className="text-[10px] font-black text-white tracking-tight uppercase">Gemini 3 Pro Active</p>
             <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-science-500 w-full animate-pulse" />
             </div>
          </div>
        )}

        <div className="p-4 border-t space-y-4">
           {isSidebarOpen && <ApiKeySelector />}
           <div onClick={onOpenProfile} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center overflow-hidden shrink-0">
                {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon size={16} className="text-slate-400" />}
              </div>
              {isSidebarOpen && <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-900 truncate">{user?.name}</p>
                <div className="flex items-center gap-1.5">
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                     {user?.subscriptionStatus === 'pro' ? 'Infinite Tier' : user?.subscriptionStatus === 'basic' ? 'Basic Tier' : 'Guest Tier'}
                   </p>
                </div>
              </div>}
              <button onClick={(e) => { e.stopPropagation(); onSignOut(); }} className="p-2 text-slate-400 hover:text-red-500"><LogOut size={16} /></button>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="text-sm font-black text-slate-900 bg-transparent border-none outline-none w-64 px-3 py-1.5 rounded-xl hover:bg-slate-50" />
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-tighter text-slate-400">
              <CheckCircle2 size={10} className="text-green-500" /> {lastSaved ? `Synced ${lastSaved.toLocaleTimeString()}` : 'Local Buffer'}
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={onSave} className="flex items-center gap-2 px-4 py-2.5 bg-white border text-slate-700 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all"><Save size={14} /> Save</button>
             <button onClick={onOpenExport} disabled={sceneCount === 0} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-science-600 transition-all shadow-xl disabled:opacity-50"><Box size={14} /> Export</button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};