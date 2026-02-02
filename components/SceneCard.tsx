
import React, { useState, useEffect } from 'react';
import { Scene, ImageSize } from '../types';
import { Play, Loader2, Image as ImageIcon, Film, FileAudio, RefreshCw, AlertCircle, CheckCircle2, MoreVertical, Maximize2, MonitorPlay } from 'lucide-react';

interface SceneCardProps {
  scene: Scene;
  imageSize: ImageSize;
  onGenerateImage: (id: string, size: ImageSize) => void;
  onGenerateAudio: (id: string) => void;
  onAnimateVeo: (id: string) => void;
  onPlayAudio: (buffer: AudioBuffer) => AudioBufferSourceNode;
  onOpenPreview: (id: string) => void;
}

const VEO_MESSAGES = [
  "Calibrating fluid dynamics...",
  "Rendering molecular interactions...",
  "Simulating thermodynamic stability...",
  "Optimizing cinematic lighting...",
  "Processing frame sequence...",
  "Encoding 1080p textures..."
];

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  imageSize,
  onGenerateImage,
  onGenerateAudio,
  onAnimateVeo,
  onPlayAudio,
  onOpenPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'script'>('visual');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [veoMessageIndex, setVeoMessageIndex] = useState(0);

  useEffect(() => {
    let interval: any;
    if (scene.isGeneratingVideo) {
      interval = setInterval(() => {
        setVeoMessageIndex((prev) => (prev + 1) % VEO_MESSAGES.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [scene.isGeneratingVideo]);

  const handlePlayAudio = () => {
    if (scene.audioBuffer) {
      setIsPlayingAudio(true);
      const source = onPlayAudio(scene.audioBuffer);
      source.onended = () => setIsPlayingAudio(false);
    }
  };

  return (
    <div className={`group bg-white rounded-2xl shadow-sm border ${scene.error ? 'border-red-200' : 'border-slate-200'} overflow-hidden flex flex-col h-full transition-all hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1`}>
      {/* Header Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-science-600 text-white text-[10px] font-black stadium-shadow">
          {scene.scene_number}
        </span>
        <div className="px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-md border border-white/50 text-[10px] font-bold text-slate-700 uppercase tracking-widest stadium-shadow">
          {scene.videoUrl ? 'Render Complete' : scene.imageUrl ? 'Image Ready' : 'Pending Visual'}
        </div>
      </div>

      {/* Visual Workspace */}
      <div className="relative aspect-video bg-slate-100 overflow-hidden">
        {scene.videoUrl ? (
           <video 
             src={scene.videoUrl} 
             controls 
             className="w-full h-full object-cover"
             poster={scene.imageUrl}
           />
        ) : scene.imageUrl ? (
          <img 
            src={scene.imageUrl} 
            alt={scene.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
            {scene.isGeneratingImage ? (
              <div className="flex flex-col items-center gap-3">
                 <div className="relative">
                   <Loader2 className="animate-spin text-science-500" size={40} />
                   <ImageIcon className="absolute inset-0 m-auto text-science-300" size={16} />
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-science-600 animate-pulse">Generating Scene Assets...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-40">
                <ImageIcon size={48} strokeWidth={1} className="mb-2" />
                <span className="text-xs font-medium">No Visual Rendered</span>
              </div>
            )}
          </div>
        )}

        {/* Video Rendering Overlay */}
        {scene.isGeneratingVideo && (
           <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
             <div className="relative w-16 h-16 mb-6">
               <Loader2 className="animate-spin text-science-400 w-full h-full" strokeWidth={1.5} />
               <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-science-400" size={24} />
             </div>
             <p className="text-white text-xs font-black uppercase tracking-[0.2em] mb-2">Veo Generation</p>
             <p className="text-science-200 text-xs font-medium min-h-[1.5em] transition-all duration-500">{VEO_MESSAGES[veoMessageIndex]}</p>
             <div className="mt-6 w-32 h-1 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-science-500 animate-[progress_30s_ease-in-out_infinite]" />
             </div>
           </div>
        )}

        {/* Action Overlay */}
        {!scene.error && scene.imageUrl && !scene.isGeneratingVideo && (
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            {!scene.videoUrl ? (
              <button
                onClick={() => onAnimateVeo(scene.id)}
                className="bg-white/90 hover:bg-science-600 hover:text-white text-science-600 p-2.5 rounded-xl backdrop-blur-md transition-all stadium-shadow flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
              >
                <Film size={14} /> Render Video
              </button>
            ) : (
              <button
                onClick={() => onOpenPreview(scene.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl backdrop-blur-md transition-all stadium-shadow flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
              >
                <MonitorPlay size={14} /> Full Preview
              </button>
            )}
          </div>
        )}

        {/* Error State */}
        {scene.error && (
          <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
             <AlertCircle className="text-red-500 mb-2" size={32} />
             <p className="text-red-900 text-xs font-bold mb-4">{scene.error}</p>
             <button 
               onClick={() => scene.imageUrl ? onAnimateVeo(scene.id) : onGenerateImage(scene.id, imageSize)}
               className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-200"
             >
               Retry Action
             </button>
          </div>
        )}
      </div>

      {/* Narrative Section */}
      <div className="p-5 flex flex-col flex-1 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex p-0.5 bg-slate-100 rounded-lg">
             <button 
               onClick={() => setActiveTab('visual')}
               className={`px-3 py-1.5 text-[10px] font-black rounded-md transition-all uppercase tracking-tighter ${activeTab === 'visual' ? 'bg-white text-science-600 shadow-sm' : 'text-slate-400'}`}
             >
               Visual Concept
             </button>
             <button 
               onClick={() => setActiveTab('script')}
               className={`px-3 py-1.5 text-[10px] font-black rounded-md transition-all uppercase tracking-tighter ${activeTab === 'script' ? 'bg-white text-science-600 shadow-sm' : 'text-slate-400'}`}
             >
               Narration
             </button>
          </div>
          <div className="flex gap-1.5">
            {scene.audioBuffer && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
            {scene.videoUrl && <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
          </div>
        </div>

        <div className="flex-1 min-h-[80px] mb-6">
          <h4 className="text-xs font-bold text-slate-900 mb-2 truncate group-hover:text-science-600 transition-colors">{scene.title}</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
             {activeTab === 'visual' ? scene.visual_prompt : scene.narration_script}
          </p>
        </div>

        {/* Action Bar */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={() => onGenerateImage(scene.id, imageSize)}
            disabled={scene.isGeneratingImage || scene.isGeneratingVideo}
            className="group/btn py-2.5 px-4 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:border-science-400 hover:text-science-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {scene.isGeneratingImage ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} className="group-hover/btn:rotate-180 transition-transform duration-500" />}
            {scene.imageUrl ? 'Refresh' : 'Visual'}
          </button>
          
          <button
            onClick={() => scene.audioBuffer ? handlePlayAudio() : onGenerateAudio(scene.id)}
            disabled={scene.isGeneratingAudio}
            className={`py-2.5 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 ${
               scene.audioBuffer 
               ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100' 
               : 'bg-slate-900 text-white hover:bg-science-700'
            }`}
          >
            {scene.isGeneratingAudio ? (
              <Loader2 size={12} className="animate-spin" />
            ) : scene.audioBuffer ? (
              isPlayingAudio ? <span className="flex items-center gap-1.5">Playing <span className="flex gap-0.5"><span className="h-2 w-0.5 bg-blue-500 animate-bounce"></span><span className="h-2 w-0.5 bg-blue-500 animate-bounce" style={{animationDelay: '0.1s'}}></span></span></span> : <><Play size={12} fill="currentColor" /> Play</>
            ) : (
              <><FileAudio size={12} /> TTS</>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 95%; }
        }
      `}</style>
    </div>
  );
};
