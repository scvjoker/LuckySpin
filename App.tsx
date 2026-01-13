
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, Sparkles, Trophy, Settings, PieChart, Users, UserPlus } from 'lucide-react';
import { Prize } from './types';
import { DEFAULT_PRIZES, PRESET_COLORS } from './constants';
import Wheel from './components/Wheel';
import { suggestPrizes } from './services/geminiService';

const App: React.FC = () => {
  const [prizes, setPrizes] = useState<Prize[]>(DEFAULT_PRIZES);
  const [participants, setParticipants] = useState<string[]>(['小明', '小華', '阿強', '雅婷', '小芬']);
  const [participantInput, setParticipantInput] = useState('');
  const [activeTab, setActiveTab] = useState<'prizes' | 'participants'>('prizes');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerResult, setWinnerResult] = useState<{ person: string | null; prize: Prize } | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const addPrize = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setPrizes([...prizes, {
      id: newId,
      label: `新獎項 ${prizes.length + 1}`,
      probability: 10,
      color: PRESET_COLORS[prizes.length % PRESET_COLORS.length]
    }]);
  };

  const removePrize = (id: string) => {
    if (prizes.length <= 2) return;
    setPrizes(prizes.filter(p => p.id !== id));
  };

  const updatePrize = (id: string, updates: Partial<Prize>) => {
    setPrizes(prizes.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addParticipant = () => {
    if (!participantInput.trim()) return;
    const names = participantInput.split(/[\n,，]/).map(n => n.trim()).filter(n => n);
    setParticipants([...new Set([...participants, ...names])]);
    setParticipantInput('');
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleSpin = () => {
    if (isSpinning) return;
    setWinnerResult(null);
    setIsSpinning(true);
  };

  const handleSpinEnd = (resultPrize: Prize) => {
    setIsSpinning(false);
    const luckyPerson = participants.length > 0 
      ? participants[Math.floor(Math.random() * participants.length)]
      : null;
    
    setWinnerResult({
      person: luckyPerson,
      prize: resultPrize
    });
  };

  const handleAiSuggest = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    if (activeTab === 'prizes') {
      const suggestions = await suggestPrizes(aiTopic);
      if (suggestions && suggestions.length > 0) {
        const newPrizes = suggestions.map((s: any, idx: number) => ({
          id: Math.random().toString(36).substr(2, 9),
          label: s.label,
          probability: s.probability,
          color: PRESET_COLORS[idx % PRESET_COLORS.length]
        }));
        setPrizes(newPrizes);
      }
    } else {
      // 簡單的 AI 名單生成 logic 可以在 service 擴充，這裡先示範靜態
      const mockNames = ['勇者', '冒險家', '魔法師', '吟遊詩人', '騎士'];
      setParticipants([...new Set([...participants, ...mockNames])]);
    }
    setIsGenerating(false);
  };

  const totalProb = prizes.reduce((s, p) => s + p.probability, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row p-4 md:p-8 gap-8 overflow-hidden">
      
      {/* Left Side: The Wheel */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent mb-2">
            LUCKY SPIN AI
          </h1>
          <p className="text-slate-400">自訂機率，公平抽獎</p>
        </div>

        <div className="relative">
          <Wheel 
            prizes={prizes} 
            isSpinning={isSpinning} 
            onSpinEnd={handleSpinEnd} 
          />
        </div>

        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`px-12 py-4 rounded-full text-2xl font-bold transition-all transform active:scale-95 shadow-xl ${
            isSpinning 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]'
          }`}
        >
          {isSpinning ? '轉動中...' : '立即抽獎'}
        </button>
      </div>

      {/* Right Side: Settings Panel */}
      <div className="w-full md:w-[450px] bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800 flex flex-col h-full max-h-[90vh]">
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-950/50 p-1 rounded-2xl mb-6">
          <button 
            onClick={() => setActiveTab('prizes')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'prizes' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Settings className="w-4 h-4" /> 獎項
          </button>
          <button 
            onClick={() => setActiveTab('participants')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'participants' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Users className="w-4 h-4" /> 參加者 ({participants.length})
          </button>
        </div>

        {/* AI Suggestion Area */}
        <div className="mb-6 p-4 bg-violet-950/20 rounded-2xl border border-violet-800/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300">
              AI 靈感建議 ({activeTab === 'prizes' ? '獎項' : '人名'})
            </span>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={activeTab === 'prizes' ? "例如：尾牙抽獎、婚禮遊戲" : "例如：武俠名、英文名"}
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button 
              onClick={handleAiSuggest}
              disabled={isGenerating || !aiTopic}
              className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            >
              {isGenerating ? '生成中' : '生成'}
            </button>
          </div>
        </div>

        {/* Dynamic Content Based on Tab */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {activeTab === 'prizes' ? (
            <>
              {prizes.map((prize) => (
                <div key={prize.id} className="group bg-slate-950/50 border border-slate-800 rounded-xl p-3 flex items-center gap-3 transition-all hover:border-slate-700">
                  <input 
                    type="color" 
                    value={prize.color}
                    onChange={(e) => updatePrize(prize.id, { color: e.target.value })}
                    className="w-10 h-10 rounded-lg border-none cursor-pointer overflow-hidden bg-transparent"
                  />
                  <div className="flex-1 min-w-0">
                    <input 
                      type="text" 
                      value={prize.label}
                      onChange={(e) => updatePrize(prize.id, { label: e.target.value })}
                      className="w-full bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-violet-500 pb-0.5"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500" style={{ width: `${(prize.probability / totalProb) * 100}%` }} />
                      </div>
                      <input 
                        type="number" 
                        value={prize.probability}
                        onChange={(e) => updatePrize(prize.id, { probability: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-12 bg-slate-900 text-xs text-center rounded py-1 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button onClick={() => removePrize(prize.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button 
                onClick={addPrize}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-violet-400 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
              >
                <Plus className="w-5 h-5" /> 增加獎項
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <textarea 
                  placeholder="輸入姓名，多個人名請用逗號或換行分隔..."
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none h-20 resize-none"
                />
                <button 
                  onClick={addParticipant}
                  className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl transition-all self-end"
                >
                  <UserPlus className="w-5 h-5 text-violet-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {participants.map((name, idx) => (
                  <div key={idx} className="group bg-slate-950/50 border border-slate-800 rounded-lg py-2 px-3 flex items-center justify-between text-xs hover:border-slate-700">
                    <span className="truncate flex-1">{name}</span>
                    <button onClick={() => removeParticipant(idx)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><PieChart className="w-3 h-3" /> 總權重: {totalProb}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 參加人數: {participants.length}</span>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {winnerResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 max-w-sm w-full text-center relative overflow-hidden animate-in zoom-in duration-500 shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 animate-pulse" />
            
            <div className="w-24 h-24 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-violet-500/20">
              <Trophy className="w-12 h-12 text-violet-400 animate-bounce" />
            </div>

            <h3 className="text-sm font-bold text-violet-400 mb-2 uppercase tracking-[0.3em]">恭喜幸運兒</h3>
            
            <div className="text-4xl font-black text-white mb-6 leading-tight">
              {winnerResult.person || '現場某位幸運兒'}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl py-6 px-4 mb-8">
              <span className="text-xs text-slate-500 block mb-1">獲得獎項</span>
              <span className="text-2xl font-bold text-fuchsia-400">{winnerResult.prize.label}</span>
            </div>

            <button 
              onClick={() => setWinnerResult(null)}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-4 rounded-2xl font-black text-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all transform active:scale-95"
            >
              太棒了！
            </button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default App;
