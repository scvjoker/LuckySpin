
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, RotateCcw, Sparkles, Trophy, Settings, 
  PieChart, Users, UserPlus, Sliders, Save, Clock, RefreshCw,
  History, CheckSquare, Square, Check, Image as ImageIcon, X, Edit3
} from 'lucide-react';
import { Prize, Participant, WheelConfig, SpinRecord } from './types';
import { DEFAULT_PRIZES, PRESET_COLORS } from './constants';
import Wheel from './components/Wheel';
import { suggestPrizes } from './services/geminiService';

const STORAGE_KEYS = {
  PRIZES: 'luckyspin_prizes_v4',
  PARTICIPANTS: 'luckyspin_participants_v4',
  CONFIG: 'luckyspin_config_v4',
  HISTORY: 'luckyspin_history_v4'
};

const App: React.FC = () => {
  const [prizes, setPrizes] = useState<Prize[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRIZES);
    return saved ? JSON.parse(saved) : DEFAULT_PRIZES;
  });

  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    return saved ? JSON.parse(saved) : [
      { id: 'p1', name: '大名', entries: 10 },
      { id: 'p2', name: '小王', entries: 5 }
    ];
  });

  const [wheelConfig, setWheelConfig] = useState<WheelConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : { 
      duration: 5, 
      rotations: 8, 
      direction: 'cw',
      title: 'LUCKY SPIN PRO',
      subtitle: '專業 AI 抽獎轉盤系統'
    };
  });

  const [history, setHistory] = useState<SpinRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(participants[0]?.id || '');
  const [participantInput, setParticipantInput] = useState('');
  const [activeTab, setActiveTab] = useState<'prizes' | 'participants' | 'settings'>('prizes');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerResult, setWinnerResult] = useState<{ person: string | null; prize: Prize } | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Persistence
  useEffect(() => localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(prizes)), [prizes]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants)), [participants]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(wheelConfig)), [wheelConfig]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)), [history]);

  const activePrizes = useMemo(() => prizes.filter(p => p.enabled), [prizes]);
  const totalWeight = useMemo(() => activePrizes.reduce((s, p) => s + p.probability, 0), [activePrizes]);
  const currentParticipant = useMemo(() => participants.find(p => p.id === selectedParticipantId), [participants, selectedParticipantId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addPrize = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setPrizes([...prizes, {
      id: newId, label: `新獎項 ${prizes.length + 1}`,
      probability: 10, color: PRESET_COLORS[prizes.length % PRESET_COLORS.length],
      enabled: true
    }]);
  };

  const updatePrize = (id: string, updates: Partial<Prize>) => {
    setPrizes(prizes.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleSpin = () => {
    if (isSpinning || !currentParticipant || currentParticipant.entries <= 0 || activePrizes.length === 0) return;
    setWinnerResult(null);
    setIsSpinning(true);
  };

  const handleSpinEnd = (resultPrize: Prize) => {
    setIsSpinning(false);
    setParticipants(prev => prev.map(p => p.id === selectedParticipantId ? { ...p, entries: Math.max(0, p.entries - 1) } : p));
    const newRecord: SpinRecord = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      person: currentParticipant?.name || '神秘人',
      prizeLabel: resultPrize.label,
      prizeImage: resultPrize.image
    };
    setHistory(prev => [newRecord, ...prev].slice(0, 50));
    setWinnerResult({ person: currentParticipant?.name || '幸運兒', prize: resultPrize });
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row overflow-hidden font-sans">
      
      {/* Left Column: Controls (380px) */}
      <div className="w-full lg:w-[380px] border-r border-slate-800 bg-slate-900/30 flex flex-col shrink-0">
        <div className="flex p-2 gap-1 border-b border-slate-800">
          {[
            { id: 'prizes', label: '獎項', icon: Settings },
            { id: 'participants', label: '名單', icon: Users },
            { id: 'settings', label: '品牌', icon: Edit3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {activeTab === 'prizes' && (
            <div className="space-y-4">
              {prizes.map(prize => (
                <div key={prize.id} className={`bg-slate-900/60 border rounded-2xl p-4 transition-all ${prize.enabled ? 'border-slate-700' : 'border-slate-800 opacity-40'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => updatePrize(prize.id, { enabled: !prize.enabled })} className={prize.enabled ? 'text-violet-500' : 'text-slate-600'}>
                      {prize.enabled ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                    <div className="relative group">
                      {prize.image ? (
                        <div className="relative">
                          <img src={prize.image} className="w-10 h-10 rounded-lg object-cover" />
                          <button onClick={() => updatePrize(prize.id, { image: undefined })} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X className="w-3 h-3 text-white" /></button>
                        </div>
                      ) : (
                        <label className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-700">
                          <ImageIcon className="w-4 h-4 text-slate-500" />
                          <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, (b) => updatePrize(prize.id, { image: b }))} />
                        </label>
                      )}
                    </div>
                    <input type="text" value={prize.label} onChange={e => updatePrize(prize.id, { label: e.target.value })} className="flex-1 bg-transparent text-sm font-bold focus:outline-none" />
                    <button onClick={() => setPrizes(prizes.filter(p => p.id !== prize.id))} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {prize.enabled && (
                    <div className="flex items-center gap-3 pl-8">
                       <input type="color" value={prize.color} onChange={e => updatePrize(prize.id, { color: e.target.value })} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-none" />
                       <input type="number" value={prize.probability} onChange={e => updatePrize(prize.id, { probability: parseInt(e.target.value) || 1 })} className="w-12 bg-slate-950 border border-slate-800 rounded px-1 py-1 text-[10px] text-center" />
                       <div className="flex-1 h-1 bg-slate-800 rounded-full"><div className="h-full bg-violet-500" style={{ width: `${(prize.probability/totalWeight)*100}%` }} /></div>
                       <span className="text-[10px] text-violet-400 font-bold">{((prize.probability/totalWeight)*100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addPrize} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 hover:text-violet-400 hover:border-violet-500/50 font-bold flex items-center justify-center gap-2 transition-all"><Plus className="w-4 h-4" /> 新增獎項</button>
            </div>
          )}

          {activeTab === 'participants' && (
             <div className="space-y-4">
               <textarea value={participantInput} onChange={e => setParticipantInput(e.target.value)} placeholder="分行或逗號分隔輸入姓名..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm h-24 focus:ring-1 focus:ring-violet-500 outline-none" />
               <button onClick={() => {
                 const names = participantInput.split(/[\n,，]/).map(n => n.trim()).filter(n => n);
                 setParticipants([...participants, ...names.map(name => ({ id: Math.random().toString(36).substr(2, 9), name, entries: 1 }))]);
                 setParticipantInput('');
               }} className="w-full bg-violet-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" /> 批量匯入</button>
               <div className="space-y-2">
                 {participants.map(p => (
                   <div key={p.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                     <span className="text-sm font-bold">{p.name}</span>
                     <div className="flex items-center gap-3">
                       <input type="number" value={p.entries} onChange={e => setParticipants(participants.map(pt => pt.id === p.id ? { ...pt, entries: parseInt(e.target.value) || 0 } : pt))} className="w-10 bg-slate-950 border border-slate-800 rounded text-center text-xs py-1 text-violet-400 font-bold" />
                       <button onClick={() => setParticipants(participants.filter(pt => pt.id !== p.id))} className="text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">主標題</label>
                <input type="text" value={wheelConfig.title} onChange={e => setWheelConfig({...wheelConfig, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-violet-500" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">副標題</label>
                <input type="text" value={wheelConfig.subtitle} onChange={e => setWheelConfig({...wheelConfig, subtitle: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-1 focus:ring-violet-500" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">中獎特效圖</label>
                <div className="relative">
                  {wheelConfig.winnerEffectImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-violet-500/50 h-32">
                       <img src={wheelConfig.winnerEffectImage} className="w-full h-full object-cover" />
                       <button onClick={() => setWheelConfig({...wheelConfig, winnerEffectImage: undefined})} className="absolute top-2 right-2 bg-red-500 p-1 rounded-full"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <label className="w-full h-32 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-900 transition-all">
                      <ImageIcon className="w-8 h-8 text-slate-600 mb-2" />
                      <span className="text-xs text-slate-500 font-bold">上傳特效背景圖</span>
                      <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, (b) => setWheelConfig({...wheelConfig, winnerEffectImage: b}))} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle Column: Wheel Showcase */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-10">
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-4xl lg:text-7xl font-black tracking-tighter bg-gradient-to-br from-violet-300 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-2xl">
            {wheelConfig.title}
          </h1>
          <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-xs lg:text-sm">
            {wheelConfig.subtitle}
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 px-8 py-3 rounded-full flex items-center gap-5 shadow-2xl mb-12">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-800 pr-5">當前參加者</span>
          <select 
            value={selectedParticipantId} onChange={(e) => setSelectedParticipantId(e.target.value)} disabled={isSpinning}
            className="bg-transparent text-xl font-black text-violet-400 focus:outline-none cursor-pointer pr-4"
          >
            {participants.length === 0 && <option value="">無參加者</option>}
            {participants.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900">{p.name} (剩餘 {p.entries} 次)</option>
            ))}
          </select>
        </div>

        <Wheel prizes={prizes} config={wheelConfig} isSpinning={isSpinning} onSpinEnd={handleSpinEnd} />

        <button
          onClick={handleSpin}
          disabled={isSpinning || !currentParticipant || currentParticipant.entries <= 0 || activePrizes.length === 0}
          className={`mt-12 px-20 py-6 rounded-[2.5rem] text-3xl font-black transition-all transform active:scale-95 ${
            isSpinning || !currentParticipant || currentParticipant.entries <= 0 || activePrizes.length === 0
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none' 
            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-105 hover:shadow-[0_0_50px_rgba(124,58,237,0.5)] text-white'
          }`}
        >
          {isSpinning ? '轉動中...' : '立即啟動'}
        </button>
      </div>

      {/* Right Column: Persistent History (320px) */}
      <div className="w-full lg:w-[320px] border-l border-slate-800 bg-slate-900/30 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-fuchsia-400" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">中獎紀錄</h2>
          </div>
          <button onClick={() => setHistory([])} className="p-2 hover:bg-slate-800 rounded-lg text-slate-600 hover:text-red-400 transition-colors"><RotateCcw className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
              <Sparkles className="w-8 h-8 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">目前尚無數據</p>
            </div>
          ) : (
            history.map(record => (
              <div key={record.id} className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-right duration-300">
                <div className="shrink-0">
                  {record.prizeImage ? (
                    <img src={record.prizeImage} className="w-12 h-12 rounded-xl object-cover ring-2 ring-violet-500/20" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-violet-400"><Trophy className="w-6 h-6" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-100 truncate">{record.person}</div>
                  <div className="text-[10px] font-bold text-fuchsia-400 mb-1">{record.prizeLabel}</div>
                  <div className="text-[9px] text-slate-600 font-medium">{new Date(record.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 text-center">
           <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">LuckySpin Pro System v4.0</span>
        </div>
      </div>

      {/* High-Impact Result Modal */}
      {winnerResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
          {wheelConfig.winnerEffectImage && (
            <div className="absolute inset-0 opacity-40">
              <img src={wheelConfig.winnerEffectImage} className="w-full h-full object-cover animate-pulse" />
            </div>
          )}
          
          <div className="bg-slate-900 border border-slate-700/50 rounded-[4rem] p-12 max-w-lg w-full text-center relative overflow-hidden animate-in zoom-in duration-700 shadow-[0_0_100px_rgba(139,92,246,0.3)]">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />
            
            <div className="mb-8 flex justify-center">
              {winnerResult.prize.image ? (
                <div className="relative">
                  <img src={winnerResult.prize.image} className="w-40 h-40 rounded-[2.5rem] object-cover border-4 border-violet-500 shadow-2xl animate-bounce" />
                  <Trophy className="absolute -top-4 -right-4 w-12 h-12 text-yellow-400 drop-shadow-lg" />
                </div>
              ) : (
                <div className="w-32 h-32 bg-violet-600/10 rounded-full flex items-center justify-center border border-violet-500/20 animate-pulse">
                  <Trophy className="w-16 h-16 text-violet-400" />
                </div>
              )}
            </div>

            <h3 className="text-xs font-black text-violet-400 mb-3 uppercase tracking-[0.5em]">恭喜獲得獎項</h3>
            <div className="text-5xl font-black text-white mb-8 tracking-tighter leading-tight drop-shadow-lg">
              {winnerResult.prize.label}
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-[2.5rem] py-8 px-6 mb-10 shadow-inner">
              <span className="text-[10px] text-slate-500 font-bold block mb-2 uppercase tracking-[0.3em]">得獎人</span>
              <span className="text-4xl font-black text-fuchsia-400 tracking-tight">{winnerResult.person}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setWinnerResult(null)} className="bg-slate-800 py-5 rounded-[2rem] font-black text-sm hover:bg-slate-700 transition-all active:scale-95">關閉視窗</button>
              <button onClick={() => { setWinnerResult(null); setTimeout(handleSpin, 300); }} className="bg-gradient-to-r from-violet-600 to-indigo-600 py-5 rounded-[2rem] font-black text-sm text-white shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all">
                <RefreshCw className="w-4 h-4" /> 再次抽獎
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        select option { background: #0f172a; color: white; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
      `}</style>
    </div>
  );
};

export default App;
