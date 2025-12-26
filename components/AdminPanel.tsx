import React, { useState, useRef } from 'react';
import { Level, CellState, TOTAL_CELLS } from '../types';
import { createEmptyGrid } from '../utils/gameLogic';
import { Plus, Trash2, Play, Upload, Download, Copy, Check, X, FileJson, FileUp } from 'lucide-react';

interface AdminPanelProps {
  levels: Level[];
  setLevels: React.Dispatch<React.SetStateAction<Level[]>>;
  onStartCompetition: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ levels, setLevels, onStartCompetition }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [editorGrid, setEditorGrid] = useState<CellState[]>(createEmptyGrid());
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [exportData, setExportData] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditorClick = (index: number) => {
    const newGrid = [...editorGrid];
    newGrid[index] = !newGrid[index];
    setEditorGrid(newGrid);
  };

  const addLevelFromEditor = () => {
    const newLevel: Level = {
      id: `level-${Date.now()}`,
      name: `关卡 ${levels.length + 1}`,
      initialState: [...editorGrid],
    };
    setLevels([...levels, newLevel]);
  };

  const removeLevel = (id: string) => {
    setLevels(levels.filter(l => l.id !== id));
  };

  const parseAndLoadLevels = (jsonString: string) => {
    try {
      let parsed = JSON.parse(jsonString);
      
      // Support importing a single level object by wrapping it
      if (!Array.isArray(parsed) && typeof parsed === 'object') {
        parsed = [parsed];
      }

      if (!Array.isArray(parsed)) {
        throw new Error("JSON 数据必须是数组 (Array)");
      }

      // Validation
      const validLevels = parsed.filter((l: any) => 
        l.initialState && Array.isArray(l.initialState) && l.initialState.length === TOTAL_CELLS
      );

      if (validLevels.length === 0) {
        throw new Error("未找到有效关卡数据，请检查 initialState 格式");
      }

      // Regenerate IDs to prevent conflicts
      const cleanedLevels: Level[] = validLevels.map((l: any, idx: number) => ({
        id: `import-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        name: l.name || `导入关卡 ${idx + 1}`,
        initialState: l.initialState
      }));

      // Append new levels
      setLevels(prev => [...prev, ...cleanedLevels]);
      alert(`成功导入 ${cleanedLevels.length} 个关卡！`);
      setJsonInput(''); 
    } catch (e: any) {
      alert(`导入失败: ${e.message}`);
    }
  };

  const handleJsonTextInputImport = () => {
    if (!jsonInput.trim()) {
      alert("请输入 JSON 内容");
      return;
    }
    parseAndLoadLevels(jsonInput);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      parseAndLoadLevels(content);
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleJsonExport = () => {
      const data = JSON.stringify(levels, null, 2);
      setExportData(data);
  };

  const copyToClipboard = () => {
    if (!exportData) return;
    navigator.clipboard.writeText(exportData).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }).catch(() => {
        alert("无法自动复制，请手动选中下方文本框内容复制。");
    });
  };

  const downloadJsonFile = () => {
    if (!exportData) return;
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flip-grid-levels-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🛠 比赛后台设置 (Admin Setup)
        </h2>
        <div className="flex gap-2">
            <button 
                onClick={handleJsonExport}
                disabled={levels.length === 0}
                className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 font-medium transition-colors ${levels.length === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
                <Download size={14} /> 导出配置
            </button>
        </div>
      </div>

      {/* Export Modal / Overlay */}
      {exportData !== null && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <FileJson size={18} className="text-blue-600"/> 导出配置
                      </h3>
                      <button onClick={() => setExportData(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-5 flex-1 overflow-hidden flex flex-col gap-4">
                      <div className="flex gap-3">
                        <button 
                            onClick={downloadJsonFile}
                            className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download size={18} /> 下载 .json 文件 (推荐)
                        </button>
                        <button 
                            onClick={copyToClipboard}
                            className={`flex-1 py-3 rounded-lg border font-bold flex items-center justify-center gap-2 transition-colors ${copySuccess ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'}`}
                        >
                            {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                            {copySuccess ? '已复制到剪贴板' : '复制 JSON 文本'}
                        </button>
                      </div>
                      
                      <div className="relative flex-1">
                        <p className="text-xs text-gray-500 mb-1 absolute -top-5 left-1">或者手动复制下方内容：</p>
                        <textarea 
                            className="w-full h-full p-3 font-mono text-xs border border-gray-300 rounded bg-slate-50 focus:outline-blue-500 resize-none"
                            readOnly
                            value={exportData}
                            onClick={(e) => e.currentTarget.select()}
                        />
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={() => setExportData(null)}
                        className="px-6 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-medium transition-colors"
                      >
                          关闭
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('visual')}
            className={`pb-2 px-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'visual' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            可视化编辑器
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2 px-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'json' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            文件/JSON 导入
          </button>
        </div>

        {activeTab === 'visual' && (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Editor */}
            <div className="flex-1 flex flex-col items-center md:items-start">
              <h3 className="font-semibold mb-3 text-gray-700 w-full flex items-center gap-2">
                1. 设计图案 
                <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">目标：全亮</span>
              </h3>
              <p className="text-sm text-gray-500 mb-4 w-full">点击方格设置<b>初始</b>状态。</p>
              
              <div className="grid grid-cols-3 gap-2 p-4 bg-slate-100 rounded-xl border border-slate-200">
                {editorGrid.map((isOn, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleEditorClick(idx)}
                    className={`w-16 h-16 rounded-lg border-2 transition-all duration-200 ${
                      isOn 
                        ? 'bg-amber-400 border-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
                        : 'bg-slate-700 border-slate-600'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-6 w-full flex gap-3">
                  <button
                    onClick={() => setEditorGrid(createEmptyGrid())}
                    className="flex-1 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  >
                    重置
                  </button>
                  <button
                    onClick={addLevelFromEditor}
                    className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Plus size={18} /> 添加关卡
                  </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 border-l pl-0 md:pl-8 border-gray-200 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">2. 关卡列表 ({levels.length})</h3>
                  {levels.length > 0 && (
                      <button 
                        onClick={() => { if(confirm("确定清空所有关卡吗？")) setLevels([]); }}
                        className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      >
                          清空列表
                      </button>
                  )}
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {levels.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic bg-gray-50 rounded-lg border border-dashed border-gray-200 p-8">
                    <p>暂无关卡</p>
                    <p className="text-xs mt-1">请在左侧设计或导入文件</p>
                  </div>
                ) : (
                  levels.map((level, idx) => (
                    <div key={level.id} className="group flex items-center justify-between p-3 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm rounded-lg transition-all">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-100 text-slate-600 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                          {idx + 1}
                        </span>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-700 text-sm">{level.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-slate-100 rounded border border-slate-200">
                                {level.initialState.map((c, i) => (
                                    <div key={i} className={`w-1.5 h-1.5 rounded-[1px] ${c ? 'bg-amber-400' : 'bg-gray-300'}`} />
                                ))}
                           </div>
                          <button
                            onClick={() => removeLevel(level.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="flex flex-col gap-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* File Upload */}
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center gap-3">
                    <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm">
                        <FileUp size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900">上传配置文件 (.json)</h4>
                        <p className="text-xs text-blue-700 mt-1">推荐方式。选择之前导出的 JSON 文件。</p>
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                    >
                        选择文件
                    </button>
                    <input 
                        type="file" 
                        accept=".json,application/json" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload} 
                    />
                </div>

                {/* Text Import */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col">
                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <FileJson size={16} /> 粘贴 JSON 文本
                    </h4>
                    <textarea
                        className="w-full flex-1 p-3 font-mono text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner mb-3 min-h-[100px]"
                        placeholder='[{"id":"...", "initialState":[...]}]'
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                    />
                    <button
                        onClick={handleJsonTextInputImport}
                        className="self-end px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        导入文本
                    </button>
                </div>
             </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onStartCompetition}
            disabled={levels.length === 0}
            className={`px-8 py-3 rounded-xl font-bold text-lg flex items-center gap-2 shadow-lg transition-all ${
              levels.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-green-600 hover:bg-green-700 hover:shadow-green-200 hover:-translate-y-0.5 text-white'
            }`}
          >
            <Play size={24} fill="currentColor" /> 开始比赛
          </button>
        </div>
      </div>
    </div>
  );
};
