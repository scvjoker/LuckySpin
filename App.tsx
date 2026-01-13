
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, RotateCcw, Sparkles, Trophy, Settings, 
  PieChart, Users, UserPlus, Sliders, Save, Clock, RefreshCw,
  History, CheckSquare, Square, Check, Image as ImageIcon, X, Edit3,
  Book, Bookmark, PenTool
} from 'lucide-react';
import { Prize, Participant, WheelConfig, SpinRecord } from './types';
import { DEFAULT_PRIZES, PRESET_COLORS } from './constants';
import Wheel from './components/Wheel';
import { suggestPrizes } from './services/geminiService';

const STORAGE_KEYS = {
  PRIZES: 'luckyspin_prizes_wood_v1',
  PARTICIPANTS: 'luckyspin_participants_wood_v1',
  CONFIG: 'luckyspin_config_wood_v1',
  HISTORY: 'luckyspin_history_wood_v1'
};

const App: React.FC = () => {
  const [prizes, setPrizes] = useState<Prize[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRIZES);
    return saved ? JSON.parse(saved) : DEFAULT_PRIZES;
  });

  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    return saved ? JSON.parse(saved) : [
      { id: 'p1', name: '李慕白', entries: 3 },
      { id: 'p2', name: '林黛玉', entries: 1 }
    ];
  });

  const [wheelConfig, setWheelConfig] = useState<WheelConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : { 
      duration: 6, 
      rotations: 10, 
      direction: 'cw',
      title: '案前拾趣',
      subtitle: '一杯香茗，一盤驚喜'
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
    setHistory(prev => [newRecord, ...prev].slice(0, 30));
    setWinnerResult({ person: currentParticipant?.name || '幸運兒', prize: resultPrize });
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden p-6 lg:p-8 gap-8">
      
      {/* Left Column: The Notebook Panel */}
      <div className="w-full lg:w-[400px] paper-texture rounded-xl flex flex-col shrink-0 border-l-[12px] border-[#3d2b1f] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4"><PenTool className="w-5 h-5 text-[#8d7b68] opacity-30" /></div>
        
        <div className="flex border-b border-[#e5e1d3]">
          {[
            { id: 'prizes', label: '賞品', icon: Bookmark },
            { id: 'participants', label: '人名', icon: Users },
            { id: 'settings', label: '裝幀', icon: Edit3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-5 text-xs font-bold uppercase tracking-[0.2em] transition-all ${
                activeTab === tab.id ? 'bg-[#e5e1d3] text-[#2d1b0d]' : 'text-[#8d7b68] hover:bg-[#f5f2e8]'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {activeTab === 'prizes' && (
            <div className="space-y-6">
              <div className="border-b-2 border-dashed border-[#dcd7c9] pb-6">
                 <h3 className="text-[#5c3d2e] font-black text-sm mb-4 flex items-center gap-2 uppercase tracking-widest"><Sparkles className="w-4 h-4" /> AI 靈感庫</h3>
                 <div className="flex gap-2">
                    <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="輸入主題 (如：讀書會)" className="flex-1 bg-white/50 border border-[#dcd7c9] rounded-lg px-4 py-2 text-xs focus:ring-1 focus:ring-[#8d7b68] outline-none" />
                    <button onClick={async () => {
                      setIsGenerating(true);
                      const res = await suggestPrizes(aiTopic);
                      if(res) setPrizes(res.map((s:any, i:number) => ({ id: Math.random().toString(36).substr(2,9), label: s.label, probability: s.probability, color: PRESET_COLORS[i % PRESET_COLORS.length], enabled: true })));
                      setIsGenerating(false);
                    }} className="bg-[#8d7b68] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#5c3d2e]">{isGenerating ? '...' : '生成'}</button>
                 </div>
              </div>

              {prizes.map(prize => (
                <div key={prize.id} className={`group relative transition-all ${prize.enabled ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                  <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => setPrizes(prizes.map(p => p.id === prize.id ? {...p, enabled: !p.enabled} : p))} className="text-[#8d7b68]">
                      {prize.enabled ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                    <label className="shrink-0 w-10 h-10 rounded-full border-2 border-[#dcd7c9] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#8d7b68] bg-white">
                      {prize.image ? <img src={prize.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-[#dcd7c9]" />}
                      <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, (b) => setPrizes(prizes.map(p => p.id === prize.id ? {...p, image: b} : p)))} />
                    </label>
                    <input type="text" value={prize.label} onChange={e => setPrizes(prizes.map(p => p.id === prize.id ? {...p, label: e.target.value} : p))} className="flex-1 bg-transparent text-sm font-bold text-[#2d1b0d] border-b border-transparent focus:border-[#8d7b68] outline-none serif" />
                    <button onClick={() => setPrizes(prizes.filter(p => p.id !== prize.id))} className="text-[#dcd7c9] hover:text-[#9a3b3b] opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {prize.enabled && (
                    <div className="pl-12 flex items-center gap-3">
                       <input type="color" value={prize.color} onChange={e => setPrizes(prizes.map(p => p.id === prize.id ? {...p, color: e.target.value} : p))} className="w-5 h-5 cursor-pointer bg-transparent border-none rounded" />
                       <div className="flex-1 h-0.5 bg-[#e5e1d3]"><div className="h-full bg-[#8d7b68]" style={{width: `${(prize.probability/totalWeight)*100}%`}} /></div>
                       <input type="number" value={prize.probability} onChange={e => setPrizes(prizes.map(p => p.id === prize.id ? {...p, probability: parseInt(e.target.value)||1} : p))} className="w-10 text-[10px] bg-white border border-[#dcd7c9] text-center rounded py-1 font-bold text-[#5c3d2e]" />
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setPrizes([...prizes, { id: Math.random().toString(36).substr(2,9), label: '新賞品', probability: 10, color: PRESET_COLORS[prizes.length % 10], enabled: true }])} className="w-full py-4 border-2 border-dashed border-[#dcd7c9] rounded-xl text-[#8d7b68] hover:text-[#5c3d2e] hover:border-[#8d7b68] font-bold text-xs flex items-center justify-center gap-2 transition-all"><Plus className="w-4 h-4" /> 增加項目</button>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-6">
              <div className="bg-[#f5f2e8] p-5 rounded-xl border border-[#e5e1d3]">
                 <p className="text-[10px] font-black text-[#8d7b68] uppercase tracking-widest mb-3">名冊登錄</p>
                 <textarea value={participantInput} onChange={e => setParticipantInput(e.target.value)} placeholder="每行一位姓名..." className="w-full bg-white border border-[#dcd7c9] rounded-lg p-4 text-sm h-32 focus:ring-1 focus:ring-[#8d7b68] outline-none serif" />
                 <button onClick={() => {
                   const names = participantInput.split(/[\n,，]/).map(n => n.trim()).filter(n => n);
                   setParticipants([...participants, ...names.map(name => ({ id: Math.random().toString(36).substr(2,9), name, entries: 1 }))]);
                   setParticipantInput('');
                 }} className="w-full bg-[#8d7b68] text-white py-3 rounded-lg font-bold text-xs mt-3 hover:bg-[#5c3d2e]"><UserPlus className="w-4 h-4 inline mr-2" /> 載入名冊</button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                 {participants.map(p => (
                   <div key={p.id} className="bg-white/40 border border-[#e5e1d3] p-4 rounded-xl flex justify-between items-center group">
                     <span className="text-sm font-bold text-[#2d1b0d] serif">{p.name}</span>
                     <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2">
                         <span className="text-[9px] font-bold text-[#8d7b68]">剩餘次數</span>
                         <input type="number" value={p.entries} onChange={e => setParticipants(participants.map(pt => pt.id === p.id ? {...pt, entries: parseInt(e.target.value)||0} : pt))} className="w-10 bg-white border border-[#dcd7c9] text-center text-xs py-1 text-[#8d7b68] font-black rounded" />
                       </div>
                       <button onClick={() => setParticipants(participants.filter(pt => pt.id !== p.id))} className="text-[#dcd7c9] hover:text-[#9a3b3b]"><Trash2 className="w-4 h-4" /></button>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[#8d7b68] uppercase tracking-[0.3em]">堂號 (主標題)</label>
                <input type="text" value={wheelConfig.title} onChange={e => setWheelConfig({...wheelConfig, title: e.target.value})} className="w-full bg-white border border-[#dcd7c9] rounded-xl p-4 text-sm focus:ring-1 focus:ring-[#8d7b68] serif font-black" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[#8d7b68] uppercase tracking-[0.3em]">聯語 (副標題)</label>
                <input type="text" value={wheelConfig.subtitle} onChange={e => setWheelConfig({...wheelConfig, subtitle: e.target.value})} className="w-full bg-white border border-[#dcd7c9] rounded-xl p-4 text-xs focus:ring-1 focus:ring-[#8d7b68] serif" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[#8d7b68] uppercase tracking-[0.3em]">慶賀背景圖</label>
                <div className="relative group">
                  {wheelConfig.winnerEffectImage ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-[#8d7b68] h-40">
                       <img src={wheelConfig.winnerEffectImage} className="w-full h-full object-cover" />
                       <button onClick={() => setWheelConfig({...wheelConfig, winnerEffectImage: undefined})} className="absolute top-2 right-2 bg-[#9a3b3b] text-white p-2 rounded-full shadow-lg"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <label className="w-full h-40 border-2 border-dashed border-[#dcd7c9] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#f5f2e8] transition-all">
                      <ImageIcon className="w-8 h-8 text-[#dcd7c9] mb-2" />
                      <span className="text-xs text-[#8d7b68] font-bold">上傳宣紙背景或特效圖</span>
                      <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, (b) => setWheelConfig({...wheelConfig, winnerEffectImage: b}))} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle Column: The Desk Surface */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-5xl lg:text-7xl font-black tracking-widest text-[#fcfaf2] drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] serif">
            {wheelConfig.title}
          </h1>
          <p className="text-[#8d7b68] font-bold tracking-[0.6em] uppercase text-xs lg:text-base serif italic">
            {wheelConfig.subtitle}
          </p>
        </div>

        <div className="bg-[#fcfaf2]/10 backdrop-blur-md border border-[#fcfaf2]/20 px-10 py-4 rounded-full flex items-center gap-6 shadow-2xl mb-12">
          <span className="text-[10px] font-black text-[#fcfaf2]/60 uppercase tracking-[0.4em] border-r border-[#fcfaf2]/20 pr-6">當前參加者</span>
          <select 
            value={selectedParticipantId} onChange={(e) => setSelectedParticipantId(e.target.value)} disabled={isSpinning}
            className="bg-transparent text-2xl font-black text-[#fcfaf2] focus:outline-none cursor-pointer serif"
          >
            {participants.length === 0 && <option value="">未登錄名冊</option>}
            {participants.map(p => (
              <option key={p.id} value={p.id} className="bg-[#2d1b0d]">{p.name} (剩餘 {p.entries} 次)</option>
            ))}
          </select>
        </div>

        <Wheel prizes={prizes} config={wheelConfig} isSpinning={isSpinning} onSpinEnd={handleSpinEnd} />

        <button
          onClick={() => { if(!isSpinning && currentParticipant && currentParticipant.entries > 0 && activePrizes.length > 0) { setWinnerResult(null); setIsSpinning(true); }}}
          disabled={isSpinning || !currentParticipant || currentParticipant.entries <= 0 || activePrizes.length === 0}
          className={`mt-14 px-24 py-6 rounded-2xl text-3xl font-black serif tracking-widest transition-all transform shadow-[0_15px_30px_-5px_rgba(0,0,0,0.6)] active:scale-95 ${
            isSpinning || !currentParticipant || currentParticipant.entries <= 0 || activePrizes.length === 0
            ? 'bg-stone-800 text-stone-600 cursor-not-allowed shadow-none' 
            : 'bg-[#8d7b68] text-[#fcfaf2] hover:bg-[#5c3d2e] hover:-translate-y-1'
          }`}
        >
          {isSpinning ? '盤旋中...' : '啟動轉盤'}
        </button>
      </div>

      {/* Right Column: The Archive Roll (History) */}
      <div className="w-full lg:w-[320px] paper-texture rounded-xl flex flex-col shrink-0 relative">
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#2d1b0d]/10 to-transparent pointer-events-none" />
        <div className="p-8 border-b border-[#e5e1d3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Book className="w-5 h-5 text-[#8d7b68]" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#5c3d2e] serif">賞選紀錄</h2>
          </div>
          <button onClick={() => setHistory([])} className="text-[#dcd7c9] hover:text-[#9a3b3b] transition-colors"><RotateCcw className="w-4 h-4" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#dcd7c9] space-y-4 opacity-40">
              <div className="w-12 h-12 border-2 border-[#dcd7c9] rounded-full flex items-center justify-center italic text-lg serif">空</div>
              <p className="text-[10px] font-black uppercase tracking-widest">尚無紀錄錄</p>
            </div>
          ) : (
            history.map(record => (
              <div key={record.id} className="bg-white/60 border border-[#e5e1d3] p-5 rounded-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500 shadow-sm">
                <div className="shrink-0 relative">
                  {record.prizeImage ? (
                    <img src={record.prizeImage} className="w-14 h-14 rounded-full object-cover border-2 border-[#8d7b68]/20" />
                  ) : (
                    <div className="w-14 h-14 bg-[#f5f2e8] rounded-full flex items-center justify-center text-[#8d7b68] border border-[#e5e1d3]"><Trophy className="w-6 h-6" /></div>
                  )}
                  <div className="absolute -top-1 -right-1 bg-[#9a3b3b] w-4 h-4 rounded-full border border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-[#2d1b0d] serif truncate">{record.person}</div>
                  <div className="text-[11px] font-bold text-[#8d7b68] mb-1 serif">{record.prizeLabel}</div>
                  <div className="text-[9px] text-[#dcd7c9] font-medium tracking-tighter">{new Date(record.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-6 bg-[#f5f2e8] border-t border-[#e5e1d3] text-center">
           <span className="text-[9px] font-black text-[#dcd7c9] uppercase tracking-[0.3em]">文青桌案系列 v5.0</span>
        </div>
      </div>

      {/* Result Modal: The Elegant Invitation Card */}
      {winnerResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#2d1b0d]/90 backdrop-blur-md animate-in fade-in duration-700">
          {wheelConfig.winnerEffectImage && (
            <div className="absolute inset-0 opacity-20">
              <img src={wheelConfig.winnerEffectImage} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="paper-texture border-[16px] border-[#3d2b1f] rounded-lg p-16 max-w-xl w-full text-center relative overflow-hidden animate-in zoom-in duration-700 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#8d7b68]/20 rounded-b-xl" />
            
            <div className="mb-10 flex justify-center">
              {winnerResult.prize.image ? (
                <div className="relative p-2 bg-white shadow-xl rotate-3">
                  <img src={winnerResult.prize.image} className="w-48 h-48 object-cover border-4 border-[#fcfaf2]" />
                  <div className="absolute bottom-2 right-2 bg-[#9a3b3b] text-white text-[10px] px-2 py-1 serif">正品</div>
                </div>
              ) : (
                <div className="w-40 h-40 bg-[#f5f2e8] rounded-full flex items-center justify-center border-4 border-[#dcd7c9] shadow-inner">
                  <Trophy className="w-20 h-20 text-[#8d7b68] opacity-50" />
                </div>
              )}
            </div>

            <h3 className="text-xs font-black text-[#8d7b68] mb-4 uppercase tracking-[0.8em] serif">賀・中選</h3>
            <div className="text-6xl font-black text-[#2d1b0d] mb-10 tracking-widest leading-tight serif drop-shadow-sm">
              {winnerResult.prize.label}
            </div>

            <div className="border-y border-[#dcd7c9] py-8 mb-12">
              <span className="text-[10px] text-[#8d7b68] font-bold block mb-3 uppercase tracking-[0.4em] serif">得獎人芳名</span>
              <span className="text-5xl font-black text-[#9a3b3b] tracking-widest serif">{winnerResult.person}</span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => setWinnerResult(null)} className="bg-[#e5e1d3] py-5 rounded-lg font-black text-sm text-[#5c3d2e] hover:bg-[#dcd7c9] transition-all serif">珍藏紀錄</button>
              <button onClick={() => { setWinnerResult(null); setTimeout(() => setIsSpinning(true), 300); }} className="bg-[#8d7b68] py-5 rounded-lg font-black text-sm text-white shadow-xl hover:bg-[#5c3d2e] transition-all serif flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> 再次啟動
              </button>
            </div>
            
            <p className="mt-8 text-[10px] text-[#8d7b68] font-bold serif italic">剩餘抽獎次數：{currentParticipant?.entries} 次</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
