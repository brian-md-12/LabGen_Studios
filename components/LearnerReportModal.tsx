
import React, { useState, useRef } from 'react';
import { X, GraduationCap, FileText, Upload, Sparkles, Check, Loader2, BookOpen, Quote, Target, ArrowRight, Eye, Beaker, Atom, Microscope, FileJson, Download, FileSpreadsheet, Database, Layout, MessageSquare, AlertCircle, Info, Trash2 } from 'lucide-react';
import { ReportTemplate } from '../types';
import * as GeminiService from '../services/geminiService';
import { exportMarkdownAsPDF } from '../utils/exportUtils';

interface LearnerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawProtocol: string;
  onReportComplete: (report: string) => void;
}

const renderMarkdown = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-4" />;
    if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-black text-slate-900 mt-6 mb-2 uppercase tracking-tight">{line.replace('### ', '')}</h3>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-base font-black text-slate-900 mt-8 mb-3 uppercase tracking-tighter border-b border-slate-100 pb-1">{line.replace('## ', '')}</h2>;
    if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-black text-blue-600 mt-4 mb-4 uppercase tracking-widest">{line.replace('# ', '')}</h1>;
    
    const processBold = (input: string) => {
      const parts = input.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    if (line.trim().match(/^\d+\./)) {
      const num = line.trim().split('.')[0];
      const rest = line.replace(/^\d+\.\s*/, '');
      return (
        <div key={i} className="pl-4 mb-3 flex gap-3">
          <span className="font-black text-blue-600 tabular-nums">{num}.</span>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">{processBold(rest)}</p>
        </div>
      );
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const rest = line.replace(/^[-*]\s*/, '');
      return (
        <div key={i} className="pl-6 mb-2 flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 shrink-0" />
          <p className="text-xs text-slate-600 font-medium leading-relaxed">{processBold(rest)}</p>
        </div>
      );
    }
    return <p key={i} className="text-xs text-slate-600 font-medium mb-3 leading-relaxed">{processBold(line)}</p>;
  });
};

