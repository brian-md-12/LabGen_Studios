
import React from 'react';
import { 
  BrainCircuit, Sparkles, Layers, Wand2, Box, ListChecks, 
  GraduationCap, FileSpreadsheet, Activity, Globe, ShieldCheck,
  Search, Cpu, Play, Target
} from 'lucide-react';

export type TutorialContext = 'general' | 'curriculum' | 'report' | 'export' | 'review';

export interface TutorialStep {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export const TUTORIAL_CONTENT: Record<TutorialContext, TutorialStep[]> = {
  general: [
    {
      title: "The Neural Laboratory",
      desc: "Welcome to LabGen Studio v5.2. This workspace transforms raw scientific text into cinematic productions.",
      icon: React.createElement(BrainCircuit, { size: 48, className: "text-science-500" })
    },
    {
      title: "Meet Jenhi Assistant",
      desc: "Jenhi is your always-on scientific consultant. She can edit your storyboard, search for protocols, and provide technical guidance via voice or text.",
      icon: React.createElement(Cpu, { size: 48, className: "text-purple-500" })
    },
    {
      title: "Studio Feature Set",
      desc: "• Gemini-Powered Storyboarding\n• 1080p Cinematic Rendering (Veo)\n• Neural TTS Narration\n• Academic Document Synthesis\n• Grounded Research Engine",
      icon: React.createElement(ListChecks, { size: 48, className: "text-amber-500" })
    },
    {
      title: "Master Pipeline",
      desc: "Paste steps, synthesize the storyboard, batch generate your assets, and sync everything to your institutional Google Drive.",
      icon: React.createElement(Activity, { size: 48, className: "text-green-500" })
    }
  ],
  curriculum: [
    {
      title: "Curriculum Studio",
      desc: "Transform simple lab steps into formal educator manuals. Apply academic branding and Bloom's Taxonomy tiers autonomously.",
      icon: React.createElement(GraduationCap, { size: 48, className: "text-indigo-500" })
    },
    {
      title: "Formatting DNA",
      desc: "Upload an existing institutional PDF to teach Gemini your preferred formatting, logo placement, and citation style.",
      icon: React.createElement(Layers, { size: 48, className: "text-science-400" })
    }
  ],
  report: [
    {
      title: "Learner Report Studio",
      desc: "Designed for students to synthesize professional lab reports. Upload raw data sheets or photos of your lab notebook for analysis.",
      icon: React.createElement(FileSpreadsheet, { size: 48, className: "text-blue-500" })
    },
    {
      title: "Advanced Synthesis",
      desc: "Gemini will cross-reference your results with standard scientific constants to perform error analysis and calculate theoretical yields.",
      icon: React.createElement(ShieldCheck, { size: 48, className: "text-science-600" })
    }
  ],
  export: [
    {
      title: "Production Master",
      desc: "Review your entire sequence in full-screen. LabGen v5.2 ensures tight audio-visual synchronization during master playback.",
      icon: React.createElement(Play, { size: 48, className: "text-slate-900" })
    },
    {
      title: "Research Archival",
      desc: "Sync the complete project manifest—protocol, curriculum, report, and video assets—to your Cloud Hub in one click.",
      icon: React.createElement(Box, { size: 48, className: "text-blue-600" })
    }
  ],
  review: [
    {
      title: "Review HUB",
      desc: "Role-bound pedagogical diagnostics. Choose 'Educator' for exam design or 'Student' for interactive revision terminals.",
      icon: React.createElement(Target, { size: 48, className: "text-rose-500" })
    },
    {
      title: "Grounded Sets",
      desc: "Quizzes are built from your actual project data, ensuring students are tested on the specific experiments performed in the studio.",
      icon: React.createElement(Globe, { size: 48, className: "text-cyan-500" })
    }
  ]
};