import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Brain, 
  Zap, 
  Smile, 
  Frown, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Clock,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  History as HistoryIcon,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { Mood, StudentType, Task, AiRecommendation, HistoryEntry, WhatIfResponse } from './types';
import { getRecommendation, getWhatIfConsequences } from './services/ai';

const MOODS: { type: Mood; label: string; icon: any; color: string }[] = [
  { type: 'tired', label: 'Tired', icon: Frown, color: 'bg-blue-100 text-blue-600' },
  { type: 'normal', label: 'Normal', icon: Smile, color: 'bg-gray-100 text-gray-600' },
  { type: 'stressed', label: 'Stressed', icon: AlertCircle, color: 'bg-red-100 text-red-600' },
  { type: 'motivated', label: 'Motivated', icon: Zap, color: 'bg-orange-100 text-orange-600' },
];

const STUDENT_TYPES: StudentType[] = ['Engineering', 'Medical', 'Business', 'Arts', 'Other'];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [mood, setMood] = useState<Mood>('normal');
  const [studentType, setStudentType] = useState<StudentType>('Engineering');
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus Timer States
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showOutcomePanel, setShowOutcomePanel] = useState(false);

  // What If States
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfResponse, setWhatIfResponse] = useState<WhatIfResponse | null>(null);

  // Fetch History on Mount
  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(setHistory)
      .catch(console.error);
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setShowOutcomePanel(true);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Math.random().toString(36).substring(7), text: newTaskText.trim() }]);
    setNewTaskText('');
  };

  const removeTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  const handleGetRecommendation = async (easier = false) => {
    if (tasks.length === 0) { 
      setError("Queue tasks first."); 
      return; 
    }
    
    console.log("Requesting AI recommendation...", { tasks, mood, studentType, historyCount: history.length });
    setIsLoading(true);
    setError(null);
    setWhatIfResponse(null);
    
    try {
      const result = await getRecommendation(tasks, mood, studentType, history, { easierMode: easier });
      console.log("AI Recommendation received:", result);
      setRecommendation(result);
    } catch (err) {
      console.error("AI recommendation error:", err);
      setError(err instanceof Error ? `AI Error: ${err.message}` : "AI Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    setTimeLeft(15 * 60); // 15 mins focus
    setTimerActive(true);
  };

  const logOutcome = async (completed: boolean) => {
    if (!recommendation) return;
    const entry = {
      taskName: recommendation.priorityTask,
      completed,
      mood,
      studentType,
    };
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      fetch('/api/history').then(res => res.json()).then(setHistory);
      setShowOutcomePanel(false);
      setRecommendation(null);
      setTasks(tasks.filter(t => t.text !== recommendation.priorityTask));
    } catch (e) {
      console.error("Log failed");
    }
  };

  const handleWhatIf = async () => {
    if (!recommendation) return;
    setWhatIfLoading(true);
    try {
      const res = await getWhatIfConsequences(recommendation.priorityTask, studentType);
      setWhatIfResponse(res);
    } catch (e) {
      setError("Simulation failed.");
    } finally {
      setWhatIfLoading(false);
    }
  };

  const consistencyScore = history.length > 0 
    ? Math.round((history.filter(h => h.completed).length / history.length) * 100) 
    : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-200 font-sans p-4 md:p-8 flex flex-col overflow-x-hidden">
      {/* Header Navigation */}
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-sm rotate-45 flex items-center justify-center glow-cyan">
            <div className="w-3 h-3 bg-white rounded-full -rotate-45"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">
            AI Life Copilot <span className="text-cyan-500 text-xs align-top ml-1">v2.4</span>
          </h1>
        </div>
        <div className="flex gap-6 items-center">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Consistency Rating</span>
            <span className="text-sm font-medium text-cyan-400 font-mono">{consistencyScore}%</span>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/20 bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 h-1 bg-cyan-500" style={{ width: `${consistencyScore}%` }} />
            {history.length}
          </div>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Panel */}
        <section className="md:col-span-4 space-y-6">
          <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm shadow-2xl">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Mental Parameters</h2>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {MOODS.map((m) => (
                <button
                  key={m.type}
                  onClick={() => setMood(m.type)}
                  className={`px-3 py-3 rounded-xl text-[10px] uppercase font-black transition-all border flex items-center justify-center gap-2
                    ${mood === m.type 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 glow-cyan' 
                      : 'text-slate-500 hover:bg-white/5 border-white/5'}`}
                >
                  <m.icon className="w-3 h-3" />
                  {m.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Queue System</label>
              <div className="relative">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Task entry..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none"
                />
                <button onClick={addTask} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500"><Plus className="w-5 h-5" /></button>
              </div>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-hide">
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center group text-sm">
                    <span className="truncate text-slate-300">{task.text}</span>
                    <button onClick={() => removeTask(task.id)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => handleGetRecommendation()}
              disabled={isLoading || tasks.length === 0}
              className={`w-full py-4 mt-6 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all
                ${isLoading || tasks.length === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-cyan-600 text-white shadow-lg glow-cyan-lg'}`}
            >
              {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Determine Next Step <ArrowRight className="w-4 h-4" /></>}
            </button>
            {tasks.length === 0 && !isLoading && (
              <p className="text-[10px] text-slate-500 text-center mt-2 uppercase tracking-tighter">Add tasks to unlock neural analysis</p>
            )}
          </div>

          {/* Behavior Insights Card */}
          <div className="bg-slate-900/30 border border-white/10 p-5 rounded-2xl">
            <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2"><TrendingUp className="w-3 h-3" />Behavioral Insights</h3>
            {history.length < 3 ? (
               <p className="text-[10px] text-slate-500 italic">"Gathering pattern data. Log 3+ tasks for deep insights."</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400"><Activity className="w-4 h-4" /></div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    {history.filter(h => h.mood === 'tired').length > 2 && "Avoid complex tasks when tired. Your skip rate is high in this state."}
                    {history.filter(h => h.completed).length > 5 && "High efficiency streak detected. Leverage this momentum."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Panel */}
        <section className="md:col-span-8 relative">
          <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-full"></div>
          
          <div className="relative h-full bg-slate-900/40 border border-cyan-500/20 rounded-[40px] p-8 flex flex-col backdrop-blur-xl min-h-[600px] shadow-2xl">
            <AnimatePresence mode="wait">
              {timerActive ? (
                <motion.div key="timer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full space-y-8">
                   <div className="relative">
                      <svg className="w-64 h-64 -rotate-90">
                        <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                        <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={753.98} strokeDashoffset={753.98 - (753.98 * timeLeft) / (15 * 60)} className="text-cyan-500 transition-all duration-1000" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-6xl font-mono font-black text-white">{formatTime(timeLeft)}</span>
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mt-2 animate-pulse">Deep Focus Active</span>
                      </div>
                   </div>
                   <button onClick={() => setTimerActive(false)} className="px-8 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20">Abort Mission</button>
                </motion.div>
              ) : showOutcomePanel ? (
                <motion.div key="outcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className="p-4 bg-cyan-500/10 rounded-full text-cyan-400"><HistoryIcon className="w-12 h-12" /></div>
                  <h2 className="text-3xl font-light">Execution Wrap-up</h2>
                  <p className="text-slate-400 max-w-sm">Did you manage to complete <span className="text-white font-bold">"{recommendation?.priorityTask}"</span>?</p>
                  <div className="flex gap-4">
                    <button onClick={() => logOutcome(true)} className="px-8 py-4 bg-cyan-500 text-black rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:scale-105 transition-transform shadow-lg glow-cyan"><CheckCircle className="w-4 h-4" /> Yes, Finished</button>
                    <button onClick={() => logOutcome(false)} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-white/10 transition-colors"><XCircle className="w-4 h-4" /> Not Yet</button>
                  </div>
                </motion.div>
              ) : recommendation ? (
                <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-10">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-cyan-500 text-black font-black text-[9px] rounded-full uppercase tracking-tighter shadow-lg glow-cyan">Target Locked</span>
                          {recommendation.confidence.energyMatch === 'poor' && <span className="px-3 py-1 bg-orange-500/20 text-orange-400 font-black text-[9px] rounded-full uppercase tracking-tighter">Low Energy Alert</span>}
                       </div>
                       <h2 className="text-4xl md:text-5xl font-light text-white leading-tight">Focus on <span className="font-bold text-cyan-400">{recommendation.priorityTask}</span></h2>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                       <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Strategic Score</span>
                       <div className="text-3xl font-mono text-cyan-500 glow-cyan-text">{recommendation.confidence.score}%</div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                      { l: 'Urgency', v: recommendation.confidence.urgency, i: Clock },
                      { l: 'Energy Match', v: recommendation.confidence.energyMatch, i: Activity },
                      { l: 'Impact', v: recommendation.confidence.impact, i: TrendingUp }
                    ].map(m => (
                      <div key={m.l} className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                        <m.i className="w-4 h-4 text-slate-500 mx-auto mb-2" />
                        <div className="text-[8px] uppercase text-slate-500 font-black tracking-widest">{m.l}</div>
                        <div className={`text-[10px] uppercase font-black px-2 py-1 rounded inline-block mt-1 ${m.v === 'high' || m.v === 'good' ? 'text-cyan-400' : 'text-slate-400'}`}>{m.v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-cyan-500/5 border-l-4 border-cyan-500 p-8 rounded-r-2xl mb-8 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"><Zap className="w-20 h-20 text-cyan-500" /></div>
                    <span className="text-[10px] text-cyan-400 uppercase font-black tracking-widest mb-3 block">Tactical Next Action</span>
                    <p className="text-2xl font-medium text-white italic leading-snug">"{recommendation.nextAction}"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <div className="space-y-3">
                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Brain className="w-3 h-3" />Analysis Logic</h3>
                        <div className="text-xs text-slate-400 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 italic">"{recommendation.reason}"</div>
                     </div>
                     <div className="space-y-3">
                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><ShieldAlert className="w-3 h-3 text-red-400" />Risk Simulation</h3>
                        <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl space-y-2 min-h-[80px] relative">
                          {whatIfResponse ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                               <p className="text-[10px] text-red-200"><span className="font-bold uppercase tracking-tighter mr-1 shadow-red-500">Short-term:</span> {whatIfResponse.shortTerm}</p>
                               <p className="text-[10px] text-slate-400 text-xs italic">Impact: {whatIfResponse.longTerm}</p>
                            </div>
                          ) : (
                            <button onClick={handleWhatIf} disabled={whatIfLoading} className="w-full h-full flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors">
                              {whatIfLoading ? <Loader2 className="animate-spin" /> : "Run Failure Simulation"}
                            </button>
                          )}
                        </div>
                     </div>
                  </div>

                  <div className="mt-auto flex flex-col md:flex-row justify-between items-center bg-black/20 p-4 rounded-3xl border border-white/5 gap-4">
                    <div className="flex gap-4">
                      <button onClick={() => handleGetRecommendation(true)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 transition-colors flex items-center gap-2"><Sparkles className="w-3 h-3" /> Get Easier Version</button>
                      <button onClick={() => setRecommendation(null)} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors flex items-center gap-2"><RotateCcw className="w-3 h-3" /> Dismiss</button>
                    </div>
                    <button onClick={startTimer} className="px-10 py-4 bg-cyan-500 text-black text-[12px] font-black rounded-2xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg glow-cyan flex items-center gap-2">Start Focus Mode <Zap className="w-4 h-4 fill-current" /></button>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-8 opacity-20 group">
                  <div className="w-32 h-32 border-2 border-dashed border-cyan-500/40 rounded-full flex items-center justify-center animate-pulse group-hover:scale-110 transition-transform duration-700">
                    <Brain className="w-12 h-12 text-cyan-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-light tracking-[0.4em] uppercase text-slate-300">Neural Idle</h3>
                    <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest">Awaiting brain-dump input for tactical resolution...</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl w-full mx-auto mt-8 flex flex-col md:flex-row justify-between items-center px-4 py-6 border-t border-white/5 text-[9px] font-mono text-slate-600 uppercase tracking-widest gap-4">
        <div className="flex gap-8 items-center">
          <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div> Engine Operational</div>
          <span>Buffer: Optimized</span>
          <span>Entropy: Low</span>
        </div>
        <div className="text-slate-700">© 2026 AI Life Copilot Systems • Tactical Advantage Enabled</div>
      </footer>
    </div>
  );
}

