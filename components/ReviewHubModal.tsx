import React, { useState, useEffect } from 'react';
import { X, GraduationCap, BookOpen, Sparkles, Check, Loader2, Target, Beaker, Atom, Microscope, ArrowRight, BrainCircuit, Globe, Award, ShieldAlert, FileText, LayoutList, RefreshCcw, ShieldCheck, Lock, ExternalLink, Users, FileSpreadsheet, Mail, Clock, Send, ChevronRight, Megaphone, MailCheck } from 'lucide-react';
import { User, Scene } from '../types';
import * as GeminiService from '../services/geminiService';
import * as authService from '../services/authService';
import * as formsService from '../services/formsService';
import * as emailService from '../services/emailService';

interface ReviewHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  projectName: string;
  protocol: string;
  scenes: Scene[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const renderMarkdown = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-4" />;
    if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-black text-slate-900 mt-6 mb-2 uppercase tracking-tight">{line.replace('### ', '')}</h3>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-base font-black text-slate-900 mt-8 mb-3 uppercase tracking-tighter border-b border-slate-100 pb-1">{line.replace('## ', '')}</h2>;
    if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-black text-science-600 mt-4 mb-4 uppercase tracking-widest">{line.replace('# ', '')}</h1>;
    return <p key={i} className="text-xs text-slate-600 font-medium mb-3 leading-relaxed">{line}</p>;
  });
};

