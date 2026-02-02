
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, ChevronLeft, ChevronRight, Maximize2, SkipForward, SkipBack, Music, Volume2, Monitor, Download, Loader2 } from 'lucide-react';
import { Scene } from '../types';

interface FullPreviewPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  startIndex?: number;
}

export const FullPreviewPlayer: React.FC<FullPreviewPlayerProps> = ({ isOpen, onClose, scenes, startIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [volume, setVolume] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const playableScenes = scenes.filter(s => s.imageUrl || s.videoUrl);
  const currentScene = playableScenes[currentIndex];

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
      setIsPlaying(true);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }
    } else {
      stopCurrentAudio();
      setIsPlaying(false);
    }
  }, [isOpen, startIndex]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const stopCurrentAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
  };

  const playSceneAudio = (scene: Scene) => {
    stopCurrentAudio();
    if (scene.audioBuffer && audioContextRef.current && gainNodeRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      const source = audioContextRef.current.createBufferSource();
      source.buffer = scene.audioBuffer;
      source.connect(gainNodeRef.current);
      source.start();
      audioSourceRef.current = source;
    }
  };

  useEffect(() => {
    if (currentScene && isPlaying) {
      // Small delay to let video start buffering if needed for tighter sync
      const timer = setTimeout(() => {
        playSceneAudio(currentScene);
        if (videoRef.current && currentScene.videoUrl) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      stopCurrentAudio();
      if (videoRef.current) videoRef.current.pause();
    }
  }, [currentIndex, isPlaying, currentScene]);

  const handleEnded = () => {
    if (currentIndex < playableScenes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setCurrentIndex(0);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      for (const scene of playableScenes) {
        const url = scene.videoUrl || scene.imageUrl;
        if (url) {
          const a = document.createElement('a');
          a.href = url;
          a.download = `LabGen_S${scene.scene_number}_${scene.title.replace(/\s+/g, '_')}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          await new Promise(r => setTimeout(r, 300));
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen || playableScenes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[800] bg-black/98 flex flex-col p-6 lg:p-12 animate-in fade-in duration-300 backdrop-blur-2xl">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div className="flex items-center gap-6">
           <div className="bg-science-600 px-5 py-2.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-science-600/30">
             Neural Sequence Preview
           </div>
           <div>
             <h2 className="text-white text-xl font-black tracking-tight uppercase max-w-md truncate">{currentScene?.title || 'Protocol Visualizer'}</h2>
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <span className="text-science-400">Step {currentIndex + 1} of {playableScenes.length}</span>
                {currentScene?.videoUrl ? '• Cinematic Render' : '• Static Projection'}
             </p>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isDownloading ? 'Downloading...' : 'Extract Assets'}
          </button>
          <button onClick={onClose} className="p-4 bg-white/10 rounded-full text-white hover:bg-red-500 transition-all hover:rotate-90">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-10 min-h-0">
        {/* Main Stage */}
        <div className="flex-1 relative bg-slate-900/50 rounded-[56px] border-2 border-white/5 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] group">
          {currentScene?.videoUrl ? (
            <video
              ref={videoRef}
              src={currentScene.videoUrl}
              className="w-full h-full object-contain"
              onEnded={handleEnded}
              autoPlay
            />
          ) : currentScene?.imageUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-12">
               <img src={currentScene.imageUrl} className="w-full h-full object-contain rounded-3xl animate-in zoom-in-95 fade-in duration-1000 shadow-2xl" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700">
               <Loader2 className="animate-spin" size={48} />
            </div>
          )}
          
          {/* Enhanced HUD Controls */}
          <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                 <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="text-white/40 hover:text-white disabled:opacity-10 transition-all transform hover:scale-110 active:scale-95"><SkipBack size={32} fill="currentColor" /></button>
                 <button onClick={() => setIsPlaying(!isPlaying)} className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                   {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1.5" />}
                 </button>
                 <button onClick={() => setCurrentIndex(prev => Math.min(playableScenes.length - 1, prev + 1))} disabled={currentIndex === playableScenes.length - 1} className="text-white/40 hover:text-white disabled:opacity-10 transition-all transform hover:scale-110 active:scale-95"><SkipForward size={32} fill="currentColor" /></button>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end gap-2">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Master Volume</p>
                  <div className="flex items-center gap-3">
                    <Volume2 size={18} className="text-white" />
                    <input 
                      type="range" min="0" max="1" step="0.01" 
                      value={volume} 
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-science-400"
                    />
                  </div>
                </div>
                <button className="p-4 bg-white/10 rounded-3xl text-white hover:bg-white/20 transition-all" onClick={() => videoRef.current?.requestFullscreen()}>
                  <Maximize2 size={24} />
                </button>
              </div>
            </div>
            
            <div className="mt-10 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-science-500 transition-all duration-500 ease-linear shadow-[0_0_20px_rgba(37,99,235,0.5)]" 
                 style={{ width: `${((currentIndex + 1) / playableScenes.length) * 100}%` }} 
               />
            </div>
          </div>
        </div>

        {/* Dynamic Scene Strip */}
        <div className="w-full lg:w-96 flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center justify-between px-2 shrink-0">
            <h3 className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Sequence Strip</h3>
            <span className="text-science-500 text-[10px] font-black">{currentIndex + 1} / {playableScenes.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4">
            {playableScenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-full p-4 rounded-[32px] flex gap-5 transition-all text-left border-2 group/item ${
                  currentIndex === idx 
                  ? 'bg-science-600/20 border-science-500 shadow-2xl scale-[1.02]' 
                  : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                <div className={`w-24 aspect-video rounded-2xl bg-slate-800 overflow-hidden shrink-0 border-2 transition-all ${currentIndex === idx ? 'border-blue-400' : 'border-white/5'}`}>
                  {scene.imageUrl ? (
                    <img src={scene.imageUrl} className={`w-full h-full object-cover transition-opacity ${currentIndex === idx ? 'opacity-100' : 'opacity-40'}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700"><Monitor size={20} /></div>
                  )}
                </div>
                <div className="min-w-0 flex flex-col justify-center space-y-1">
                  <p className={`text-[11px] font-black uppercase tracking-tight truncate ${currentIndex === idx ? 'text-white' : 'text-slate-400'}`}>{scene.title}</p>
                  <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">S{scene.scene_number}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="p-8 bg-slate-900/80 rounded-[48px] border border-white/5 space-y-4 shrink-0">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-science-400 animate-pulse" />
                <p className="text-[10px] font-black text-science-400 uppercase tracking-widest">Narration Feed</p>
             </div>
             <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic line-clamp-4">
               "{currentScene?.narration_script}"
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
