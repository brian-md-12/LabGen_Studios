import React, { useState } from 'react';
import { X, MessageSquareHeart, Loader2, Sparkles, ExternalLink } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[850] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden relative flex flex-col h-[90vh] border border-white/20">
        
        {/* Modal Header */}
        <div className="p-10 border-b flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-science-600 rounded-2xl text-white shadow-lg">
              <MessageSquareHeart size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Feedback Hub</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Help refine the LabGen ecosystem</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white border rounded-full text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 shadow-sm">
            <X size={24} />
          </button>
        </div>

        {/* Modal Content - The Form Container */}
        <div className="flex-1 bg-slate-100/30 relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 animate-in fade-in">
              <div className="w-16 h-16 relative">
                 <div className="absolute inset-0 border-4 border-science-100 rounded-2xl animate-pulse" />
                 <Loader2 size={64} className="text-science-600 animate-spin" strokeWidth={1} />
              </div>
              <div className="text-center space-y-2">
                 <p className="text-xs font-black uppercase tracking-widest text-slate-900">Synchronizing Input Channels</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Connecting to Research Registry...</p>
              </div>
            </div>
          )}
          
          <div className={`w-full h-full transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
            <iframe 
              src="https://docs.google.com/forms/d/e/1FAIpQLSc4_rpi1wKeZPyRIrGmM8QoyZrb7Dqyg9Yt51lR2R_I_uh_Xg/viewform?embedded=true" 
              className="w-full h-full border-none"
              onLoad={() => setIsLoading(false)}
            >
              Loading feedback form...
            </iframe>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <Sparkles className="text-science-400" size={18} />
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your responses directly influence the next Neural Update</p>
          </div>
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSc4_rpi1wKeZPyRIrGmM8QoyZrb7Dqyg9Yt51lR2R_I_uh_Xg/viewform" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-science-400 hover:text-white transition-colors"
          >
            Open in new window <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};