export const LearnerReportModal: React.FC<LearnerReportModalProps> = ({ isOpen, onClose, rawProtocol, onReportComplete }) => {
  const [reportType, setReportType] = useState<'Basic' | 'Advanced'>('Basic');
  const [citationStyle, setCitationStyle] = useState<'ACS' | 'APA' | 'MLA' | 'Template'>('ACS');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportResult, setReportResult] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ data: string; mimeType: string; name: string }[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Explicitly cast to File[] to fix 'unknown' type errors for file properties
    const files = Array.from(e.target.files || []) as File[];
    const supportedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    
    files.forEach(file => {
      if (!supportedTypes.includes(file.type)) {
        setError(`File "${file.name}" is an unsupported format. Please use PDF or Images (PNG/JPG).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadedFiles(prev => [...prev, { data: base64, mimeType: file.type, name: file.name }]);
        if (reportType === 'Basic') setReportType('Advanced');
        setError(null);
      };
      reader.readAsDataURL(file);
    });
    // Clear input so same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...uploadedFiles];
    updated.splice(index, 1);
    setUploadedFiles(updated);
    if (updated.length === 0) setReportType('Basic');
  };

  const clearAllFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFiles([]);
    setReportType('Basic');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartGeneration = async () => {
    if (!rawProtocol || rawProtocol.trim().length < 10) {
      setError("Workspace Error: Please provide a lab protocol in the main editor before generating a report.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const result = await GeminiService.generateLabReport(
        rawProtocol,
        { citationStyle, reportType, additionalContext },
        uploadedFiles
      );
      setReportResult(result);
    } catch (err: any) {
      console.error("Report generation failed", err);
      if (err.message?.includes("MIME type")) {
        setError("Incompatible Data: One or more uploaded files are not supported. Please ensure you only use PDFs or Images.");
      } else {
        setError(err.message || "Synthesis Engine Error: Gemini failed to process your request. Check your internet connection and API key.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!reportResult) return;
    setIsDownloading(true);
    try {
      exportMarkdownAsPDF(`LabReport_${reportType}`, reportResult, 'Laboratory Report');
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  const handleApply = () => {
    if (reportResult) {
      onReportComplete(reportResult);
      setReportResult(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 border-b flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Learner Report Studio</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Version 4.0: Scholarly Synthesis Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {reportResult && (
              <button onClick={() => setReportResult(null)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                Back to Settings
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {error && (
            <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 rounded-[32px] text-red-600 flex items-center gap-4 animate-in shake duration-300">
              <AlertCircle size={24} className="shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Synthesis Alert</p>
                <p className="text-xs font-bold leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {reportResult ? (
            <div className="animate-in zoom-in-95 duration-500">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-green-50 rounded-lg text-green-600">
                     <Check size={18} />
                   </div>
                   <div>
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Report Synthesized</h3>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">Scholarly Review Complete</p>
                   </div>
                 </div>
                 <div className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-blue-100">
                   {reportType} Mode
                 </div>
               </div>
               
               <div className="bg-white p-12 rounded-[40px] border-2 border-slate-100 shadow-2xl shadow-slate-200/50 max-h-[500px] overflow-y-auto custom-scrollbar mb-10">
                 <div className="max-w-2xl mx-auto">
                    {renderMarkdown(reportResult)}
                 </div>
               </div>

               <div className="p-8 bg-slate-900 rounded-[32px] text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <Sparkles className="text-blue-400 shrink-0" size={24} />
                   <div>
                    <p className="text-xs font-black uppercase tracking-widest">Final Report Ready</p>
                    <p className="text-[10px] font-medium opacity-60">This report includes your data analysis and theoretical grounding.</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={handleDownloadPDF}
                      disabled={isDownloading}
                      className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50"
                    >
                      {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      {isDownloading ? 'Finalizing PDF...' : 'Download PDF'}
                    </button>
                 </div>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Database size={14} className="text-blue-600" /> Lab Data & Results
                    </label>
                    {uploadedFiles.length > 0 && (
                      <button 
                        onClick={clearAllFiles}
                        className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 size={12} /> Clear All
                      </button>
                    )}
                  </div>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative group border-2 border-dashed rounded-[32px] p-8 text-center transition-all cursor-pointer ${
                      uploadedFiles.length > 0 ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200 hover:border-blue-200 hover:bg-white'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileUpload} 
                      multiple 
                      accept=".pdf,image/png,image/jpeg,image/webp" 
                    />
                    <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                      uploadedFiles.length > 0 ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-white text-slate-300 shadow-sm'
                    }`}>
                      {uploadedFiles.length > 0 ? <FileJson size={32} /> : <Upload size={32} />}
                    </div>
                    <h3 className="text-[10px] font-black text-slate-900 uppercase">
                      {uploadedFiles.length > 0 ? `${uploadedFiles.length} Scientific Assets Linked` : "Upload Raw Lab Work"}
                    </h3>
                    <div className="mt-2 flex items-center justify-center gap-1.5 text-blue-600">
                      <Info size={12} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">PDF & Images Only Supported</span>
                    </div>
                    <p className="text-[8px] text-slate-400 font-bold mt-2 uppercase tracking-tight max-w-[250px] mx-auto leading-relaxed">
                      Attach PDFs or clear photos of results. Word/Excel docs are not currently supported by Gemini multimodal processing.
                    </p>
                    {uploadedFiles.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2 justify-center">
                        {uploadedFiles.map((f, i) => (
                          <div key={i} className="group/item flex items-center gap-2 px-2.5 py-1.5 bg-white border border-blue-100 rounded-xl text-[8px] font-bold text-blue-600 truncate max-w-[140px] shadow-sm relative pr-6">
                            <span className="truncate">{f.name}</span>
                            <button 
                              onClick={(e) => removeFile(i, e)}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-red-50 hover:text-red-500 rounded-md transition-all"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} className="text-blue-600" /> Observation Context
                  </label>
                  <textarea 
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Describe any experimental anomalies, specific observations, or requirements from your professor..."
                    className="w-full h-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-medium outline-none focus:bg-white focus:border-blue-200 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} className="text-blue-600" /> Synthesis Depth
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setReportType('Basic')}
                      className={`flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all text-center ${
                        reportType === 'Basic' ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                      }`}
                    >
                      <Layout size={20} />
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest block">Basic Report</span>
                        <span className="text-[8px] font-bold uppercase opacity-60">Theoretical Predictions</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setReportType('Advanced')}
                      className={`flex flex-col items-center gap-3 p-6 rounded-[32px] border-2 transition-all text-center ${
                        reportType === 'Advanced' ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                      }`}
                    >
                      <Database size={20} />
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest block">Advanced LR</span>
                        <span className="text-[8px] font-bold uppercase opacity-60">Data-Centric Review</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Quote size={14} className="text-blue-600" /> Scholarly Citation
                  </label>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    {['ACS', 'APA', 'MLA', 'Template'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setCitationStyle(style as any)}
                        className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all uppercase tracking-tighter ${
                          citationStyle === style ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-blue-50 rounded-[40px] border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles size={16} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-800">Learner Insights</span>
                  </div>
                  <p className="text-[10px] font-bold text-blue-600/70 leading-relaxed uppercase tracking-tight">
                    LabGen v4.0 will automatically perform error analysis and calculate theoretical yield based on standard scientific constants.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-10 bg-slate-50 border-t flex flex-col items-center gap-6 shrink-0">
          {reportResult ? (
            <button
              onClick={handleApply}
              className="w-full max-w-xl bg-blue-600 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-4"
            >
              Commit Report to Project <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleStartGeneration}
              disabled={isGenerating}
              className="w-full max-w-xl bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl hover:bg-blue-600 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
              {isGenerating ? "Synthesizing Report..." : `Generate ${reportType} Lab Report`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
