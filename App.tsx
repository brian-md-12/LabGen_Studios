import React, { useState, useRef, useEffect } from 'react';
import { Scene, ImageSize, User, ExportSettings } from './types';
import * as GeminiService from './services/geminiService';
import * as authService from './services/authService';
import { StudioShell } from './components/layout/StudioShell';
import { SceneCard } from './components/SceneCard';
import { ExportModal } from './components/ExportModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { BillingModal } from './components/BillingModal';
import { JenhiAssistant } from './components/JenhiAssistant';
import { ProtocolDesignerModal } from './components/ProtocolDesignerModal';
import { LearnerReportModal } from './components/LearnerReportModal';
import { ReviewHubModal } from './components/ReviewHubModal';
import { FeedbackModal } from './components/FeedbackModal';
import { AboutModal } from './components/AboutModal';
import { TutorialOverlay } from './components/TutorialOverlay';
import { useProject } from './hooks/useProject';
import { Toast, ToastType } from './components/Toast';
import { IntroSplash } from './components/IntroSplash';
import { FullPreviewPlayer } from './components/FullPreviewPlayer';
import { TutorialContext } from './services/tutorialService';
import { Loader2, Zap, Search, Globe, ExternalLink, ArrowRight, GraduationCap, FileSpreadsheet, FilePlus, Sparkles, Volume2, History, Trash2, Clock } from 'lucide-react';

