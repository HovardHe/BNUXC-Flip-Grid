import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Play, CheckCircle, RotateCcw, Image as ImageIcon, ChevronRight, Trophy, Lightbulb, X, AlertTriangle } from 'lucide-react';
import { CellState, GameStats, GameStatus, Level, GRID_SIZE, LevelRecord } from './types';
import { createEmptyGrid, toggleGridCell, isLevelSolved } from './utils/gameLogic';
import { AdminPanel } from './components/AdminPanel';
import { StatCard } from './components/StatCard';

const App: React.FC = () => {
  // --- Game Config & Data ---
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

  // --- Game State ---
  const [grid, setGrid] = useState<CellState[]>(createEmptyGrid());
  const [status, setStatus] = useState<GameStatus>(GameStatus.SETUP);
  const [showQuitModal, setShowQuitModal] = useState(false);
  
  // --- Stats ---
  const [levelStats, setLevelStats] = useState<GameStats>({ timeSeconds: 0, steps: 0 });
  const [history, setHistory] = useState<LevelRecord[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Derived Total Stats
  const totalStats = React.useMemo(() => {
    const historyTotal = history.reduce((acc, curr) => ({
        timeSeconds: acc.timeSeconds + curr.stats.timeSeconds,
        steps: acc.steps + curr.stats.steps
    }), { timeSeconds: 0, steps: 0 });

    if (status === GameStatus.PLAYING || status === GameStatus.LEVEL_COMPLETE) {
        return {
            timeSeconds: historyTotal.timeSeconds + levelStats.timeSeconds,
            steps: historyTotal.steps + levelStats.steps
        };
    }
    return historyTotal;
  }, [history, levelStats, status]);

  // --- Mask/Overlay ---
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [maskOpacity, setMaskOpacity] = useState(0.8);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Timer Ref ---
  const timerIntervalRef = useRef<number | null>(null);

  // --- Logic ---

  const startGame = () => {
    if (levels.length === 0) return;
    setStatus(GameStatus.IDLE);
    setCurrentLevelIdx(0);
    setHistory([]);
    loadLevel(0);
  };

  const quitToSetup = () => {
      // Clean up
      if(timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
      }
      setStartTime(null);
      setShowQuitModal(false);
      setStatus(GameStatus.SETUP);
  };

  const loadLevel = (idx: number) => {
    if (idx >= levels.length) return;
    const level = levels[idx];
    setGrid([...level.initialState]);
    setLevelStats({ timeSeconds: 0, steps: 0 });
    setStartTime(null);
  };

  const startPlayingLevel = () => {
    setStatus(GameStatus.PLAYING);
    setStartTime(Date.now()); // Start precision timer
  };

  // Timer Effect (Precision)
  useEffect(() => {
    if (status === GameStatus.PLAYING && startTime) {
      // Update UI every 100ms, but calculate based on delta
      timerIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - startTime) / 1000);
        setLevelStats(prev => ({ ...prev, timeSeconds: deltaSeconds }));
      }, 100);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [status, startTime]);

  const handleCellClick = (index: number) => {
    if (status !== GameStatus.PLAYING) return;

    // 1. Update Grid
    const newGrid = toggleGridCell(grid, index);
    setGrid(newGrid);

    // 2. Update Steps
    setLevelStats(prev => ({ ...prev, steps: prev.steps + 1 }));

    // 3. Check Win
    if (isLevelSolved(newGrid)) {
      handleLevelComplete(newGrid);
    }
  };

  const handleLevelComplete = (finalGrid: CellState[]) => {
    const currentLevel = levels[currentLevelIdx];
    
    // Calculate final time precisely
    const finalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : levelStats.timeSeconds;

    const finalStats = {
        timeSeconds: finalTime,
        steps: levelStats.steps + 1 // Add the winning click
    };
    
    setLevelStats(finalStats);

    const record: LevelRecord = {
        levelId: currentLevel.id,
        name: currentLevel.name,
        stats: finalStats
    };
    
    setHistory(prev => [...prev, record]);
    setStatus(GameStatus.LEVEL_COMPLETE);

    // 2. Auto Advance after delay
    setTimeout(() => {
        const nextIdx = currentLevelIdx + 1;
        if (nextIdx < levels.length) {
            setCurrentLevelIdx(nextIdx);
            loadLevel(nextIdx);
            // Immediately start next level
            setStatus(GameStatus.PLAYING); 
            setStartTime(Date.now()); 
        } else {
            setStatus(GameStatus.ALL_COMPLETE);
        }
    }, 1000);
  };

  const handleMaskUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setMaskImage(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Render ---

  if (status === GameStatus.SETUP) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 font-sans">
        <header className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
            数学嘉年华 <span className="text-blue-600">Flip Grid Pro</span>
            </h1>
            <p className="text-slate-500">比赛配置面板</p>
        </header>
        <AdminPanel 
            levels={levels} 
            setLevels={setLevels} 
            onStartCompetition={startGame} 
        />
      </div>
    );
  }

  const currentLevel = levels[currentLevelIdx];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 relative">
      
      {/* Quit Confirmation Modal */}
      {showQuitModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                          <AlertTriangle size={24} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-slate-800">退出比赛？</h3>
                          <p className="text-sm text-slate-500 mt-1">当前进度将丢失，确定要返回设置页面吗？</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 w-full mt-2">
                          <button 
                              onClick={() => setShowQuitModal(false)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                          >
                              取消
                          </button>
                          <button 
                              onClick={quitToSetup}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                          >
                              确定退出
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header - Increased z-index to 60 to stay above everything else */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-[60]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm">
                    <Settings size={20} className="animate-spin-slow" />
                 </div>
                 <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                    数学嘉年华 <span className="text-blue-600">Flip Grid Pro</span>
                 </h1>
            </div>

            <div className="flex items-center gap-4">
                 {/* Level Indicator */}
                 <div className="px-4 py-1.5 bg-slate-100 rounded-full text-sm font-bold text-slate-600 border border-slate-200 shadow-inner">
                    关卡 {currentLevelIdx + 1} / {levels.length}
                 </div>
                 
                 {/* Settings / Quit Button */}
                 <button 
                    onClick={() => setShowQuitModal(true)}
                    className="p-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-full text-slate-500 transition-colors cursor-pointer group active:scale-95"
                    title="返回设置"
                    aria-label="Quit to Setup"
                 >
                    <Settings size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                 </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row max-w-5xl mx-auto w-full p-4 gap-8 items-start justify-center">
        
        {/* Left Panel: Grid */}
        <div className="flex-1 w-full flex flex-col items-center">
            
            <div className="relative mb-6">
                
                {/* Goal Indicator */}
                <div className="absolute -top-12 w-full flex justify-center z-10">
                   <div className="bg-white/90 backdrop-blur text-amber-600 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-amber-100 flex items-center gap-2">
                      <Lightbulb size={16} className="text-amber-500" fill="currentColor" />
                      目标：点亮所有方块
                   </div>
                </div>

                {/* The Grid */}
                <div 
                    className="relative grid grid-cols-3 gap-3 p-4 bg-slate-800 rounded-2xl shadow-2xl border-4 border-slate-700 overflow-hidden"
                    style={{ width: 'min(90vw, 400px)', height: 'min(90vw, 400px)' }}
                >
                     {/* Overlay Mask (Custom Image) */}
                     {maskImage && (
                        <div 
                            className="absolute inset-0 z-10 pointer-events-none rounded-xl overflow-hidden transition-opacity duration-300"
                            style={{ opacity: maskOpacity }}
                        >
                            <img src={maskImage} alt="Overlay" className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Blind/Idle Cover - FULLY OPAQUE - z-50 */}
                    {status === GameStatus.IDLE && (
                        <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white rounded-xl">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-slate-700">
                                <Trophy size={40} className="text-amber-400" />
                            </div>
                            <h2 className="text-3xl font-bold mb-8 tracking-tight">准备好了吗？</h2>
                            <button 
                                onClick={startPlayingLevel}
                                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden ring-4 ring-blue-600/20"
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                <Play size={24} fill="currentColor" /> 开始挑战
                            </button>
                        </div>
                    )}

                    {grid.map((isOn, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleCellClick(idx)}
                            disabled={status !== GameStatus.PLAYING}
                            className={`
                                relative w-full h-full rounded-xl transition-all duration-200 transform
                                ${isOn 
                                    ? 'bg-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] border-4 border-amber-300 scale-[0.96] z-0' 
                                    : 'bg-slate-700 border-4 border-slate-600 hover:bg-slate-600 hover:border-slate-500 z-0'
                                }
                                disabled:cursor-not-allowed
                            `}
                        >
                             <span className="absolute inset-0 flex items-center justify-center opacity-10 font-mono text-2xl font-bold text-black pointer-events-none select-none">
                                {idx + 1}
                             </span>
                        </button>
                    ))}
                    
                    {/* Success Overlay for brief moment */}
                    {status === GameStatus.LEVEL_COMPLETE && (
                         <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all duration-300">
                             <div className="transform animate-bounce-short">
                                <CheckCircle size={100} className="text-green-500 drop-shadow-2xl bg-white rounded-full" fill="white" />
                             </div>
                         </div>
                    )}
                </div>
            </div>

            {/* Mask Controls */}
            <div className="w-full max-w-xs bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <ImageIcon size={16} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-600">题目蒙版</span>
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-md font-medium transition-colors"
                    >
                        {maskImage ? '更换图片' : '上传图片'}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleMaskUpload}
                    />
                </div>
                
                {maskImage ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>透明度</span>
                            <span>{Math.round(maskOpacity * 100)}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05" 
                            value={maskOpacity}
                            onChange={(e) => setMaskOpacity(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                ) : (
                    <div className="text-xs text-slate-400 text-center py-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        暂无图片
                    </div>
                )}
            </div>

        </div>

        {/* Right Panel: Stats & Context */}
        <div className="w-full md:w-80 flex flex-col gap-6">
            
            {/* Current Level Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">当前关卡</h3>
                    <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        {currentLevel.name}
                    </span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                    <StatCard 
                        label="用时" 
                        value={formatTime(levelStats.timeSeconds)} 
                        highlight={status === GameStatus.PLAYING} 
                    />
                    <StatCard 
                        label="步数" 
                        value={levelStats.steps} 
                    />
                </div>
            </div>

             {/* Total Competition Stats */}
             <div className="bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-100 flex items-center gap-2">
                        <Trophy size={16} className="text-amber-400" /> 比赛总计
                    </h3>
                </div>
                <div className="p-4 flex justify-between items-end">
                    <div>
                        <div className="text-slate-400 text-xs uppercase font-semibold mb-1">总用时</div>
                        <div className="text-3xl font-mono font-bold text-amber-400">
                            {formatTime(totalStats.timeSeconds)}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-slate-400 text-xs uppercase font-semibold mb-1">总步数</div>
                        <div className="text-3xl font-mono font-bold">
                            {totalStats.steps}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Area */}
            <div className="mt-auto">
                {status === GameStatus.ALL_COMPLETE && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="text-center mb-5">
                                <h4 className="text-2xl font-extrabold text-amber-800 mb-1">🎉 挑战成功！</h4>
                                <p className="text-sm text-amber-700">恭喜你完成了所有关卡。</p>
                            </div>

                            {/* Summary Table */}
                            <div className="bg-white rounded-lg overflow-hidden text-sm mb-5 shadow border border-amber-100">
                                <div className="max-h-56 overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-amber-100 text-amber-900 sticky top-0">
                                            <tr>
                                                <th className="p-2 pl-3 text-xs">关卡</th>
                                                <th className="p-2 text-xs">时间</th>
                                                <th className="p-2 pr-3 text-right text-xs">步数</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-amber-50">
                                            {history.map((rec) => (
                                                <tr key={rec.levelId} className="text-slate-700 hover:bg-amber-50/50">
                                                    <td className="p-2 pl-3 font-medium text-xs truncate max-w-[80px]">{rec.name}</td>
                                                    <td className="p-2 font-mono text-xs">{formatTime(rec.stats.timeSeconds)}</td>
                                                    <td className="p-2 pr-3 text-right font-mono text-xs">{rec.stats.steps}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="bg-amber-50 font-bold text-amber-900 border-t border-amber-200 flex justify-between p-2 text-xs">
                                    <span className="pl-1">总计</span>
                                    <div className="flex gap-4 pr-1">
                                        <span>{formatTime(totalStats.timeSeconds)}</span>
                                        <span>{totalStats.steps} 步</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setStatus(GameStatus.SETUP)}
                                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2 transition-colors"
                            >
                                <RotateCcw size={16} /> 返回设置页面
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;