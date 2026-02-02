
import { useState, useRef, useEffect, useCallback } from 'react';
import { Scene, User, Project, ImageSize } from '../types';

const AUTOSAVE_DELAY = 5000;

export const useProject = (currentUser: User | null, showNotification: (msg: string, type?: any) => void) => {
  const [projectName, setProjectName] = useState('Untitled Experiment');
  const [protocol, setProtocol] = useState('');
  const [educationalProtocol, setEducationalProtocol] = useState<string | undefined>(undefined);
  const [learnerReport, setLearnerReport] = useState<string | undefined>(undefined);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const lastChangeRef = useRef<number>(Date.now());

  const saveProject = useCallback(() => {
    if (!currentUser) return;
    setIsAutosaving(true);
    const project: Project = {
      id: 'active-session',
      name: projectName,
      protocol: protocol,
      educationalProtocol: educationalProtocol,
      learnerReport: learnerReport,
      scenes: scenes.map(({ audioBuffer, ...rest }) => rest),
      lastModified: new Date().toISOString(),
      searchHistory
    };
    localStorage.setItem(`labgen_autosave_${currentUser.id}`, JSON.stringify(project));
    setLastSaved(new Date());
    setTimeout(() => setIsAutosaving(false), 1000);
  }, [currentUser, projectName, protocol, educationalProtocol, learnerReport, scenes, searchHistory]);

  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`labgen_autosave_${currentUser.id}`);
      if (saved) {
        try {
          const parsed: Project = JSON.parse(saved);
          setProjectName(parsed.name);
          setProtocol(parsed.protocol);
          setEducationalProtocol(parsed.educationalProtocol);
          setLearnerReport(parsed.learnerReport);
          setSearchHistory(parsed.searchHistory || []);
          setScenes(parsed.scenes.map(s => ({ 
            ...s, 
            isGeneratingImage: false, 
            isGeneratingAudio: false, 
            isGeneratingVideo: false 
          })));
        } catch (e) {
          console.error("Hydration Error:", e);
        }
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - lastChangeRef.current;
      if (elapsed >= AUTOSAVE_DELAY) saveProject();
    }, 5000);
    return () => clearInterval(timer);
  }, [saveProject]);

  useEffect(() => { lastChangeRef.current = Date.now(); }, [protocol, educationalProtocol, learnerReport, projectName, scenes, searchHistory]);

  const updateScene = (id: string, updates: Partial<Scene>) => setScenes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  
  const addScene = (title: string, visualPrompt: string, narration: string) => { 
    const newScene: Scene = { 
      id: crypto.randomUUID(), 
      scene_number: scenes.length + 1, 
      title, 
      visual_prompt: visualPrompt, 
      narration_script: narration, 
      isGeneratingImage: false, 
      isGeneratingAudio: false, 
      isGeneratingVideo: false 
    }; 
    setScenes(prev => [...prev, newScene]); 
    showNotification(`New scene "${title}" added.`, "success"); 
  };

  const addToHistory = (query: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 3);
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    showNotification("Search history cleared.", "info");
  };

  return {
    projectName, setProjectName,
    protocol, setProtocol,
    educationalProtocol, setEducationalProtocol,
    learnerReport, setLearnerReport,
    scenes, setScenes,
    lastSaved, isAutosaving,
    searchHistory, addToHistory, clearHistory,
    saveProject, updateScene, addScene
  };
};
