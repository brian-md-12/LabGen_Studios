
import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { TutorialContext, TUTORIAL_CONTENT } from '../services/tutorialService';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  context?: TutorialContext;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose, context = 'general' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = TUTORIAL_CONTENT[context];

  if (!isOpen || !steps) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[950] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl p-12 text-center relative flex flex-col items-center border border-white/20">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-600 transition-colors">
          <X size={20} />
        </button>

        <div className="mb-8 animate-float">
           {step.icon}
        </div>

        <div className="space-y-4 mb-10">
           <p className="text-[10px] font-black text-science-500 uppercase tracking-[0.4em]">Step {currentStep + 1} of {steps.length}</p>
           <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{step.title}</h3>
           <p className="text-sm text-slate-500 font-medium leading-relaxed px-4 whitespace-pre-line">{step.desc}</p>
        </div>

        <div className="w-full flex items-center justify-between gap-4 mt-auto">
           <button 
             onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
             disabled={currentStep === 0}
             className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:opacity-0 transition-all"
           >
             <ChevronLeft size={24} />
           </button>

           <div className="flex gap-2">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${currentStep === i ? 'w-8 bg-science-600' : 'w-2 bg-slate-200'}`} />
              ))}
           </div>

           {currentStep === steps.length - 1 ? (
             <button 
               onClick={() => {
                 onClose();
                 setCurrentStep(0);
               }}
               className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-science-600 transition-all flex items-center gap-2 shadow-xl"
             >
               Dismiss <CheckCircle2 size={16} />
             </button>
           ) : (
             <button 
               onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
               className="p-4 rounded-2xl bg-slate-900 text-white hover:bg-science-600 shadow-lg transition-all"
             >
               <ChevronRight size={24} />
             </button>
           )}
        </div>
      </div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