const App: React.FC = () => {
  // HACKATHON: Default to hardcoded guest user
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [isAccessGranted, setIsAccessGranted] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<'write' | 'search' | 'projects'>('write');
  const [editorMode, setEditorMode] = useState<'raw' | 'curriculum' | 'report'>('raw');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  const [isBatchAudioProcessing, setIsBatchAudioProcessing] = useState(false);
  const [isBatchAssetsProcessing, setIsBatchAssetsProcessing] = useState(false);

  const [modals, setModals] = useState({
    export: false, preview: false, jenhi: false, designer: false, 
    report: false, review: false, billing: false, about: false, 
    tutorial: false, profile: false, feedback: false
  });
  const [tutorialContext, setTutorialContext] = useState<TutorialContext>('general');

  const showNotification = (message: string, type: ToastType = 'info') => setToast({ message, type });
  const project = useProject(currentUser, showNotification);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState({ query: '', result: '', sources: [] as {title: string, uri: string}[], loading: false });

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
  };

  const triggerTutorial = async (context: TutorialContext) => {
    if (!currentUser) return;
    const flags = currentUser.tutorialFlags || {};
    if (!flags[context]) {
      setTutorialContext(context);
      setModals(m => ({ ...m, tutorial: true }));
      const updated = await authService.updateUserProfile({ 
        tutorialFlags: { ...flags, [context]: true } 
      });
      setCurrentUser(updated);
    }
  };

  const handleAnalyze = async () => {
    if (!project.protocol.trim()) return;
    showNotification("Synthesizing storyboard...", "info");
    try {
      const name = await GeminiService.suggestProjectTitle(project.protocol);
      project.setProjectName(name);
      const scenes = await GeminiService.parseProtocolToStoryboard(project.protocol);
      project.setScenes(scenes);
      showNotification(`Storyboard ready: ${scenes.length} steps mapping complete.`, "success");
    } catch (e: any) {
      showNotification(e.message, "error");
    }
  };

  const handleSearch = async (forcedQuery?: string) => {
    const q = forcedQuery || search.query;
    if (!q.trim()) return;
    setSearch(s => ({ ...s, loading: true, result: '', sources: [] }));
    try {
      const { text, sources } = await GeminiService.searchProtocol(q);
      setSearch(s => ({ ...s, result: text, sources, loading: false }));
      project.addToHistory(q);
      showNotification("Grounded results acquired.", "success");
    } catch (e: any) {
      setSearch(s => ({ ...s, loading: false }));
      showNotification(e.message, "error");
    }
  };

  const handleBatch = async (type: 'assets' | 'audio') => {
    if (type === 'audio') setIsBatchAudioProcessing(true);
    else setIsBatchAssetsProcessing(true);
    
    showNotification(`Batch ${type} processing...`, "info");
    initAudioContext();
    
    try {
      for (const scene of project.scenes) {
        if (type === 'audio') {
          if (!scene.audioBuffer) {
            project.updateScene(scene.id, { isGeneratingAudio: true });
            const buf = await GeminiService.generateSceneAudio(scene.narration_script, audioContextRef.current!);
            project.updateScene(scene.id, { audioBuffer: buf, isGeneratingAudio: false });
          }
        } else if (type === 'assets') {
          let url = scene.imageUrl;
          if (!url) {
            project.updateScene(scene.id, { isGeneratingImage: true });
            url = await GeminiService.generateSceneImage(scene.visual_prompt, imageSize);
            project.updateScene(scene.id, { imageUrl: url, isGeneratingImage: false });
          }
          if (!scene.audioBuffer) {
            project.updateScene(scene.id, { isGeneratingAudio: true });
            const buf = await GeminiService.generateSceneAudio(scene.narration_script, audioContextRef.current!);
            project.updateScene(scene.id, { audioBuffer: buf, isGeneratingAudio: false });
          }
          if (url && !scene.videoUrl) {
            project.updateScene(scene.id, { isGeneratingVideo: true });
            const vUrl = await GeminiService.animateSceneWithVeo(scene.visual_prompt, url);
            project.updateScene(scene.id, { videoUrl: vUrl, isGeneratingVideo: false });
          }
        }
      }
      showNotification(`Batch ${type} completed successfully.`, "success");
    } catch (e: any) {
      showNotification(e.message, "error");
    } finally {
      if (type === 'audio') setIsBatchAudioProcessing(false);
      else setIsBatchAssetsProcessing(false);
    }
  };

  const handleExport = async (settings: ExportSettings) => {
    showNotification("Preparing final master production...", "info");
    const exportData = {
      project_meta: {
        name: project.projectName,
        last_modified: new Date().toISOString(),
        settings: { format: settings.format, resolution: settings.resolution }
      },
      content: {
        protocol: project.protocol,
        curriculum: project.educationalProtocol,
        learner_report: project.learnerReport
      },
      storyboard: project.scenes.map(s => ({
        id: s.id,
        scene_number: s.scene_number,
        title: s.title,
        visual_prompt: s.visual_prompt,
        narration: s.narration_script,
        image: s.imageUrl,
        video: s.videoUrl
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LabGen_Master_${project.projectName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Master Production Manifest Downloaded.", "success");
  };

  if (showIntro) return <IntroSplash onComplete={() => setShowIntro(false)} />;

  return (
    <StudioShell
      user={currentUser}
      onSignOut={async () => { await authService.signOut(); setCurrentUser(null); }}
      onOpenBilling={() => setModals(m => ({ ...m, billing: true }))}
      onOpenJenhi={() => setModals(m => ({ ...m, jenhi: true }))}
      onOpenTutorial={() => { setTutorialContext('general'); setModals(m => ({ ...m, tutorial: true })); }}
      onOpenAbout={() => setModals(m => ({ ...m, about: true }))}
      onOpenProfile={() => setModals(m => ({ ...m, profile: true }))}
      onOpenReviewHub={() => { triggerTutorial('review'); setModals(m => ({ ...m, review: true })); }}
      onOpenExport={() => { triggerTutorial('export'); setModals(m => ({ ...m, export: true })); }}
      onOpenFeedback={() => setModals(m => ({ ...m, feedback: true }))}
      onSave={project.saveProject}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      projectName={project.projectName}
      setProjectName={project.setProjectName}
      lastSaved={project.lastSaved}
      sceneCount={project.scenes.length}
    >
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[450px] bg-white border-r overflow-y-auto p-10 shrink-0 custom-scrollbar">
          {activeTab === 'write' ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Workspace Editor</h2>
                <div className="flex items-center gap-2">
                   <button onClick={() => { triggerTutorial('curriculum'); setModals(m => ({ ...m, designer: true })); }} className={`p-2 rounded-lg border transition-all ${project.educationalProtocol ? 'bg-science-600 text-white' : 'text-science-600 hover:bg-science-50'}`} title="Curriculum Studio"><GraduationCap size={20} /></button>
                   <button onClick={() => { triggerTutorial('report'); setModals(m => ({ ...m, report: true })); }} className={`p-2 rounded-lg border transition-all ${project.learnerReport ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`} title="Learner Report Studio"><FileSpreadsheet size={20} /></button>
                   <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-science-600 rounded-lg"><FilePlus size={20} /></button>
                </div>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                <button onClick={() => setEditorMode('raw')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${editorMode === 'raw' ? 'bg-white text-science-600 shadow-sm' : 'text-slate-400'}`}>Steps</button>
                {project.educationalProtocol && <button onClick={() => setEditorMode('curriculum')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${editorMode === 'curriculum' ? 'bg-white text-science-600 shadow-sm' : 'text-slate-400'}`}>Manual</button>}
                {project.learnerReport && <button onClick={() => setEditorMode('report')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${editorMode === 'report' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Report</button>}
              </div>

              <textarea 
                className="w-full h-[550px] p-6 rounded-[32px] border-2 text-sm outline-none bg-slate-50/50 border-slate-50 resize-none shadow-inner"
                value={editorMode === 'raw' ? project.protocol : editorMode === 'curriculum' ? project.educationalProtocol : project.learnerReport}
                onChange={e => {
                  if (editorMode === 'raw') project.setProtocol(e.target.value);
                  else if (editorMode === 'curriculum') project.setEducationalProtocol(e.target.value);
                  else project.setLearnerReport(e.target.value);
                }}
              />
              <button onClick={handleAnalyze} disabled={!project.protocol.trim()} className="w-full py-5 rounded-[24px] bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-science-600 shadow-2xl transition-all active:scale-[0.98]">
                <Zap size={18} /> Synthesize Storyboard
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Online Search</h2>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input value={search.query} onChange={e => setSearch(s => ({ ...s, query: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl text-sm outline-none focus:border-science-400" placeholder="Search Protocols..." />
                </div>
                <button onClick={() => handleSearch()} disabled={search.loading} className="w-full py-4 bg-science-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-science-100 hover:bg-science-700 disabled:opacity-50">
                  {search.loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Initiate Search'}
                </button>
              </div>

              {search.result && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-[10px] font-black uppercase text-slate-400">Grounded Result</h3><button onClick={() => { project.setProtocol(search.result); setActiveTab('write'); }} className="text-science-600 font-black text-[10px] uppercase hover:underline">Apply to project</button></div>
                    <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto custom-scrollbar pr-2">{search.result}</div>
                  </div>
                  {search.sources.length > 0 && (
                    <div className="space-y-3">
                       <h3 className="text-[10px] font-black uppercase text-slate-400 px-1">Retrieved Sources</h3>
                       {search.sources.map((s, idx) => (
                         <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-science-50 group transition-all">
                            <span className="text-[10px] font-bold text-slate-500 group-hover:text-science-600 truncate flex-1">{s.title}</span>
                            <ExternalLink size={12} className="text-slate-300 group-hover:text-science-400" />
                         </a>
                       ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 p-10 overflow-y-auto flex flex-col gap-10 bg-slate-50/30 custom-scrollbar relative">
          {project.scenes.length > 0 && (
            <div className="flex items-center justify-between bg-white/90 backdrop-blur-md shadow-xl p-6 rounded-[32px] border sticky top-0 z-20 transition-all">
               <div className="flex bg-slate-100 rounded-[18px] p-1.5">{(['1K', '2K', '4K'] as ImageSize[]).map((size) => (<button key={size} onClick={() => setImageSize(size)} className={`px-6 py-2 rounded-[14px] text-[10px] font-black transition-all ${imageSize === size ? 'bg-white text-science-600 shadow-sm' : 'text-slate-400'}`}>{size}</button>))}</div>
               <div className="flex gap-4">
                 <button onClick={() => handleBatch('audio')} disabled={isBatchAudioProcessing} className="bg-white border-2 border-slate-100 text-slate-700 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-50">
                   {isBatchAudioProcessing ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} className="text-science-600" />}
                   {isBatchAudioProcessing ? 'Processing...' : 'Batch Audio'}
                 </button>
                 <button onClick={() => handleBatch('assets')} disabled={isBatchAssetsProcessing} className="bg-slate-900 text-white px-8 py-3 rounded-[20px] text-[10px] font-black uppercase flex items-center gap-2 hover:bg-science-600 transition-all shadow-xl disabled:opacity-50">
                   {isBatchAssetsProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-science-400" />}
                   {isBatchAssetsProcessing ? 'Synthesizing...' : 'Batch Assets'}
                 </button>
               </div>
            </div>
          )}
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 pb-24">
            {project.scenes.map((s) => (
              <SceneCard 
                key={s.id} scene={s} imageSize={imageSize} 
                onGenerateImage={(id) => { project.updateScene(id, { isGeneratingImage: true }); GeminiService.generateSceneImage(s.visual_prompt, imageSize).then(url => project.updateScene(id, { imageUrl: url, isGeneratingImage: false })).catch(e => { project.updateScene(id, { error: e.message, isGeneratingImage: false }); }); }} 
                onGenerateAudio={(id) => { initAudioContext(); project.updateScene(id, { isGeneratingAudio: true }); GeminiService.generateSceneAudio(s.narration_script, audioContextRef.current!).then(buf => project.updateScene(id, { audioBuffer: buf, isGeneratingAudio: false })).catch(e => { project.updateScene(id, { error: e.message, isGeneratingAudio: false }); }); }} 
                onAnimateVeo={(id) => { if (!s.imageUrl) return; project.updateScene(id, { isGeneratingVideo: true }); GeminiService.animateSceneWithVeo(s.visual_prompt, s.imageUrl).then(url => project.updateScene(id, { videoUrl: url, isGeneratingVideo: false })).catch(e => { project.updateScene(id, { error: e.message, isGeneratingVideo: false }); }); }} 
                onPlayAudio={buf => { initAudioContext(); const src = audioContextRef.current!.createBufferSource(); src.buffer = buf; src.connect(audioContextRef.current!.destination); src.start(); return src; }} 
                onOpenPreview={() => setModals(m => ({ ...m, preview: true }))} 
              />
            ))}
          </div>
        </div>
      </div>

      <ProfileSettingsModal isOpen={modals.profile} onClose={() => setModals(m => ({ ...m, profile: false }))} user={currentUser!} onUpdate={setCurrentUser} />
      <BillingModal isOpen={modals.billing} onClose={() => setModals(m => ({ ...m, billing: false }))} user={currentUser!} onUpdate={setCurrentUser} />
      <AboutModal isOpen={modals.about} onClose={() => setModals(m => ({ ...m, about: false }))} />
      <TutorialOverlay isOpen={modals.tutorial} onClose={() => setModals(m => ({ ...m, tutorial: false }))} context={tutorialContext} />
      <JenhiAssistant isOpen={modals.jenhi} onClose={() => setModals(m => ({ ...m, jenhi: false }))} userName={currentUser!.name} projectName={project.projectName} currentProtocol={project.protocol} scenes={project.scenes} onUpdateScene={project.updateScene} onAddScene={project.addScene} />
      <FullPreviewPlayer isOpen={modals.preview} onClose={() => setModals(m => ({ ...m, preview: false }))} scenes={project.scenes} />
      <ProtocolDesignerModal isOpen={modals.designer} onClose={() => setModals(m => ({ ...m, designer: false }))} rawProtocol={project.protocol} onDesignComplete={project.setEducationalProtocol} />
      <LearnerReportModal isOpen={modals.report} onClose={() => setModals(m => ({ ...m, report: false }))} rawProtocol={project.protocol} onReportComplete={project.setLearnerReport} />
      <ReviewHubModal isOpen={modals.review} onClose={() => setModals(m => ({ ...m, review: false }))} user={currentUser!} onUpdateUser={setCurrentUser} projectName={project.projectName} protocol={project.protocol} scenes={project.scenes} />
      <ExportModal isOpen={modals.export} onClose={() => setModals(m => ({ ...m, export: false }))} onExport={handleExport} sceneCount={project.scenes.length} protocolSummary={project.protocol} projectName={project.projectName} scenes={project.scenes} />
      <FeedbackModal isOpen={modals.feedback} onClose={() => setModals(m => ({ ...m, feedback: false }))} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </StudioShell>
  );
};

export default App;