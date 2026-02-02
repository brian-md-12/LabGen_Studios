
import React, { useState, useEffect } from 'react';
import { X, Download, Music, Check, Loader2, Play, Pause, Search, Sparkles, Cloud, CheckCircle2, AlertCircle, ShieldCheck, ExternalLink, RefreshCw, Beaker, FileSpreadsheet, MonitorPlay, Eye, Box } from 'lucide-react';
import { ExportSettings, MusicTrack, Scene } from '../types';
import * as pixabayService from '../services/pixabayService';
import * as driveService from '../services/driveService';
import * as authService from '../services/authService';
import { ProductionPreviewPlayer } from './ProductionPreviewPlayer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => Promise<void>;
  sceneCount: number;
  protocolSummary: string;
  educationalProtocol?: string;
  learnerReport?: string;
  projectName: string;
  scenes: Scene[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, sceneCount, protocolSummary, educationalProtocol, learnerReport, projectName, scenes }) => {
  const [format, setFormat] = useState<'MP4' | 'MOV'>('MP4');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [activeMood, setActiveMood] = useState<pixabayService.ScientificMood>('Ambient');
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDriveExporting, setIsDriveExporting] = useState(false);
  const [driveProgress, setDriveProgress] = useState<driveService.DriveUploadProgress[]>([]);
  const [driveResult, setDriveResult] = useState<driveService.DriveExportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [hasDriveToken, setHasDriveToken] = useState<boolean | null>(null);
  const [needsScopeRepair, setNeedsScopeRepair] = useState(false);
  const [showProductionPreview, setShowProductionPreview] = useState(false);
  
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleDiscoverMusic();
      checkDriveStatus();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isOpen]);

  const checkDriveStatus = async () => {
    const access = await driveService.hasDriveAccess();
    setHasDriveToken(access);
  };

  const handleDiscoverMusic = async () => {
    if (!protocolSummary) return;
    setIsSearchingMusic(true);
    try {
      const results = await pixabayService.searchMusic(protocolSummary, activeMood);
      setTracks(results);
    } catch (e) {
      console.error("Music discovery failed", e);
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const togglePreview = (track: MusicTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingTrackId === track.id) {
      audioRef.current?.pause();
      setPreviewingTrackId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(track.previewUrl);
      audioRef.current.play();
      setPreviewingTrackId(track.id);
      audioRef.current.onended = () => setPreviewingTrackId(null);
    }
  };

  const handleExportClick = async () => {
    setIsExporting(true);
    const duration = 2000;
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      setProgress(Math.round((i / steps) * 100));
      await new Promise(r => setTimeout(r, duration / steps));
    }
    await onExport({ format, resolution, musicTrack: selectedTrack });
    // Add brief delay to let user see "100%"
    await new Promise(r => setTimeout(r, 500));
    setIsExporting(false);
    onClose();
  };

  const handleDriveAction = async () => {
    setDriveError(null);
    setDriveResult(null);
    if (hasDriveToken === false || needsScopeRepair) {
      setIsDriveExporting(true);
      try {
        // Fix: signInWithGoogle in authService is a mock that takes no arguments
        await authService.signInWithGoogle();
      } catch (err: any) {
        setDriveError(err.message || "Authorization failed.");
        setIsDriveExporting(false);
      }
      return;
    }

    setIsDriveExporting(true);
    try {
      const result = await driveService.exportProjectToDrive(
        projectName,
        protocolSummary,
        educationalProtocol,
        learnerReport,
        scenes,
        setDriveProgress
      );
      setDriveResult(result);
    } catch (err: any) {
      if (err.message === "INSUFFICIENT_SCOPES") {
        setNeedsScopeRepair(true);
        setDriveError("Insufficient permissions.");
      } else {
        setDriveError(err.message || "Drive sync failed.");
      }
    } finally {
      setIsDriveExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[40px] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 p-3 rounded-2xl text-white">
                <Box size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Export Studio</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Final Production Phase</p>
              </div>
            </div>
            <button onClick={onClose} disabled={isExporting || isDriveExporting} className="p-3 bg-white border rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-all hover:rotate-90">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 flex flex-col lg:flex-row gap-12">
            {/* Left Sidebar: Controls & Manifest */}
            <div className="lg:w-1/3 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Production Review</label>
                <button 
                  onClick={() => setShowProductionPreview(true)}
                  className="w-full flex items-center justify-center gap-3 py-6 bg-blue-600 text-white rounded-[32px] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 group"
                >
                  <MonitorPlay size={20} className="group-hover:scale-110 transition-transform" />
                  Preview Full Production
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Archival Pipeline</label>
                <button 
                  onClick={handleDriveAction}
                  disabled={isDriveExporting || isExporting || hasDriveToken === null}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${
                    !!driveResult ? 'bg-white border-2 border-green-600 text-green-700' : 'bg-slate-900 text-white'
                  }`}
                >
                  {isDriveExporting ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
                  {!!driveResult ? 'Sync Complete' : 'Sync to Google Drive'}
                </button>
                {driveError && <p className="text-[9px] text-red-500 font-bold uppercase text-center">{driveError}</p>}
              </div>
              
              <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet size={14} className="text-science-600" /> Manifest Contents
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 px-3 py-2 bg-white rounded-xl border border-slate-100">
                    <CheckCircle2 className="text-green-500" size={14} /> 
                    <span className="flex-1">Raw Protocol Source</span>
                  </div>
                  {educationalProtocol && (
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 px-3 py-2 bg-white rounded-xl border border-slate-100 animate-in slide-in-from-left-2">
                      <CheckCircle2 className="text-green-500" size={14} />
                      <span className="flex-1">Educator Curriculum</span>
                    </div>
                  )}
                  {learnerReport && (
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 px-3 py-2 bg-white rounded-xl border border-slate-100 animate-in slide-in-from-left-2">
                      <CheckCircle2 className="text-green-500" size={14} />
                      <span className="flex-1">Learner Lab Report</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 px-3 py-2 bg-white rounded-xl border border-slate-100">
                    <CheckCircle2 className="text-green-500" size={14} />
                    <span className="flex-1">{scenes.length} Production Assets</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Main Panel: Music & Export Log */}
            <div className="flex-1 space-y-6">
              {(isDriveExporting || driveProgress.length > 0 || !!driveResult) ? (
                <div className="space-y-4 bg-slate-950 p-10 rounded-[40px] border h-full overflow-hidden flex flex-col shadow-2xl">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <Cloud size={14} className="text-blue-500" /> Synchronization Log
                  </h3>
                  {driveResult ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse" />
                        <div className="relative w-24 h-24 bg-green-500/10 border-2 border-green-500/20 rounded-[40px] flex items-center justify-center text-green-500 shadow-2xl">
                          <Check size={48} strokeWidth={3} />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-white font-black text-sm tracking-tight">Project Successfully Archived</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Permanent Drive Sync Established</p>
                      </div>
                      <a href={driveResult.folderUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 shadow-xl transition-all">
                        View Research Hub <ExternalLink size={14} />
                      </a>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-4">
                      {driveProgress.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-[24px] border border-white/5 animate-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${item.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {item.status === 'uploading' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{item.file}</span>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${item.status === 'completed' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                            {item.status === 'uploading' ? 'Syncing' : 'Archived'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <Music size={14} className="text-science-600" /> Scientific Audio Scoring
                    </h3>
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                      {(['Ambient', 'Discovery', 'Cinematic'] as pixabayService.ScientificMood[]).map(mood => (
                        <button 
                          key={mood} 
                          onClick={() => { setActiveMood(mood); handleDiscoverMusic(); }} 
                          className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${activeMood === mood ? 'bg-white text-science-600 shadow-sm' : 'text-slate-400'}`}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isSearchingMusic ? (
                    <div className="grid grid-cols-2 gap-6">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[32px] animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6 max-h-[450px] overflow-y-auto custom-scrollbar pr-4">
                      {tracks.map(track => (
                        <div 
                          key={track.id} 
                          onClick={() => setSelectedTrack(track)} 
                          className={`group relative p-6 rounded-[32px] border-2 transition-all cursor-pointer overflow-hidden ${
                            selectedTrack?.id === track.id ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' : 'bg-slate-50 border-transparent hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-black truncate max-w-[120px]">{track.title}</p>
                            <button 
                              onClick={(e) => togglePreview(track, e)}
                              className={`p-2 rounded-xl transition-all ${
                                selectedTrack?.id === track.id ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-slate-400 hover:text-science-600'
                              }`}
                            >
                              {previewingTrackId === track.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                            </button>
                          </div>
                          <p className={`text-[9px] font-bold uppercase tracking-tight ${selectedTrack?.id === track.id ? 'text-white/40' : 'text-slate-400'}`}>
                            {track.artist}
                          </p>
                          {selectedTrack?.id === track.id && (
                            <div className="absolute bottom-0 right-0 p-3">
                              <CheckCircle2 size={16} className="text-science-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-10 bg-slate-50 border-t flex flex-col items-center">
            <button 
              onClick={handleExportClick} 
              disabled={isExporting || isDriveExporting} 
              className="w-full max-w-xl bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-science-600 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              {isExporting ? `Synthesizing ${progress}%...` : 'Finalize Master Production'}
            </button>
          </div>
        </div>
      </div>

      {showProductionPreview && (
        <ProductionPreviewPlayer 
          isOpen={showProductionPreview} 
          onClose={() => setShowProductionPreview(false)} 
          scenes={scenes} 
          backgroundMusic={selectedTrack} 
        />
      )}
    </>
  );
};
