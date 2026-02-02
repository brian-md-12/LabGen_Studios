
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipForward, SkipBack, Volume2, Monitor, Music, Activity, Terminal } from 'lucide-react';
import { Scene, MusicTrack } from '../types';

interface ProductionPreviewPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  backgroundMusic: MusicTrack | null;
}

export const ProductionPreviewPlayer: React.FC<ProductionPreviewPlayerProps> = ({ 
  isOpen, 
  onClose, 
  scenes, 
  backgroundMusic 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const narrationAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const bgMusicAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);

  const currentScene = scenes[currentIndex];

  useEffect(() => {
    if (isOpen) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }
      
      if (backgroundMusic) {
        bgMusicAudioRef.current = new Audio(backgroundMusic.audioUrl);
        bgMusicAudioRef.current.loop = true;
        bgMusicAudioRef.current.volume = 0.15; 
        bgMusicAudioRef.current.play();
      }
      
      startScene(0);
    }

    return () => {
      stopAllAudio();
      if (bgMusicAudioRef.current) {
        bgMusicAudioRef.current.pause();
        bgMusicAudioRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  const stopAllAudio = () => {
    if (narrationAudioRef.current) {
      try { narrationAudioRef.current.stop(); } catch (e) {}
      narrationAudioRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startScene = async (index: number) => {
    stopAllAudio();
    setCurrentIndex(index);
    setProgress(0);
    
    const scene = scenes[index];
    if (!scene) return;

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    let sceneDuration = 5000; 
    if (scene.audioBuffer) {
      sceneDuration = scene.audioBuffer.duration * 1000;
    }
    setDuration(sceneDuration);

    if (scene.audioBuffer && audioContextRef.current && gainNodeRef.current) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = scene.audioBuffer;
      source.connect(gainNodeRef.current);
      source.start();
      narrationAudioRef.current = source;
    }

    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const p = (elapsed / sceneDuration) * 100;
      if (p < 100) {
        setProgress(p);
        timerRef.current = window.setTimeout(tick, 50);
      } else {
        setProgress(100);
        if (index < scenes.length - 1) {
          startScene(index + 1);
        } else {
          setIsPlaying(false);
        }
      }
    };
    tick();

    if (videoRef.current && scene.videoUrl) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      if (audioContextRef.current) audioContextRef.current.suspend();
      if (bgMusicAudioRef.current) bgMusicAudioRef.current.pause();
      if (videoRef.current) videoRef.current.pause();
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      if (audioContextRef.current) audioContextRef.current.resume();
      if (bgMusicAudioRef.current) bgMusicAudioRef.current.play();
      if (videoRef.current && currentScene.videoUrl) videoRef.current.play();
      startScene(currentIndex);
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (dir: number) => {
    const next = currentIndex + dir;
    if (next >= 0 && next < scenes.length) {
      startScene(next);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col p-6 lg:p-12 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex justify-between items-center mb-10 shrink-0">
        <div className="flex items-center gap-6">
           <div className="bg-blue-600 px-5 py-2.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/30 flex items-center gap-3">
             <Activity size={14} className="animate-pulse" /> Production Master
           </div>
           <div className="space-y-1">
             <h2 className="text-white text-xl font-black tracking-tighter uppercase">{currentScene?.title || 'Sequence Master'}</h2>
             <div className="flex items-center gap-3">
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Master Scene {currentIndex + 1} / {scenes.length}</p>
                {backgroundMusic && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded text-[8px] font-bold text-science-400 uppercase">
                    <Music size={8} /> {backgroundMusic.title}
                  </div>
                )}
             </div>
           </div>
        </div>
        <button onClick={onClose} className="p-4 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-all hover:rotate-90">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-12 min-h-0">
        <div className="flex-1 relative bg-black rounded-[56px] border-4 border-white/5 overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.1)] group">
          {currentScene.videoUrl ? (
            <video
              ref={videoRef}
              src={currentScene.videoUrl}
              className="w-full h-full object-contain"
              playsInline
              muted 
            />
          ) : currentScene.imageUrl ? (
            <div className="w-full h-full relative">
               <img src={currentScene.imageUrl} className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
               <div className="absolute bottom-12 inset-x-0 flex flex-col items-center text-center px-12 space-y-4">
                  <div className="px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest">
                    Static Render Mode
                  </div>
               </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-700">
               <div className="flex flex-col items-center gap-4">
                 <Terminal size={48} strokeWidth={1} />
                 <p className="text-[10px] font-black uppercase tracking-widest">Asset Missing</p>
               </div>
            </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-10">
                 <button onClick={() => skip(-1)} disabled={currentIndex === 0} className="text-white/40 hover:text-white disabled:opacity-5 transition-colors"><SkipBack size={28} fill="currentColor" /></button>
                 <button onClick={togglePlayback} className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-950 hover:scale-110 active:scale-90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                   {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                 </button>
                 <button onClick={() => skip(1)} disabled={currentIndex === scenes.length - 1} className="text-white/40 hover:text-white disabled:opacity-5 transition-colors"><SkipForward size={28} fill="currentColor" /></button>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end gap-2">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Production Volume</p>
                  <div className="flex items-center gap-3">
                    <Volume2 size={20} className="text-white" />
                    <input 
                      type="range" min="0" max="1" step="0.01" 
                      value={volume} 
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-400"
                    />
                  </div>
                </div>
                <button className="p-4 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all" onClick={() => videoRef.current?.requestFullscreen()}>
                  <Monitor size={24} />
                </button>
              </div>
            </div>
            
            <div className="mt-12 space-y-3">
              <div className="flex justify-between text-[9px] font-black text-white/40 uppercase tracking-widest">
                <span>SCENE_START</span>
                <span>PRODUCTION_END</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500 ease-linear shadow-[0_0_15px_rgba(37,99,235,0.8)]" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-96 flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Master Timeline</h3>
            <span className="text-blue-500 text-[10px] font-black">{currentIndex + 1} / {scenes.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4">
            {scenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => startScene(idx)}
                className={`w-full p-5 rounded-[32px] flex gap-5 transition-all text-left border-2 group/item ${
                  currentIndex === idx 
                  ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.1)]' 
                  : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                <div className={`w-28 aspect-video rounded-2xl bg-slate-900 overflow-hidden shrink-0 border-2 transition-all ${currentIndex === idx ? 'border-blue-400' : 'border-white/5 group-hover/item:border-white/20'}`}>
                  {scene.imageUrl ? (
                    <img src={scene.imageUrl} className={`w-full h-full object-cover transition-opacity ${currentIndex === idx ? 'opacity-100' : 'opacity-40 group-hover/item:opacity-60'}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Terminal size={14} className="text-slate-700" /></div>
                  )}
                </div>
                <div className="min-w-0 flex flex-col justify-center space-y-1.5">
                  <p className={`text-[11px] font-black uppercase tracking-tight truncate ${currentIndex === idx ? 'text-white' : 'text-slate-400'}`}>{scene.title}</p>
                  <div className="flex items-center gap-2">
                     <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${currentIndex === idx ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-500'}`}>S{scene.scene_number}</span>
                     {scene.videoUrl && <span className="text-[8px] font-black text-science-400 uppercase tracking-tighter">VEO_SYNC</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-8 bg-slate-900 rounded-[40px] border border-white/5 space-y-4">
             <p className="text-[10px] font-black text-science-400 uppercase tracking-[0.2em]">Narration Script</p>
             <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic">
               "{currentScene?.narration_script}"
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
