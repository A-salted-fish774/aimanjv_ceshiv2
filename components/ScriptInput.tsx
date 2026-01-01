
import React, { useState, useRef } from 'react';
import { ArrowRight, Clapperboard, FileText, Upload, X, SplitSquareHorizontal, Rows } from 'lucide-react';
import { ModelSettings, UserProfile } from '../types';
import { SettingsModal } from './SettingsModal';

interface ScriptInputProps {
  value: string;
  onChange: (val: string) => void;
  onAnalyze: (mode: 'text' | 'image' | 'commentary', breakdownMethod?: 'ai' | 'line') => void;
  isAnalyzing: boolean;
  settings: ModelSettings;
  onSettingsChange: (s: ModelSettings) => void;
  onClose: () => void;
  userProfile: UserProfile;
  onActivateCDK: (cdk: string) => boolean;
  projectTitle: string;
  setProjectTitle: (t: string) => void;
}

export const ScriptInput: React.FC<ScriptInputProps> = ({ 
  value, 
  onChange, 
  onAnalyze, 
  isAnalyzing,
  settings,
  onSettingsChange,
  onClose,
  userProfile,
  onActivateCDK,
  projectTitle,
  setProjectTitle
}) => {
  const [showSettings, setShowSettings] = useState(false);
  // Default to 'image' logic (as Script Mode)
  const activeMode = 'image';
  const [imageBreakdownMethod, setImageBreakdownMethod] = useState<'ai' | 'line'>('ai');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setFileName(file.name);
          const reader = new FileReader();
          reader.onload = (ev) => {
              const text = ev.target?.result as string;
              onChange(text);
          };
          reader.readAsText(file);
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) {
          setFileName(file.name);
          const reader = new FileReader();
          reader.onload = (ev) => {
              const text = ev.target?.result as string;
              onChange(text);
          };
          reader.readAsText(file);
      }
  };

  const renderUploadArea = () => (
    <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <span className="text-red-500">*</span> 剧本
            <span className="text-slate-600 font-normal ml-1">选择文本文件</span>
        </label>
        <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`w-full h-48 bg-[#0b0c0f] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group ${
                value 
                ? 'border-indigo-500/50 bg-indigo-500/5' 
                : 'border-slate-700 hover:border-indigo-500 hover:bg-[#131418]'
            }`}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.md,.json" 
                onChange={handleFileChange}
            />
            
            {value ? (
                <div className="text-center animate-in zoom-in-95">
                    <FileText className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                    <div className="text-base font-bold text-white">{fileName || '已加载剧本内容'}</div>
                    <div className="text-sm text-slate-500 mt-1">{value.length} 字符</div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onChange(''); setFileName(''); }}
                        className="mt-4 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs hover:bg-red-500/20"
                    >
                        移除并重选
                    </button>
                </div>
            ) : (
                <div className="text-center group-hover:scale-105 transition-transform">
                    <Upload className="w-10 h-10 text-slate-600 group-hover:text-indigo-400 mx-auto mb-3 transition-colors" />
                    <div className="text-base text-slate-400 group-hover:text-white transition-colors font-medium">
                        点击或拖拽文本文件到此处
                    </div>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
        userProfile={userProfile}
        onActivateCDK={onActivateCDK}
      />

      <div 
        className="w-full max-w-2xl bg-[#131418] border border-slate-800 rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()} 
      >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b0c0f]">
             <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 rounded-lg">
                    <Clapperboard className="w-5 h-5 text-white" />
                </div>
                新剧本模式 (Script Mode)
             </h2>
             <button 
                onClick={onClose}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
             >
                <X className="w-5 h-5" />
             </button>
          </div>

          {/* Main Form */}
          <div className="px-8 py-8 space-y-8">
              
              {/* Name Input */}
              <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <span className="text-red-500">*</span> 漫剧名称
                  </label>
                  <div className="relative">
                    <input 
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="请输入漫剧名称"
                        className="w-full bg-[#0b0c0f] border border-slate-700 rounded-xl px-4 py-4 text-base text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                        {projectTitle.length}/20
                    </span>
                  </div>
              </div>

              {/* Breakdown Method */}
              <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">分镜方式</label>
                  <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setImageBreakdownMethod('ai')}
                        className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all text-left ${
                            imageBreakdownMethod === 'ai' 
                            ? 'bg-purple-600/10 border-purple-500 text-white' 
                            : 'bg-[#0b0c0f] border-slate-800 text-slate-400 hover:bg-[#1a1c22]'
                        }`}
                      >
                          <div className={`p-2 rounded-lg ${imageBreakdownMethod === 'ai' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                             <SplitSquareHorizontal className="w-5 h-5" />
                          </div>
                          <div>
                              <div className="font-bold text-sm">AI 智能分镜</div>
                              <div className="text-[10px] opacity-60 mt-0.5">按每镜10秒自动切分</div>
                          </div>
                      </button>
                      
                      <button 
                        onClick={() => setImageBreakdownMethod('line')}
                        className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all text-left ${
                            imageBreakdownMethod === 'line' 
                            ? 'bg-indigo-600/10 border-indigo-500 text-white' 
                            : 'bg-[#0b0c0f] border-slate-800 text-slate-400 hover:bg-[#1a1c22]'
                        }`}
                      >
                          <div className={`p-2 rounded-lg ${imageBreakdownMethod === 'line' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                             <Rows className="w-5 h-5" />
                          </div>
                          <div>
                              <div className="font-bold text-sm">按行分镜</div>
                              <div className="text-[10px] opacity-60 mt-0.5">一行文案对应一个镜头</div>
                          </div>
                      </button>
                  </div>
              </div>

              {/* File Input */}
              {renderUploadArea()}

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800 bg-[#0b0c0f] flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-3 bg-[#1a1c22] hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl font-medium transition-colors"
              >
                  取消
              </button>
              <button 
                onClick={() => onAnalyze('image', imageBreakdownMethod)}
                disabled={!projectTitle.trim() || !value.trim() || isAnalyzing}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-indigo-900/30 hover:scale-105 active:scale-95"
              >
                  {isAnalyzing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        创建中...
                      </>
                  ) : (
                      <>
                        创建作品 <ArrowRight className="w-4 h-4" />
                      </>
                  )}
              </button>
          </div>
      </div>
    </div>
  );
};
