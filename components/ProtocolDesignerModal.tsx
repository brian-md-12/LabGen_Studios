
import React, { useState, useRef } from 'react';
import { X, GraduationCap, FileText, Upload, Sparkles, Check, Loader2, BookOpen, Quote, Target, ArrowRight, Eye, Beaker, Atom, Microscope, FileJson, Download } from 'lucide-react';
import { ProtocolTemplate } from '../types';
import * as GeminiService from '../services/geminiService';
import { exportMarkdownAsPDF } from '../utils/exportUtils';

interface ProtocolDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawProtocol: string;
  onDesignComplete: (templatedProtocol: string) => void;
}

type AcademicLevel = 'High School' | 'Undergraduate (Freshman)' | 'Undergraduate (Advanced)' | 'Postgraduate/Research';

// Refined markdown formatter for the preview
const renderMarkdown = (text: string) => {
  if (!text) return null;
  
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-4" />;

    // Headers
    if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-black text-slate-900 mt-6 mb-2 uppercase tracking-tight">{line.replace('### ', '')}</h3>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-base font-black text-slate-900 mt-8 mb-3 uppercase tracking-tighter border-b border-slate-100 pb-1">{line.replace('## ', '')}</h2>;
    if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-black text-science-600 mt-4 mb-4 uppercase tracking-widest">{line.replace('# ', '')}</h1>;
    
    // Bold Processing
    const processBold = (input: string) => {
      const parts = input.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    // Lists
    if (line.trim().match(/^\d+\./)) {
      const num = line.trim().split('.')[0];
      const rest = line.replace(/^\d+\.\s*/, '');
      return (
        <div key={i} className="pl-4 mb-3 flex gap-3">
          <span className="font-black text-science-600 tabular-nums">{num}.</span>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">{processBold(rest)}</p>
        </div>
      );
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const rest = line.replace(/^[-*]\s*/, '');
      return (
        <div key={i} className="pl-6 mb-2 flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-science-300 mt-1.5 shrink-0" />
          <p className="text-xs text-slate-600 font-medium leading-relaxed">{processBold(rest)}</p>
        </div>
      );
    }

    return <p key={i} className="text-xs text-slate-600 font-medium mb-3 leading-relaxed">{processBold(line)}</p>;
  });
};