export const ReviewHubModal: React.FC<ReviewHubModalProps> = ({ isOpen, onClose, user, onUpdateUser, projectName, protocol, scenes }) => {
  const [isSyncingRole, setIsSyncingRole] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncingForms, setIsSyncingForms] = useState(false);
  const [formLink, setFormLink] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Distribution State
  const [distributionMode, setDistributionMode] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isFetchingRoster, setIsFetchingRoster] = useState(false);
  const [roster, setRoster] = useState<formsService.StudentRecord[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const reviewUses = user.reviewHubUses || 0;
  const isBasic = user.subscriptionStatus === 'basic';
  const hasRemainingUses = !isBasic || reviewUses < 5 || user.isSuperAdmin;

  const handleSelectRole = async (role: 'educator' | 'student') => {
    setIsSyncingRole(true);
    try {
      const updated = await authService.updateUserProfile({ role });
      onUpdateUser(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingRole(false);
    }
  };

  const handleResetRole = async () => {
    setIsSyncingRole(true);
    try {
      const updated = await authService.updateUserProfile({ role: null });
      onUpdateUser(updated);
      setContent(null);
      setQuiz(null);
      setFormLink(null);
      setDistributionMode(false);
      setRoster([]);
      setSentCount(0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingRole(false);
    }
  };

  const handleGenerate = async () => {
    if (!user.role) return;
    if (!hasRemainingUses) {
      setError("TIER LIMIT: Basic researchers are limited to 5 Review HUB generations total.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setContent(null);
    setQuiz(null);
    setFormLink(null);
    setQuizAnswers([]);
    setQuizSubmitted(false);

    try {
      const result = await GeminiService.generateReviewMaterial(
        user.role,
        projectName,
        protocol,
        scenes,
        useSearch
      );

      const updatedUses = reviewUses + 1;
      const updatedUser = await authService.updateUserProfile({ reviewHubUses: updatedUses });
      onUpdateUser(updatedUser);

      if (user.role === 'student') {
        const parsed = JSON.parse(result);
        setQuiz(parsed);
      } else {
        setContent(result);
      }
    } catch (e: any) {
      setError(e.message || "Synthesis failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSyncToForms = async () => {
    if (!protocol) return;
    setIsSyncingForms(true);
    setError(null);
    try {
      const questions = await GeminiService.generateEducatorQuizSchema(projectName, protocol);
      const result = await formsService.createGoogleFormQuiz(projectName, questions, deadline);
      setFormLink(result.responderUri);
    } catch (e: any) {
      setError(e.message || "Failed to sync to Google Forms.");
    } finally {
      setIsSyncingForms(false);
    }
  };

  const handleImportRoster = async () => {
    if (!sheetUrl) return;
    setIsFetchingRoster(true);
    setError(null);
    try {
      const students = await formsService.fetchStudentsFromSheet(sheetUrl);
      setRoster(students);
      if (students.length === 0) setError("No valid student records found in sheet. Ensure Column A is Name and Column B is Email.");
    } catch (e: any) {
      setError(e.message || "Roster import failed.");
    } finally {
      setIsFetchingRoster(false);
    }
  };

  const handleSendSingleEmail = async (student: formsService.StudentRecord) => {
    if (!formLink) return;
    try {
      const subject = `Quiz Posted: ${projectName}`;
      await emailService.sendGmailMessage(student.email, subject, projectName, student.name, formLink, deadline);
    } catch (e: any) {
      setError(`Failed to send email to ${student.email}: ${e.message}`);
    }
  };

  const handleBulkBroadcast = async () => {
    if (!roster.length || !formLink) return;
    setIsBroadcasting(true);
    setError(null);
    setSentCount(0);
    
    try {
      for (const student of roster) {
        await handleSendSingleEmail(student);
        setSentCount(prev => prev + 1);
      }
    } catch (e: any) {
      setError("Broadcast interrupted. Please check your Google account permissions.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    return quizAnswers.reduce((acc, ans, idx) => (ans === quiz[idx].correctIndex ? acc + 1 : acc), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 border-b flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl text-white shadow-lg ${user.role === 'educator' ? 'bg-indigo-600' : user.role === 'student' ? 'bg-cyan-600' : 'bg-slate-900'}`}>
              <BrainCircuit size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Review HUB</h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {user.role ? `${user.role.toUpperCase()} Diagnostic Space` : 'Select production profile'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user.isSuperAdmin && user.role && (
              <button onClick={handleResetRole} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100">
                <RefreshCcw size={12} />
                Dev: Reset Hub
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {error && (
            <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 rounded-[32px] text-red-600 flex items-center gap-4 animate-in shake duration-300">
              <ShieldAlert size={24} className="shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Hub Error Feed</p>
                <p className="text-xs font-bold leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {!user.role ? (
            <div className="h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
               <div className="text-center mb-16 space-y-4">
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Choose Your Path</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                    Review HUB functionality is permanent once chosen. Please select the role that best defines your objective.
                  </p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                  <button onClick={() => handleSelectRole('educator')} className="group relative p-12 rounded-[48px] border-4 border-slate-100 hover:border-indigo-500 bg-white transition-all text-center flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl shadow-indigo-500/10"><GraduationCap size={48} /></div>
                    <div><h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">The Educator</h4><p className="text-[10px] font-bold text-slate-400 uppercase mt-2 leading-relaxed">Design Exams & Deploy to Students</p></div>
                  </button>
                  <button onClick={() => handleSelectRole('student')} className="group relative p-12 rounded-[48px] border-4 border-slate-100 hover:border-cyan-500 bg-white transition-all text-center flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-xl shadow-cyan-500/10"><BookOpen size={48} /></div>
                    <div><h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">The Student</h4><p className="text-[10px] font-bold text-slate-400 uppercase mt-2 leading-relaxed">Self-Diagnostic Interactive MCQs</p></div>
                  </button>
               </div>
            </div>
          ) : user.role === 'educator' && distributionMode ? (
            <div className="animate-in slide-in-from-right-8 duration-500">
               <button onClick={() => setDistributionMode(false)} className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">
                  <ArrowRight size={14} className="rotate-180" /> Return to Synthesis
               </button>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <div className="p-10 bg-slate-50 border-2 border-slate-100 rounded-[48px] space-y-8 shadow-inner">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm"><Users size={24} /></div>
                           <div><h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Roster Configuration</h4><p className="text-[9px] font-bold text-slate-400 uppercase">Target Responder Directory</p></div>
                        </div>

                        <div className="space-y-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Google Sheets Directory URL</label>
                              <div className="flex gap-2">
                                 <input value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} className="flex-1 px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-400 transition-all" placeholder="Paste Sheet URL (Column A: Name, Column B: Email)" />
                                 <button onClick={handleImportRoster} disabled={isFetchingRoster} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50">
                                    {isFetchingRoster ? <Loader2 size={16} className="animate-spin" /> : 'Import'}
                                 </button>
                              </div>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Assessment Deadline (Optional)</label>
                              <div className="relative">
                                 <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                 <input value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-400 transition-all" placeholder="e.g. Friday 5 PM, or 24 Hours" />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="p-8 bg-indigo-50 rounded-[40px] border border-indigo-100 space-y-4">
                        <div className="flex items-center gap-3"><Mail className="text-indigo-600" size={18} /><h5 className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Broadcast Template Manifest</h5></div>
                        <div className="p-6 bg-white/60 rounded-2xl border border-indigo-200/50 italic text-[11px] text-slate-600 leading-relaxed">
                           "Dear [Student Name], The quiz on <strong>{projectName}</strong> is now live{deadline ? ` and due ${deadline}` : ''}. Assessment Portal Link..."
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Broadcast Queue ({roster.length})</h4>
                        {roster.length > 0 && formLink && (
                           <button 
                              onClick={handleBulkBroadcast}
                              disabled={isBroadcasting}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-200 animate-in zoom-in-95 disabled:opacity-50"
                           >
                              {isBroadcasting ? <Loader2 size={12} className="animate-spin" /> : <Megaphone size={12} />}
                              {isBroadcasting ? `Sending... (${sentCount}/${roster.length})` : 'Send to All Students'}
                           </button>
                        )}
                     </div>
                     <div className="bg-white border-2 border-slate-100 rounded-[48px] overflow-hidden shadow-sm h-[500px] flex flex-col">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-4">
                           {roster.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                                 <FileSpreadsheet size={48} />
                                 <p className="text-[10px] font-bold uppercase">No records imported yet.</p>
                              </div>
                           ) : (
                              roster.map((student, i) => (
                                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm uppercase">{student.name.charAt(0)}</div>
                                       <div>
                                          <p className="text-[11px] font-black text-slate-900">{student.name}</p>
                                          <p className="text-[9px] font-bold text-slate-400">{student.email}</p>
                                       </div>
                                    </div>
                                    <button 
                                      onClick={() => handleSendSingleEmail(student)}
                                      disabled={!formLink || isBroadcasting}
                                      className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110 disabled:opacity-50"
                                    >
                                       <Send size={14} />
                                    </button>
                                 </div>
                              ))
                           )}
                        </div>
                        <div className="p-8 bg-slate-50 border-t">
                           {formLink ? (
                              <div className="p-4 bg-white rounded-2xl border-2 border-green-100 flex items-center justify-between shadow-sm animate-in fade-in">
                                 <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><MailCheck size={18} /></div>
                                    <span className="text-[10px] font-black text-slate-900 uppercase">Assessment Provisioned</span>
                                 </div>
                                 <a href={formLink} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-indigo-600 hover:underline uppercase flex items-center gap-1">Open Form <ExternalLink size={10} /></a>
                              </div>
                           ) : (
                              <button 
                                 onClick={handleSyncToForms} 
                                 disabled={isSyncingForms} 
                                 className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-3"
                              >
                                 {isSyncingForms ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                                 1. Provision Forms Context
                              </button>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                      {user.role === 'educator' ? 'Academic Exam Studio' : 'Revision Diagnostic Terminal'}
                    </h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">Project: <span className="text-slate-900">{projectName}</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" className="sr-only peer" checked={useSearch} onChange={() => setUseSearch(!useSearch)} />
                        <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 transition-all" />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4 shadow-sm" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-900">Live Search Support</span>
                    </label>
                    <button onClick={handleGenerate} disabled={isGenerating || !hasRemainingUses} className={`px-8 py-4 rounded-[24px] text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50 ${user.role === 'educator' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}>
                      {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {user.role === 'educator' ? 'Synthesize Exam Paper' : 'Initialize Revision Quiz'}
                    </button>
                  </div>
               </div>

               <div className="min-h-[400px]">
                 {isGenerating ? (
                   <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6">
                      <div className="w-24 h-24 relative"><div className="absolute inset-0 border-4 border-slate-100 rounded-[32px] animate-pulse" /><Loader2 className={`w-full h-full animate-spin ${user.role === 'educator' ? 'text-indigo-600' : 'text-cyan-600'}`} strokeWidth={1} /></div>
                      <div className="space-y-2"><h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Neural Synthesis Active</h4><p className="text-[10px] font-bold text-slate-400 uppercase max-w-xs mx-auto">Gemini is building your {user.role === 'educator' ? 'exam' : 'quiz'} set...</p></div>
                   </div>
                 ) : content ? (
                   <div className="space-y-8 animate-in slide-in-from-bottom-8">
                     <div className="bg-slate-50 border-2 border-slate-100 p-12 rounded-[48px] max-w-4xl mx-auto shadow-sm">
                        <div className="flex justify-between items-start mb-8">
                          <div className="flex items-center gap-4"><div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><FileText size={24} /></div><div><h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Master Assessment Paper</h4><p className="text-[9px] font-bold text-slate-400 uppercase">Includes Authority Answer Key</p></div></div>
                          
                          <div className="flex flex-col items-end gap-3">
                             <button 
                               onClick={() => setDistributionMode(true)} 
                               className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200"
                             >
                               Distribution Terminal <ChevronRight size={14} />
                             </button>
                             <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">Roster Sync & Form Deployment</p>
                          </div>
                        </div>
                        <div className="prose prose-slate max-w-none">{renderMarkdown(content)}</div>
                     </div>
                   </div>
                 ) : quiz ? (
                   <div className="max-w-3xl mx-auto space-y-12">
                      {!quizSubmitted ? (
                        <div className="space-y-8 animate-in slide-in-from-bottom-8">
                          {quiz.map((q, qIdx) => (
                            <div key={qIdx} className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-sm space-y-6">
                               <div className="flex items-start gap-4"><span className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 text-[10px] font-black flex items-center justify-center shrink-0 border border-cyan-100">{qIdx + 1}</span><h4 className="text-sm font-black text-slate-900 leading-relaxed uppercase tracking-tight">{q.question}</h4></div>
                               <div className="grid grid-cols-1 gap-3 pl-12">{q.options.map((opt, oIdx) => (<button key={oIdx} onClick={() => { const newAns = [...quizAnswers]; newAns[qIdx] = oIdx; setQuizAnswers(newAns); }} className={`w-full p-4 rounded-2xl text-left text-xs font-bold transition-all border-2 flex justify-between items-center group ${quizAnswers[qIdx] === oIdx ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-cyan-200'}`}>{opt}<div className={`w-5 h-5 rounded-full border-2 transition-all ${quizAnswers[qIdx] === oIdx ? 'bg-white border-white scale-110' : 'bg-white/50 border-slate-200 group-hover:border-cyan-300'}`} /></button>))}</div>
                            </div>
                          ))}
                          <button onClick={() => setQuizSubmitted(true)} className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-cyan-600 transition-all active:scale-95">Submit Assessment to Hub</button>
                        </div>
                      ) : (
                        <div className="space-y-10 animate-in zoom-in-95 duration-500">
                           <div className="bg-slate-900 p-12 rounded-[56px] text-white flex flex-col items-center text-center space-y-8 shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32" /><div className="w-24 h-24 rounded-[32px] bg-cyan-600 text-white flex items-center justify-center shadow-[0_0_50px_rgba(8,145,178,0.5)]"><Award size={48} /></div><div className="space-y-2"><p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.5em]">Diagnostic Complete</p><h3 className="text-4xl font-black tracking-tighter uppercase">Your Score: {calculateScore()}/{quiz.length}</h3></div><button onClick={handleGenerate} className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-50 transition-all">Generate New Study Set</button></div>
                           <div className="space-y-6">{quiz.map((q, qIdx) => (<div key={qIdx} className={`p-8 rounded-[40px] border-2 space-y-4 ${quizAnswers[qIdx] === q.correctIndex ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}><div className="flex items-center justify-between"><h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{q.question}</h4>{quizAnswers[qIdx] === q.correctIndex ? <Check className="text-green-600" size={20} /> : <ShieldAlert className="text-red-600" size={20} />}</div><div className="space-y-2"><p className="text-[10px] font-bold text-slate-400 uppercase">Scientific Context</p><p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">"{q.explanation}"</p></div></div>))}</div>
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center p-20 space-y-6">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl ${user.role === 'educator' ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-50 text-cyan-600'}`}><Target size={32} /></div>
                      <div className="space-y-2"><h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Ready for Review</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generate diagnostics based on project progress.</p></div>
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};