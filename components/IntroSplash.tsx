
import React, { useEffect, useState } from 'react';
import { FlaskConical, Dna, Atom, Loader2, Circle } from 'lucide-react';

export const IntroSplash: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for fade-out animation
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center bg-[#02040a] transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Cinematic Studio Overlays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 z-50 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%]" />
        
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-science-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />

        {/* Studio Indicators */}
        <div className="absolute top-10 left-10 flex items-center gap-3 animate-in slide-in-from-left-4 duration-1000">
           <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-md">
             <Circle size={8} className="text-red-600 fill-red-600 animate-pulse" />
             <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">REC</span>
           </div>
           <span className="text-[10px] font-mono text-white/20">00:00:00:24</span>
        </div>
        <div className="absolute bottom-10 right-10 flex items-center gap-4 animate-in slide-in-from-right-4 duration-1000 opacity-20">
           <span className="text-[9px] font-mono text-white uppercase tracking-widest">SIGNAL_ACQUISITION_V3</span>
        </div>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Animated Logo Assembly */}
        <div className="relative mb-12">
           <div className="absolute inset-0 bg-science-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
           <div className="w-32 h-32 bg-gradient-to-br from-science-600 to-science-700 rounded-[40px] flex items-center justify-center shadow-[0_30px_60px_rgba(37,99,235,0.3)] relative z-10 animate-in zoom-in-75 duration-1000">
              <FlaskConical size={64} className="text-white animate-float" />
           </div>
           
           {/* Orbiting Elements */}
           <div className="absolute inset-[-60px] border border-science-500/10 rounded-full animate-[spin_15s_linear_infinite]" />
           <div className="absolute inset-[-100px] border border-science-400/5 rounded-full animate-[spin_20s_linear_reverse_infinite]" />
           
           <div className="absolute -top-8 -right-8 text-science-400/20 animate-float" style={{ animationDelay: '0.3s' }}>
             <Dna size={40} />
           </div>
           <div className="absolute -bottom-8 -left-8 text-science-400/20 animate-float" style={{ animationDelay: '1s' }}>
             <Atom size={40} />
           </div>
        </div>

        <div className="text-center space-y-6 relative z-10 px-6">
          <div className="flex items-center justify-center gap-4 animate-in slide-in-from-top-4 duration-1000">
            <div className="h-px w-8 bg-science-900" />
            <span className="text-[10px] font-black text-science-500 uppercase tracking-[0.6em]">ESTABLISHED 2025</span>
            <div className="h-px w-8 bg-science-900" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter animate-in slide-in-from-bottom-8 duration-1000">
              LABGEN <span className="text-science-500 relative">STUDIO<span className="absolute -top-1 -right-4 text-[10px] bg-science-600 px-1.5 py-0.5 rounded text-white tracking-widest">PRO</span></span>
            </h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.4em] opacity-80 animate-in fade-in duration-1000 delay-500">
              Digital Science Cinematics
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-6 pt-4">
            <div className="w-72 h-[1px] bg-white/5 rounded-full overflow-hidden relative">
               <div className="absolute inset-0 bg-science-900/20" />
               <div className="h-full bg-science-500 animate-[progress_3.5s_cubic-bezier(.17,.67,.83,.67)_forwards] shadow-[0_0_10px_#3b82f6]" />
            </div>
            
            <div className="flex items-center gap-3 text-white/20 text-[9px] font-black uppercase tracking-[0.4em]">
              <Loader2 size={12} className="animate-spin text-science-500" />
              Calibrating Multimodal Engines
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          5% { width: 2%; }
          30% { width: 45%; }
          60% { width: 85%; }
          90% { width: 98%; }
          100% { width: 100%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
};