export const ProtocolDesignerModal: React.FC<ProtocolDesignerModalProps> = ({ isOpen, onClose, rawProtocol, onDesignComplete }) => {
  const [level, setLevel] = useState<AcademicLevel>('Undergraduate (Freshman)');
  const [citationStyle, setCitationStyle] = useState<'ACS' | 'APA' | 'MLA' | 'Template'>('ACS');
  const [isDesigning, setIsDesigning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [designResult, setDesignResult] = useState<string | null>(null);
  const [templateFile, setTemplateFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setTemplateFile({ data: base64, mimeType: file.type, name: file.name });
        setCitationStyle('Template');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartDesign = async () => {
    setIsDesigning(true);
    try {
      const result = await GeminiService.generateStructuredEducationalProtocol(
        rawProtocol,
        { citationStyle, hasTemplateFile: !!templateFile, targetLevel: level },
        templateFile || undefined
      );
      setDesignResult(result);
    } catch (error) {
      console.error("Design failed", error);
    } finally {
      setIsDesigning(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!designResult) return;
    setIsDownloading(true);
    try {
      exportMarkdownAsPDF(`LabGen_${level.replace(/\s+/g, '_')}`, designResult, 'Educator Manual');
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  const handleApply = () => {
    if (designResult) {
      onDesignComplete(designResult);
      setDesignResult(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const levels: { label: AcademicLevel; icon: React.ReactNode }[] = [
    { label: 'High School', icon: <Beaker size={16} /> },
    { label: 'Undergraduate (Freshman)', icon: <Atom size={16} /> },
    { label: 'Undergraduate (Advanced)', icon: <Microscope size={16} /> },
    { label: 'Postgraduate/Research', icon: <GraduationCap size={16} /> }
  ];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 border-b flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-science-600 p-3 rounded-2xl text-white shadow-lg">
              <GraduationCap size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Curriculum Studio</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Autonomous Pedagogical Transformation</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {designResult && (
              <button 
                onClick={() => setDesignResult(null)}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-science-600 transition-colors"
              >
                Back to Settings
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {designResult ? (
            <div className="animate-in zoom-in-95 duration-500">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-green-50 rounded-lg text-green-600">
                     <Check size={18} />
                   </div>
                   <div>
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Document Compiled</h3>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">Branding & Pedagogy Applied</p>
                   </div>
                 </div>
                 <div className="px-4 py-1.5 bg-science-50 text-science-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-science-100">
                   {level} Level
                 </div>
               </div>
               
               <div className="bg-white p-12 rounded-[40px] border-2 border-slate-100 shadow-2xl shadow-slate-200/50 max-h-[500px] overflow-y-auto custom-scrollbar mb-10">
                 <div className="max-w-2xl mx-auto">
                    {renderMarkdown(designResult)}
                 </div>
               </div>

               <div className="p-8 bg-slate-900 rounded-[32px] text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <Sparkles className="text-science-400 shrink-0" size={24} />
                   <div>
                    <p className="text-xs font-black uppercase tracking-widest">Curriculum Ready</p>
                    <p className="text-[10px] font-medium opacity-60">This manual is stored separately and won't disrupt your storyboard metadata.</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={handleDownloadPDF}
                      disabled={isDownloading}
                      className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50"
                    >
                      {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
                    </button>
                 </div>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-science-600" /> Institution Template
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative group border-2 border-dashed rounded-[32px] p-12 text-center transition-all cursor-pointer ${
                      templateFile ? 'bg-science-50 border-science-300' : 'bg-slate-50 border-slate-200 hover:border-science-200 hover:bg-white'
                    }`}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" />
                    <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
                      templateFile ? 'bg-science-600 text-white shadow-xl shadow-science-600/30' : 'bg-white text-slate-300 shadow-sm'
                    }`}>
                      {templateFile ? <FileJson size={36} /> : <Upload size={36} />}
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase">
                      {templateFile ? "Branding DNA Captured" : "Extract Formatting DNA"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight max-w-[200px] mx-auto leading-relaxed">
                      {templateFile ? templateFile.name : "AI will replicate headers, logos, and tone from your reference doc."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Quote size={14} className="text-science-600" /> Scientific Citation
                  </label>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    {['ACS', 'APA', 'MLA', 'Template'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setCitationStyle(style as any)}
                        disabled={style === 'Template' && !templateFile}
                        className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all uppercase tracking-tighter ${
                          citationStyle === style ? 'bg-white text-science-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 disabled:opacity-20'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} className="text-science-600" /> Bloom's Taxonomy Tier
                </label>
                <div className="grid grid-cols-1 gap-4">
                  {levels.map((l) => (
                    <button
                      key={l.label}
                      onClick={() => setLevel(l.label)}
                      className={`flex items-center gap-6 p-6 rounded-[32px] border-2 transition-all text-left group ${
                        level === l.label ? 'bg-science-600 border-science-600 text-white shadow-2xl shadow-science-600/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <div className={`p-4 rounded-2xl transition-colors ${level === l.label ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                        {l.icon}
                      </div>
                      <div className="flex-1">
                        <span className="text-[11px] font-black uppercase tracking-widest block">{l.label}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-tighter opacity-60`}>
                          {l.label === 'High School' ? 'Safety & Discovery focus' : l.label.includes('Freshman') ? 'Technical Proficiency' : 'Critical Analysis'}
                        </span>
                      </div>
                      {level === l.label && <Check size={20} className="text-white" />}
                    </button>
                  ))}
                </div>

                <div className="p-8 bg-blue-50 rounded-[40px] border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles size={16} className="text-science-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-science-800">Autonomous Synthesis</span>
                  </div>
                  <p className="text-[10px] font-bold text-blue-600/70 leading-relaxed uppercase tracking-tight">
                    Gemini will generate high-level learning objectives and theoretical background without requiring manual input.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-10 bg-slate-50 border-t flex flex-col items-center gap-6 shrink-0">
          {designResult ? (
            <button
              onClick={handleApply}
              className="w-full max-w-xl bg-science-600 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl hover:bg-science-700 active:scale-95 flex items-center justify-center gap-4"
            >
              Commit Curriculum to Project <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleStartDesign}
              disabled={isDesigning || !rawProtocol.trim()}
              className="w-full max-w-xl bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl hover:bg-science-600 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {isDesigning ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
              {isDesigning ? "Engineering Curriculum..." : "Generate Educational Protocol"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
