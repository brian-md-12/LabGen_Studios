
import React from 'react';
import { X, FlaskConical, Github, Globe, Heart, ShieldCheck, Cpu, Code2, Linkedin } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden relative flex flex-col border border-white/10">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10">
          <X size={24} />
        </button>

        <div className="p-12 text-center space-y-6">
          <div className="w-24 h-24 bg-science-600 rounded-[40px] mx-auto flex items-center justify-center text-white shadow-2xl animate-float">
             <FlaskConical size={48} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">LabGen Studio</h2>
            <p className="text-[10px] font-black text-science-500 uppercase tracking-[0.4em] mt-2">v5.2 Master Production</p>
          </div>
        </div>

        <div className="px-12 pb-12 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Code2 size={16} className="text-science-600" /> Executive Production
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white border flex items-center justify-center overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin" className="w-full h-full object-cover" />
                </div>
                <div>
                    <p className="text-sm font-black text-slate-900">Kevin Brian</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Creator & Lead Architect</p>
                </div>
              </div>
              <a 
                href="https://www.linkedin.com/in/kevin-brian-416698216" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:scale-110 active:scale-95"
                title="Connect on LinkedIn"
              >
                <Linkedin size={18} />
              </a>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              LabGen was conceived to bridge the gap between complex raw scientific data and cinematic instructional media. By democratizing high-fidelity AI models, we empower the next generation of educators and researchers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-2">
                <h4 className="text-[10px] font-black uppercase text-slate-900">Primary Goal</h4>
                <p className="text-[10px] text-slate-500 font-medium uppercase leading-relaxed tracking-tight">Democratizing Multimodal Scientific Visualization.</p>
             </div>
             <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-2">
                <h4 className="text-[10px] font-black uppercase text-slate-900">Target Audience</h4>
                <p className="text-[10px] text-slate-500 font-medium uppercase leading-relaxed tracking-tight">Educators, Researchers, and Students.</p>
             </div>
          </div>

          <div className="flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all pt-4">
             <ShieldCheck size={20} />
             <Cpu size={20} />
             <Globe size={20} />
             <Heart size={20} className="text-red-500" />
          </div>
        </div>

        <div className="p-8 bg-slate-900 text-white text-center">
           <p className="text-[9px] font-black uppercase tracking-[0.2em]">© 2025 LabGen Studio | Scientific Cinematics Suite</p>
        </div>
      </div>
    </div>
  );
};
