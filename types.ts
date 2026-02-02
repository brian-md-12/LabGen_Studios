
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: 'educator' | 'student'; 
  apiMode?: 'admin' | 'user'; 
  subscriptionStatus?: 'none' | 'basic' | 'pro';
  subscriptionExpiresAt?: string; 
  trialUses?: number; 
  reviewHubUses?: number; // New: track Review Hub usage for Basic tier
  isSuperAdmin?: boolean; 
  provider?: 'local' | 'google';
  createdAt: string;
  // Tutorial completion flags
  tutorialFlags?: {
    general?: boolean;
    curriculum?: boolean;
    report?: boolean;
    export?: boolean;
    review?: boolean;
  };
}

export interface Scene {
  id: string;
  scene_number: number;
  title: string;
  visual_prompt: string;
  narration_script: string;
  isGeneratingImage: boolean;
  isGeneratingAudio: boolean;
  isGeneratingVideo: boolean;
  imageUrl?: string; 
  audioBuffer?: AudioBuffer; 
  videoUrl?: string; 
  error?: string;
}

export interface Project {
  id: string;
  name: string;
  protocol: string;
  educationalProtocol?: string;
  learnerReport?: string;
  scenes: Omit<Scene, 'audioBuffer'>[]; 
  lastModified: string;
  searchHistory: string[];
}

export type ImageSize = '1K' | '2K' | '4K';

export interface MusicTrack {
  id: string;
  title: string;
  tags: string[];
  duration: number;
  audioUrl: string;
  previewUrl: string;
  artist: string;
}

export interface ExportSettings {
  format: 'MP4' | 'MOV';
  resolution: '720p' | '1080p' | '4K';
  musicTrack: MusicTrack | null;
}

/**
 * Interface for generating structured educational manuals.
 */
export interface ProtocolTemplate {
  citationStyle: string;
  hasTemplateFile: boolean;
  targetLevel: string;
}

/**
 * Interface for generating scholarly lab reports.
 */
export interface ReportTemplate {
  citationStyle: string;
  reportType: 'Basic' | 'Advanced';
  additionalContext?: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}
