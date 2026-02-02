
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { Activity, BrainCircuit, Camera, CameraOff, History, Loader2, MessageSquare, Mic, MicOff, RefreshCcw, Search, Sparkles, Terminal, Volume2, Wand2, X, Cpu, Globe, CheckCircle2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Scene } from '../types';
import { decodeAudioData, decodeBase64 } from '../utils/audioUtils';

interface JenhiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  projectName: string;
  currentProtocol: string;
  scenes: Scene[];
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onAddScene: (title: string, visualPrompt: string, narration: string) => void;
}

const FRAME_RATE = 1; 
const JPEG_QUALITY = 0.6;
const MEMORY_KEY = 'jenhi_memory_context';

type TranscriptEntry = { text: string; role: 'user' | 'jenhi' | 'system'; timestamp: number };

export const JenhiAssistant: React.FC<JenhiAssistantProps> = ({ 
  isOpen, 
  onClose, 
  userName,
  projectName,
  currentProtocol, 
  scenes,
  onUpdateScene,
  onAddScene
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptEntry[]>([]);
  const [isJenhiSpeaking, setIsJenhiSpeaking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'searching' | 'editing'>('idle');
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const currentTranscriptionRef = useRef({ user: '', jenhi: '' });

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcription]);

  const getPersistentMemory = useCallback(() => {
    try {
      return localStorage.getItem(MEMORY_KEY) || "No history.";
    } catch {
      return "Memory access restricted.";
    }
  }, []);

  const saveToMemory = useCallback((summary: string) => {
    try {
      const history = localStorage.getItem(MEMORY_KEY) || "";
      const newMemory = `Recent: ${summary}\n${history.substring(0, 500)}`;
      localStorage.setItem(MEMORY_KEY, newMemory);
    } catch (e) {
      console.error("Memory failed", e);
    }
  }, []);

  const tools: FunctionDeclaration[] = [
    {
      name: 'update_scene_content',
      description: 'Update the narration or prompt for an existing laboratory scene.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          sceneNumber: { type: Type.INTEGER, description: 'The index/number of the scene to modify.' },
          narration: { type: Type.STRING, description: 'The revised script for the narrator.' },
          visualPrompt: { type: Type.STRING, description: 'The revised description for image generation.' },
        },
        required: ['sceneNumber'],
      },
    },
    {
      name: 'add_new_scene',
      description: 'Add a brand new step/scene to the laboratory storyboard.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'A short scientific title for the step.' },
          visualPrompt: { type: Type.STRING, description: 'Highly detailed prompt for photorealistic rendering.' },
          narration: { type: Type.STRING, description: 'Clear instructional narration text.' },
        },
        required: ['title', 'visualPrompt', 'narration'],
      },
    },
  ];

  const cleanup = useCallback(() => {
    sessionPromiseRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    setIsConnected(false);
    setIsMicOn(false);
    setIsCameraOn(false);
    setIsJenhiSpeaking(false);
    setStatus('idle');
    nextStartTimeRef.current = 0;
  }, []);

  const connectToJenhi = async () => {
    setError(null);
    setIsSyncing(true);
    try {
      cleanup(); 
      
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      if (!inputAudioContextRef.current) {
        inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isCameraOn });
      streamRef.current = stream;

      const memory = getPersistentMemory();
      
      sessionPromiseRef.current = ai.live.connect({
        // Updated model name to gemini-2.5-flash-native-audio-preview-12-2025 as per guidelines
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          tools: [{ functionDeclarations: tools }],
          systemInstruction: `You are Jenhi, a Senior Scientific Consultant for LabGen Studio. 
          Goal: Help ${userName} build a cinematic scientific production for project "${projectName}". 
          Instructions:
          1. Listen to intent. If the user asks for changes to the storyboard, execute tools immediately.
          2. Decipher technical scientific language and confirm safety protocols.
          3. Tone: Professional, warm, and highly accurate. 
          4. Current Project State: Protocol "${currentProtocol}". ${scenes.length} scenes already mapped.
          5. Historical Context: ${memory}`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsMicOn(true);
            setIsSyncing(false);
            setStatus('listening');
            
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!isMicOn) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
              
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);

            if (isCameraOn) {
              frameIntervalRef.current = window.setInterval(() => {
                if (!videoRef.current || !canvasRef.current || !isConnected) return;
                const canvas = canvasRef.current;
                const video = videoRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0);
                  const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
                  sessionPromiseRef.current?.then(session => {
                    session.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
                  });
                }
              }, 1000 / FRAME_RATE);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentTranscriptionRef.current.user += text;
              setStatus('thinking');
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentTranscriptionRef.current.jenhi += text;
            }

            // Tool handling
            if (message.toolCall?.functionCalls) {
              setStatus('editing');
              for (const fc of message.toolCall.functionCalls) {
                let result = "Neural update complete.";
                if (!fc.args) {
                   result = "Scientific Error: Missing parameters.";
                } else if (fc.name === 'update_scene_content') {
                  const args = fc.args as any;
                  const scene = scenes.find(s => s.scene_number === args.sceneNumber);
                  if (scene) {
                    onUpdateScene(scene.id, { 
                      ...(args.narration && { narration_script: args.narration }), 
                      ...(args.visualPrompt && { visual_prompt: args.visualPrompt }) 
                    });
                  } else {
                    result = "Protocol Error: Scene reference invalid.";
                  }
                } else if (fc.name === 'add_new_scene') {
                  const args = fc.args as any;
                  onAddScene(args.title, args.visualPrompt, args.narration);
                }
                sessionPromiseRef.current?.then(session => {
                  session.sendToolResponse({ functionResponses: { id: fc.id!, name: fc.name!, response: { result } } });
                });
              }
            }

            // Audio Playback
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setIsJenhiSpeaking(true);
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decodeBase64(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsJenhiSpeaking(false);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            // Complete the turn
            if (message.serverContent?.turnComplete) {
              const uText = currentTranscriptionRef.current.user;
              const jText = currentTranscriptionRef.current.jenhi;
              
              if (uText || jText) {
                setTranscription(prev => [
                  ...prev,
                  ...(uText ? [{ text: uText, role: 'user' as const, timestamp: Date.now() }] : []),
                  ...(jText ? [{ text: jText, role: 'jenhi' as const, timestamp: Date.now() }] : [])
                ]);
                if (jText) saveToMemory(jText);
              }
              currentTranscriptionRef.current = { user: '', jenhi: '' };
              setStatus('listening');
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsJenhiSpeaking(false);
              setStatus('listening');
            }
          },
          onerror: (e) => {
            console.error("Live Error:", e);
            setError("Connection Interrupted.");
            cleanup();
          }
        }
      });
    } catch (err: any) {
      setError(err.message || "Init failed.");
      cleanup();
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const StatusIndicator = () => {
    const configs = {
      idle: { label: 'Standby', icon: <Cpu size={12} />, color: 'text-slate-400' },
      listening: { label: 'Analysing Voice', icon: <Mic size={12} />, color: 'text-green-500 animate-pulse' },
      thinking: { label: 'Consulting Brain', icon: <BrainCircuit size={12} />, color: 'text-science-500' },
      searching: { label: 'Grounded Search', icon: <Globe size={12} />, color: 'text-blue-500' },
      editing: { label: 'Refining Storyboard', icon: <Sparkles size={12} />, color: 'text-science-400 animate-bounce' }
    };
    const active = configs[status];
    return (
      <div className={`flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full border border-slate-100 shadow-sm ${active.color}`}>
         {active.icon}
         <span className="text-[8px] font-black uppercase tracking-widest">{active.label}</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[600] w-[400px] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] border-l flex flex-col animate-in slide-in-from-right duration-500">
      {/* Sidebar Header */}
      <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center relative shadow-lg">
            <BrainCircuit className={`text-science-400 ${isConnected ? 'animate-pulse' : ''}`} size={24} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tighter uppercase">JENHI ASSIST</h2>
            <div className="mt-1">
               <StatusIndicator />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={connectToJenhi} disabled={isSyncing} className={`p-2 rounded-lg hover:bg-science-50 text-slate-400 ${isSyncing ? 'animate-spin text-science-600' : ''}`}>
             <RefreshCcw size={18} />
           </button>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500"><X size={20} /></button>
        </div>
      </div>

      {/* Main Transcript Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/20">
        {isCameraOn && isConnected && (
          <div className="aspect-video rounded-3xl overflow-hidden bg-black shadow-xl relative shrink-0">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale brightness-125" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-[8px] font-black uppercase rounded shadow-lg">Lens Grounding</div>
          </div>
        )}

        {!isConnected ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-science-600 animate-float border-2 border-science-100">
              <MessageSquare size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 uppercase">Consultant Offline</h3>
              <p className="text-xs text-slate-500 font-medium px-8">Initialize a Live session to discuss your storyboard or search protocols in real-time.</p>
            </div>
            <button onClick={connectToJenhi} disabled={isSyncing} className="w-full max-w-[280px] py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-science-600 shadow-xl shadow-slate-200">
              {isSyncing ? 'Synchronizing Neural Link...' : 'Initialize Live Session'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="flex items-center gap-2 mb-4">
                <Terminal size={12} className="text-slate-300" />
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Neural Transcript Feed</p>
             </div>

             {transcription.length === 0 && (
               <div className="py-20 flex flex-col items-center justify-center opacity-20 space-y-4">
                  <Activity className="animate-pulse text-science-600" size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Voice Input</p>
               </div>
             )}

             <div className="space-y-6">
               {transcription.map((t, i) => (
                 <div key={i} className={`flex flex-col gap-2 animate-in slide-in-from-bottom-2 ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl text-xs font-medium leading-relaxed ${
                      t.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-br-none' 
                      : 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-bl-none'
                    }`}>
                      {t.text}
                    </div>
                    <span className="text-[8px] font-black text-slate-300 uppercase px-2">
                       {t.role === 'user' ? userName : 'Jenhi Assist'} • {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                 </div>
               ))}
               <div ref={transcriptEndRef} />
             </div>
          </div>
        )}
      </div>

      {/* Control Footer */}
      <div className="p-8 border-t flex flex-col items-center gap-6 bg-white shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-8">
           <button 
             onClick={() => setIsCameraOn(!isCameraOn)} 
             className={`p-4 rounded-2xl transition-all ${isCameraOn ? 'bg-science-100 text-science-600 shadow-inner' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'}`}
             title="Toggle Neural Lens"
           >
             {isCameraOn ? <Camera size={20} /> : <CameraOff size={20} />}
           </button>
           
           <div className="relative group">
             {isJenhiSpeaking && (
               <div className="absolute inset-0 bg-science-500/20 rounded-full blur-xl animate-ping" />
             )}
             <button 
               onClick={() => setIsMicOn(!isMicOn)} 
               disabled={!isConnected}
               className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all relative z-10 ${
                 !isConnected ? 'bg-slate-100 text-slate-200 cursor-not-allowed' : 
                 isMicOn ? 'bg-slate-900 text-white hover:scale-105 active:scale-95' : 'bg-red-50 text-red-500 border-2 border-red-100 hover:bg-red-100'
               }`}
             >
               {isMicOn ? <Mic size={32} /> : <MicOff size={32} />}
             </button>
           </div>

           <button 
             onClick={() => setTranscription([])}
             disabled={transcription.length === 0}
             className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100 transition-all disabled:opacity-20"
             title="Clear Transcript"
           >
             <History size={20} />
           </button>
        </div>
        
        <div className="flex items-center gap-3">
          {isJenhiSpeaking && (
             <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-1 bg-science-500 rounded-full animate-bounce" style={{ height: `${Math.random() * 12 + 4}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
             </div>
          )}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
             {isJenhiSpeaking ? 'Jenhi Transmitting...' : isMicOn ? 'Listening to Intent...' : 'Neural Input Suspended'}
          </p>
        </div>
      </div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
