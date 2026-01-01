
import React, { useState, useEffect, useRef } from 'react';
import { Shot, GlobalReferences, CharacterProfile, ModelSettings, PromptTemplateCollection, PromptTemplates, SceneData, Task, UserProfile } from '../types';
import { 
  Play, 
  Image as ImageIcon, 
  RefreshCw, 
  Video, 
  Download, 
  Film,
  Maximize2,
  Link as LinkIcon,
  Plus,
  Trash2,
  Settings,
  Sparkles,
  FileCode,
  Activity,
  Home,
  Pencil,
  Grid,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Mic,
  MonitorPlay,
  Users,
  Ratio,
  Settings2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  History,
  RotateCcw,
  Palette,
  Clapperboard
} from 'lucide-react';
import { ReferenceSelector } from './ReferenceSelector';
import { PromptTemplateModal } from './PromptTemplateModal';
import { CharacterPanel } from './CharacterPanel';
import { LoggerPanel } from './LoggerPanel';
import { TaskDashboard } from './TaskDashboard';
import { ReferenceAssetsModal } from './ReferenceAssetsModal';

interface WorkspaceProps {
  shots: Shot[];
  setShots: React.Dispatch<React.SetStateAction<Shot[]>>;
  globalRefs: GlobalReferences;
  setGlobalRefs: React.Dispatch<React.SetStateAction<GlobalReferences>>;
  characters: CharacterProfile[];
  setCharacters: React.Dispatch<React.SetStateAction<CharacterProfile[]>>;
  scenesData: Record<string, SceneData>;
  setScenesData: React.Dispatch<React.SetStateAction<Record<string, SceneData>>>;
  onGeneratePrompts: () => void;
  onGenerateSinglePrompt: (shotId: string) => void;
  onGenerateSingleVideoPrompt?: (shotId: string) => void;
  onGenerateVideoPrompts: () => void;
  onGenerateImage: (shotId: string) => void;
  onGenerateVideo: (shotId: string) => void;
  
  // Visual Detail Handlers
  onGenerateVisualDetail?: (shotId: string) => void;
  onGenerateVisualDetails?: () => void;
  
  isGeneratingPrompts: boolean;
  isGeneratingVideoPrompts: boolean;
  isGeneratingVisualDetails?: boolean;

  onBack: () => void;
  settings: ModelSettings;
  onSettingsChange: (s: ModelSettings) => void;
  onOpenSettings: () => void; 
  
  // Prompt Collections (for editing)
  promptCollection: PromptTemplateCollection;
  onUpdatePromptCollection: (c: PromptTemplateCollection) => void;
  // Effective Templates (for logic)
  effectiveTemplates: PromptTemplates;
  
  // Tasks (New)
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onClearTasks: () => void;

  userProfile: UserProfile;
  projectMode: 'text' | 'image' | 'commentary'; 
  
  // New: Restore history handler
  onRestoreHistoryImage?: (shotId: string, imageUrl: string) => void;
  onRestoreHistoryVideo?: (shotId: string, videoUrl: string) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  shots,
  setShots,
  globalRefs,
  setGlobalRefs,
  characters,
  setCharacters,
  scenesData,
  setScenesData,
  onGeneratePrompts,
  onGenerateSinglePrompt,
  onGenerateSingleVideoPrompt,
  onGenerateVideoPrompts,
  onGenerateImage,
  onGenerateVideo,
  
  onGenerateVisualDetail,
  onGenerateVisualDetails,
  
  isGeneratingPrompts,
  isGeneratingVideoPrompts,
  isGeneratingVisualDetails,
  
  onBack,
  settings,
  onSettingsChange,
  onOpenSettings,
  promptCollection,
  onUpdatePromptCollection,
  effectiveTemplates,
  tasks,
  onDeleteTask,
  onClearTasks,
  userProfile,
  projectMode,
  onRestoreHistoryImage,
  onRestoreHistoryVideo
}) => {
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showLogger, setShowLogger] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const [activeShotId, setActiveShotId] = useState<string | null>(null);
  const [showRefSelector, setShowRefSelector] = useState(false);
  const [activeRefShotId, setActiveRefShotId] = useState<string | null>(null);
  
  // New: Reference Assets Modal State
  const [showAssetsModal, setShowAssetsModal] = useState(false);

  // New: History Panel State
  const [showHistory, setShowHistory] = useState(false);
  const [showVideoHistory, setShowVideoHistory] = useState(false); // Video History State
  
  // New: Global Settings Popover State
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  
  // New: Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, shotId: string | null }>({ isOpen: false, shotId: null });
  
  // Global Defaults (Image & Video separated) - Default 1:1 for Image
  const [globalImageRatio, setGlobalImageRatio] = useState<string>("1:1"); 
  const [globalVideoRatio, setGlobalVideoRatio] = useState<string>("16:9");
  
  // Toast Feedback State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // Ensure activeShotId is set
  useEffect(() => {
      if (shots.length > 0 && !activeShotId) {
          setActiveShotId(shots[0].id);
      }
  }, [shots, activeShotId]);

  // Clear toast after 3s
  useEffect(() => {
      if (toast) {
          const timer = setTimeout(() => setToast(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [toast]);

  const activeShotIndex = shots.findIndex(s => s.id === activeShotId);
  const activeShot = shots[activeShotIndex];

  // Helper to get active characters
  const activeCharacters = activeShot && activeShot.characterIds 
    ? characters.filter(c => activeShot.characterIds.includes(c.id)) 
    : [];

  const updateShot = (id: string, field: keyof Shot, value: any) => {
    setShots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAddShot = () => {
    const lastShot = shots[shots.length - 1];
    const newShot: Shot = {
      id: Date.now().toString(),
      sceneNumber: lastShot ? lastShot.sceneNumber : "1",
      shotNumber: (shots.length + 1).toString(),
      originalText: "",
      visualDescription: "",
      cameraAction: "",
      dialogueOrAudio: "",
      duration: "15s",
      positivePrompt: "",
      negativePrompt: "",
      aspectRatio: globalImageRatio, 
      imageQuality: "2K", // Default 2K
      videoAspectRatio: globalVideoRatio, 
      videoPrompt: "",
      isGeneratingPrompt: false,
      isGeneratingImage: false,
      isGeneratingVideoPrompt: false,
      isGeneratingVideo: false,
      manualReferenceShotIds: [],
      characterIds: [] 
    };
    setShots(prev => [...prev, newShot]);
    setActiveShotId(newShot.id);
  };

  // --- Delete Logic ---
  const requestDeleteShot = (shotId: string) => {
      setDeleteModal({ isOpen: true, shotId });
  };

  const confirmDeleteShot = () => {
    const targetId = deleteModal.shotId;
    if (!targetId) return;

    const targetIndex = shots.findIndex(s => s.id === targetId);
    if (targetIndex === -1) {
        setToast({ message: "删除失败：找不到该分镜", type: 'info' });
        setDeleteModal({ isOpen: false, shotId: null });
        return;
    }

    let nextActiveId = activeShotId;
    if (activeShotId === targetId) {
        const remainingShots = shots.filter(s => s.id !== targetId);
        if (remainingShots.length > 0) {
            const nextIndex = Math.min(targetIndex, remainingShots.length - 1);
            nextActiveId = remainingShots[nextIndex].id;
        } else {
            nextActiveId = null;
        }
    }

    const newShots = shots.filter(s => s.id !== targetId);
    setShots(newShots);
    setActiveShotId(nextActiveId);
    
    setToast({ message: "分镜已成功删除", type: 'success' });
    setDeleteModal({ isOpen: false, shotId: null });
  };

  const applyImageRatioToAll = (e: React.MouseEvent) => {
      e.preventDefault(); 
      e.stopPropagation();
      const targetRatio = globalImageRatio;
      setShots(prev => prev.map(s => ({ ...s, aspectRatio: targetRatio })));
      setShowGlobalSettings(false);
      setToast({ message: `已将图片画幅 [${targetRatio}] 应用到 ${shots.length} 个分镜`, type: 'success' });
  };

  const applyVideoRatioToAll = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const targetRatio = globalVideoRatio;
      setShots(prev => prev.map(s => ({ ...s, videoAspectRatio: targetRatio })));
      setShowGlobalSettings(false);
      setToast({ message: `已将视频画幅 [${targetRatio}] 应用到 ${shots.length} 个分镜`, type: 'success' });
  };

  const openRefSelector = (shotId: string) => {
    setActiveRefShotId(shotId);
    setShowRefSelector(true);
  };

  const toggleReferenceShot = (refShotId: string) => {
    if (!activeRefShotId) return;
    setShots(prev => prev.map(s => {
      if (s.id === activeRefShotId) {
        const currentRefs = s.manualReferenceShotIds || [];
        const newRefs = currentRefs.includes(refShotId) 
          ? currentRefs.filter(id => id !== refShotId)
          : [...currentRefs, refShotId];
        return { ...s, manualReferenceShotIds: newRefs };
      }
      return s;
    }));
  };

  const handleLocateTask = (shotId: string) => {
     setActiveShotId(shotId);
  };

  const timelineRef = useRef<HTMLDivElement>(null);

  const isGeminiProImage = settings.image.model === 'gemini-3-pro-image-preview';

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-slate-300 overflow-hidden font-sans relative">
      
      {/* Reference Assets Modal */}
      <ReferenceAssetsModal 
        isOpen={showAssetsModal}
        onClose={() => setShowAssetsModal(false)}
        globalRefs={globalRefs}
        setGlobalRefs={setGlobalRefs}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDeleteModal({ isOpen: false, shotId: null })}>
              <div className="bg-[#1a1c22] border border-red-900/50 w-[420px] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
                   <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                   
                   <div className="p-8 flex flex-col items-center text-center relative z-10">
                       <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-5 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                           <AlertTriangle className="w-7 h-7 text-red-500" />
                       </div>
                       <h3 className="text-xl font-bold text-white mb-2">确认删除此分镜?</h3>
                       <div className="text-sm text-slate-400 leading-relaxed max-w-[90%]">
                           您正在删除分镜 <span className="text-white font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded border border-white/5 mx-1">#{shots.findIndex(s => s.id === deleteModal.shotId) + 1}</span>
                           <br/>
                           <span className="text-red-400/80 mt-1 block text-xs">此操作不可恢复，该分镜的提示词和生成结果将永久丢失。</span>
                       </div>
                   </div>

                   <div className="p-6 pt-0 grid grid-cols-2 gap-4 relative z-10">
                       <button 
                          onClick={() => setDeleteModal({ isOpen: false, shotId: null })}
                          className="py-3 px-4 rounded-xl font-bold text-sm text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors border border-white/5"
                       >
                           取消
                       </button>
                       <button 
                          onClick={confirmDeleteShot}
                          className="py-3 px-4 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all shadow-lg shadow-red-900/30 hover:shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                       >
                           <Trash2 className="w-4 h-4" />
                           确定删除
                       </button>
                   </div>
              </div>
          </div>
      )}

      {/* Toast Notification */}
      {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
              <div className={`px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
                  toast.type === 'success' 
                  ? 'bg-green-500/90 border-green-400/50 text-white' 
                  : 'bg-indigo-500/90 border-indigo-400/50 text-white'
              }`}>
                  {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
                  <span className="font-bold text-sm shadow-black drop-shadow-sm">{toast.message}</span>
              </div>
          </div>
      )}

      <TaskDashboard 
         tasks={tasks}
         onDeleteTask={onDeleteTask}
         onClearTasks={onClearTasks}
         onLocateTask={handleLocateTask}
      />

      <PromptTemplateModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        currentCollection={promptCollection}
        onUpdateCollection={onUpdatePromptCollection}
        userProfile={userProfile}
      />
      
      <LoggerPanel 
        isOpen={showLogger}
        onClose={() => setShowLogger(false)}
      />
      
      <CharacterPanel 
        shots={shots}
        setShots={setShots}
        characters={characters}
        setCharacters={setCharacters}
        activeShotId={activeShotId}
        settings={settings}
        templates={effectiveTemplates}
      />

      {activeRefShotId && shots.find(s => s.id === activeRefShotId) && (
        <ReferenceSelector 
          isOpen={showRefSelector}
          onClose={() => setShowRefSelector(false)}
          currentShotId={activeRefShotId}
          shots={shots}
          selectedIds={shots.find(s => s.id === activeRefShotId)?.manualReferenceShotIds || []}
          onToggleId={toggleReferenceShot}
        />
      )}

      {/* Full Screen Media Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8 animate-in fade-in duration-200" onClick={() => setPreviewMedia(null)}>
           <button 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
            onClick={() => setPreviewMedia(null)}
           >
             <X className="w-8 h-8" />
           </button>
           
           <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
               {previewMedia.type === 'image' ? (
                   <img 
                    src={previewMedia.url} 
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" 
                    alt="Preview"
                   />
               ) : (
                   <video 
                    src={previewMedia.url} 
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" 
                    controls
                    autoPlay
                    loop
                   />
               )}
           </div>
        </div>
      )}

      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-[#0b0c0f] flex items-center justify-between px-4 shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-4">
          <div className="flex bg-[#1a1c22] rounded-lg px-3 py-1.5 border border-slate-700/50">
             <span className="text-sm font-bold text-white flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-indigo-500" />
                剧本创作模式
             </span>
          </div>
          
          <button onClick={onBack} className="text-slate-500 hover:text-white">
             <Home className="w-4 h-4" />
          </button>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 max-w-2xl w-full text-center">
            {activeShot ? (
                <h1 className="text-sm text-slate-200 font-medium truncate px-4 py-2 bg-black/20 rounded border border-slate-800/50">
                    {activeShot.originalText || "暂无原文案"}
                </h1>
            ) : (
                <span className="text-slate-500 text-sm">请选择一个分镜</span>
            )}
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowAssetsModal(true)}
             className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1c22] border border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500 transition-colors rounded text-xs font-bold"
           >
               <Palette className="w-3.5 h-3.5 text-indigo-400" />
               参考图片
               {(globalRefs.activeStyleImage || globalRefs.activeLayoutImage) && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
           </button>

           <div className="relative">
               <button 
                 onClick={() => setShowGlobalSettings(!showGlobalSettings)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border transition-colors ${showGlobalSettings ? 'bg-[#8b5cf6] text-white border-[#7c3aed]' : 'bg-[#1a1c22] border-slate-700 text-slate-300 hover:text-white'}`}
               >
                   <Ratio className="w-3 h-3" /> 全局画幅
               </button>
               
               {showGlobalSettings && (
                   <>
                   <div className="fixed inset-0 z-40" onClick={() => setShowGlobalSettings(false)}></div>
                   <div className="absolute right-0 top-full mt-2 bg-[#1a1c22] border border-slate-700 p-4 rounded-xl shadow-2xl w-72 z-50 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                       <h3 className="text-xs font-bold text-white border-b border-slate-700 pb-2">新分镜默认画幅设置</h3>
                       
                       <div className="space-y-2">
                           <div className="flex justify-between items-center">
                               <span className="text-[10px] text-slate-400">全局图片 (Default Image)</span>
                               <button 
                                  type="button"
                                  onClick={applyImageRatioToAll} 
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors font-bold"
                                  title="点击立即将当前选择的尺寸应用到所有已创建的分镜"
                               >
                                   应用到所有 <CheckCircle2 className="w-3 h-3" />
                               </button>
                           </div>
                           <select 
                                value={globalImageRatio}
                                onChange={(e) => setGlobalImageRatio(e.target.value)}
                                className="w-full bg-[#0b0c0f] border border-slate-600 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                            >
                                <option value="1:1">1:1 (方形)</option>
                                <option value="16:9">16:9 (横屏)</option>
                                <option value="9:16">9:16 (竖屏)</option>
                                <option value="4:3">4:3 (传统)</option>
                                <option value="3:4">3:4 (海报)</option>
                            </select>
                       </div>

                       <div className="space-y-2">
                           <div className="flex justify-between items-center">
                               <span className="text-[10px] text-slate-400">全局视频 (Default Video)</span>
                               <button 
                                  type="button"
                                  onClick={applyVideoRatioToAll} 
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors font-bold"
                                  title="点击立即将当前选择的尺寸应用到所有已创建的分镜"
                               >
                                   应用到所有 <CheckCircle2 className="w-3 h-3" />
                               </button>
                           </div>
                           <select 
                                value={globalVideoRatio}
                                onChange={(e) => setGlobalVideoRatio(e.target.value)}
                                className="w-full bg-[#0b0c0f] border border-slate-600 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                            >
                                <option value="16:9">16:9 (横屏)</option>
                                <option value="9:16">9:16 (竖屏)</option>
                                <option value="1:1">1:1 (方形)</option>
                            </select>
                       </div>
                       
                       <div className="text-[10px] text-slate-500 mt-2 bg-slate-800/50 p-2 rounded leading-relaxed border border-slate-700/50">
                           提示：修改上方选项将作为“新建分镜”的默认值。<br/>
                           <span className="text-indigo-400">点击“应用到所有”按钮可立即同步到旧分镜。</span>
                       </div>
                   </div>
                   </>
               )}
           </div>

           <button onClick={() => setShowLogger(!showLogger)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400">
             <Activity className="w-4 h-4" />
           </button>
           <button onClick={onOpenSettings} className="p-1.5 hover:bg-slate-800 rounded text-slate-400">
             <Settings className="w-4 h-4" />
           </button>
           <button className="bg-[#1a1c22] border border-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2">
             <Download className="w-3 h-3" /> 导出
           </button>
        </div>
      </header>

      {/* Main Workspace Area (3 Columns) */}
      <div className="flex-1 flex overflow-hidden">
          
          {activeShot ? (
            <>
              {/* LEFT COLUMN: Image Workflow */}
              <div className="w-[340px] bg-[#0e0f12] border-r border-slate-800 flex flex-col h-full overflow-hidden">
                  
                  <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto custom-scrollbar">
                      
                      {/* 1. Inference Prompt */}
                      <div className="flex-1 min-h-[150px] flex flex-col gap-2">
                          <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-bold text-indigo-400">图片提示词</span>
                              <button 
                                  onClick={() => onGenerateSinglePrompt(activeShot.id)}
                                  disabled={activeShot.isGeneratingPrompt}
                                  className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors shadow-lg shadow-indigo-900/20"
                              >
                                  {activeShot.isGeneratingPrompt ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span className="flex items-center gap-1"><Sparkles className="w-3 h-3"/> 智能推理</span>}
                              </button>
                          </div>
                          <textarea 
                              value={activeShot.positivePrompt}
                              onChange={(e) => updateShot(activeShot.id, 'positivePrompt', e.target.value)}
                              className="w-full h-full bg-[#131418] border border-slate-700 rounded-lg p-3 text-[11px] text-slate-300 resize-none outline-none focus:border-indigo-500 custom-scrollbar"
                              placeholder="六宫格提示词..."
                          />
                      </div>

                      {/* 2. Image Preview & Generate (FIXED 1:1 Aspect Ratio) */}
                      <div className="flex flex-col gap-2 shrink-0">
                          <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-bold text-indigo-400">生成分镜</span>
                              {/* History Button */}
                              <button 
                                  onClick={() => setShowHistory(true)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                              >
                                  <History className="w-3 h-3" /> 生图历史
                              </button>
                          </div>
                          <div className="w-full aspect-square bg-black rounded-lg border border-slate-800 overflow-hidden relative group">
                              {activeShot.generatedImage ? (
                                  <>
                                      <img 
                                        src={activeShot.generatedImage} 
                                        className="w-full h-full object-contain" 
                                        onClick={() => setPreviewMedia({ type: 'image', url: activeShot.generatedImage! })}
                                      />
                                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                              onClick={() => setPreviewMedia({ type: 'image', url: activeShot.generatedImage! })}
                                              className="p-1.5 bg-black/50 text-white rounded hover:bg-black/70"
                                          >
                                              <Maximize2 className="w-3 h-3" />
                                          </button>
                                      </div>
                                  </>
                              ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-[#131418]">
                                      {activeShot.isGeneratingImage ? <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" /> : <span className="text-xs">暂无图片</span>}
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* 3. NEW: Current Shot Characters (Boxed) */}
                      <div className="shrink-0 border border-slate-700 bg-[#1a1c22]/50 rounded-lg p-2 space-y-2">
                          <span className="text-[10px] font-bold text-indigo-400 block px-1">当前分镜角色:</span>
                          <div className="flex flex-wrap gap-2 min-h-[24px] items-center">
                              {activeCharacters.length > 0 ? (
                                  activeCharacters.map(char => (
                                      <div key={char.id} className="flex items-center gap-1.5 px-2 py-1 rounded border border-indigo-500/30 bg-indigo-500/10">
                                          <div className="w-4 h-4 rounded-full bg-black/50 overflow-hidden">
                                              <img src={char.imageUrl} className="w-full h-full object-cover" />
                                          </div>
                                          <span className="text-xs font-bold text-indigo-300">{char.name}</span>
                                      </div>
                                  ))
                              ) : (
                                  <span className="text-[10px] text-slate-500 px-1">无 (点击右侧浮窗配置)</span>
                              )}
                          </div>
                      </div>

                      {/* 4. Settings Rows (Clickable) */}
                      <div className="space-y-3 pt-3 border-t border-slate-800 shrink-0">
                          
                          {/* Row 1: Image Quality (Default 2K) */}
                          <div className={`flex items-center justify-between ${!isGeminiProImage ? 'opacity-50' : ''}`}>
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                                  图片质量
                              </span>
                              <div className="relative min-w-[120px]">
                                <select 
                                    value={activeShot.imageQuality || '2K'}
                                    onChange={(e) => updateShot(activeShot.id, 'imageQuality', e.target.value)}
                                    disabled={!isGeminiProImage}
                                    className="w-full bg-[#1a1c22] border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-bold appearance-none outline-none cursor-pointer hover:border-indigo-400 text-center"
                                >
                                    <option value="1K">1K (标准)</option>
                                    <option value="2K">2K (高清)</option>
                                    <option value="4K">4K (超清)</option>
                                </select>
                              </div>
                          </div>

                          {/* Row 2: Image Size (Default 1:1) */}
                          <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                                  图片尺寸
                              </span>
                              <div className="relative min-w-[120px]">
                                <select 
                                    value={activeShot.aspectRatio}
                                    onChange={(e) => updateShot(activeShot.id, 'aspectRatio', e.target.value)}
                                    className="w-full bg-[#1a1c22] border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-bold appearance-none outline-none cursor-pointer hover:border-indigo-400 text-center"
                                >
                                    <option value="1:1">1:1 (方形)</option>
                                    <option value="16:9">16:9 (横屏)</option>
                                    <option value="9:16">9:16 (竖屏)</option>
                                    <option value="4:3">4:3 (传统)</option>
                                    <option value="3:4">3:4 (海报)</option>
                                </select>
                              </div>
                          </div>

                          {/* Row 3: Model */}
                          <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">生图模型</span>
                              <div className="relative min-w-[120px]">
                                <select 
                                    value={settings.image.model}
                                    onChange={(e) => onSettingsChange({...settings, image: {...settings.image, model: e.target.value}})}
                                    className="w-full bg-[#1a1c22] border border-slate-700 rounded px-3 py-1.5 text-xs text-white appearance-none outline-none cursor-pointer hover:border-indigo-500 text-center truncate"
                                >
                                    <option value="gemini-3-pro-image-preview">gemini-3-pro-image-preview</option>
                                    <option value="gemini-2.5-flash-image">gemini-2.5-flash-image</option>
                                    <option value="dall-e-3">dall-e-3</option>
                                </select>
                              </div>
                          </div>

                          {/* Row 4: Inference Mode */}
                          <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">推理模式</span>
                              <div className="relative min-w-[120px]">
                                <select 
                                    className="w-full bg-[#1a1c22] border border-slate-700 rounded px-3 py-1.5 text-xs text-white appearance-none outline-none cursor-pointer hover:border-indigo-500 text-center"
                                    defaultValue="six_grid_infer"
                                >
                                    <option value="six_grid_infer">六宫格推理</option>
                                    <option value="simple">简易推理</option>
                                </select>
                              </div>
                          </div>

                          {/* Generate Button */}
                          <button 
                              onClick={() => onGenerateImage(activeShot.id)}
                              disabled={activeShot.isGeneratingImage || !activeShot.positivePrompt}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                          >
                              {activeShot.isGeneratingImage ? "生成中..." : "生成分镜图片"}
                          </button>

                      </div>
                  </div>
              </div>

              {/* CENTER COLUMN: Stage & Script (MAXIMIZED VIDEO) */}
              <div className="flex-1 flex flex-col bg-[#050505] relative border-r border-slate-800">
                  
                  {/* Visual Description Overlay */}
                  <div className="p-4 text-center absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                      <span className="text-xs text-slate-300 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                          分镜 {activeShot.shotNumber}
                      </span>
                  </div>

                  {/* Image History Slide-out Drawer (Left Side) */}
                  {showHistory && (
                      <div className="absolute top-0 left-0 bottom-0 w-80 bg-[#131418] border-r border-slate-800 z-30 shadow-2xl animate-in slide-in-from-left duration-200 flex flex-col">
                          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0b0c0f]">
                              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                  <History className="w-4 h-4" /> 生图历史记录
                              </h3>
                              <button onClick={() => setShowHistory(false)} className="p-1 text-slate-400 hover:text-white">
                                  <X className="w-4 h-4" />
                              </button>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                              {!activeShot.historyImages || activeShot.historyImages.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center h-48 text-slate-600 gap-2 text-xs">
                                      <ImageIcon className="w-8 h-8 opacity-20" />
                                      <span>暂无历史图片</span>
                                  </div>
                              ) : (
                                  <div className="space-y-4">
                                      {activeShot.historyImages.map((img, idx) => (
                                          <div key={idx} className="group relative border border-slate-800 rounded-lg overflow-hidden bg-black/50 hover:border-indigo-500 transition-all">
                                              <div className="aspect-square w-full cursor-pointer" onClick={() => setPreviewMedia({ type: 'image', url: img })}>
                                                  <img src={img} className="w-full h-full object-cover" />
                                              </div>
                                              <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                                  #{activeShot.historyImages!.length - idx}
                                              </div>
                                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button 
                                                      onClick={() => onRestoreHistoryImage && onRestoreHistoryImage(activeShot.id, img)}
                                                      className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg"
                                                  >
                                                      <RotateCcw className="w-3 h-3" /> 恢复此图
                                                  </button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                          <div className="p-3 bg-[#0b0c0f] border-t border-slate-800 text-[10px] text-slate-500 text-center">
                              点击图片放大，点击按钮恢复
                          </div>
                      </div>
                  )}

                  {/* Video History Slide-out Drawer (Right Side) */}
                  {showVideoHistory && (
                      <div className="absolute top-0 right-0 bottom-0 w-80 bg-[#131418] border-l border-slate-800 z-30 shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
                          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0b0c0f]">
                              <button onClick={() => setShowVideoHistory(false)} className="p-1 text-slate-400 hover:text-white">
                                  <X className="w-4 h-4" />
                              </button>
                              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                  <Film className="w-4 h-4" /> 视频历史记录
                              </h3>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                              {!activeShot.historyVideos || activeShot.historyVideos.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center h-48 text-slate-600 gap-2 text-xs">
                                      <Film className="w-8 h-8 opacity-20" />
                                      <span>暂无历史视频</span>
                                  </div>
                              ) : (
                                  <div className="space-y-4">
                                      {activeShot.historyVideos.map((vid, idx) => (
                                          <div key={idx} className="group relative border border-slate-800 rounded-lg overflow-hidden bg-black/50 hover:border-indigo-500 transition-all">
                                              <div className="aspect-video w-full cursor-pointer bg-black" onClick={() => setPreviewMedia({ type: 'video', url: vid })}>
                                                  <video src={vid} className="w-full h-full object-cover" />
                                              </div>
                                              <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                                  #{activeShot.historyVideos!.length - idx}
                                              </div>
                                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button 
                                                      onClick={() => onRestoreHistoryVideo && onRestoreHistoryVideo(activeShot.id, vid)}
                                                      className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg"
                                                  >
                                                      <RotateCcw className="w-3 h-3" /> 恢复视频
                                                  </button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                          <div className="p-3 bg-[#0b0c0f] border-t border-slate-800 text-[10px] text-slate-500 text-center">
                              点击预览，点击按钮恢复
                          </div>
                      </div>
                  )}

                  {/* Main Canvas / Player - Full Width/Height */}
                  <div className="flex-1 w-full h-full flex items-center justify-center bg-[#050505] overflow-hidden relative">
                      {activeShot.generatedVideo ? (
                          <div className="w-full h-full flex items-center justify-center p-4">
                              <video 
                                  src={activeShot.generatedVideo} 
                                  className="w-full h-full object-contain max-h-full shadow-2xl"
                                  controls
                                  autoPlay
                                  loop
                              />
                          </div>
                      ) : activeShot.generatedImage ? (
                          <div className="w-full h-full flex items-center justify-center p-4 relative group">
                              <img 
                                  src={activeShot.generatedImage} 
                                  className="w-full h-full object-contain max-h-full opacity-90 shadow-2xl" 
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black/60 px-6 py-4 rounded-xl backdrop-blur-md flex flex-col items-center gap-2 border border-white/10">
                                      <span className="text-sm text-slate-200 font-bold">暂无视频</span>
                                      <span className="text-xs text-slate-400">点击右侧「生成视频」</span>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="text-slate-700 flex flex-col items-center gap-4 bg-[#131418] px-8 py-6 rounded-2xl border border-slate-800/50">
                              <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 opacity-20" />
                              </div>
                              <span className="text-sm font-medium opacity-50">暂无内容</span>
                          </div>
                      )}
                  </div>
              </div>

              {/* RIGHT COLUMN: Video Workflow */}
              <div className="w-[340px] bg-[#0e0f12] flex flex-col overflow-y-auto custom-scrollbar p-4 gap-4 h-full">
                  
                  {/* 1. Inference Prompt */}
                  <div className="flex-1 min-h-[200px] flex flex-col gap-2">
                      <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-bold text-indigo-400">视频提示词</span>
                          <button 
                              onClick={() => onGenerateSingleVideoPrompt && onGenerateSingleVideoPrompt(activeShot.id)}
                              disabled={activeShot.isGeneratingVideoPrompt}
                              className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors shadow-lg shadow-indigo-900/20"
                          >
                              {activeShot.isGeneratingVideoPrompt ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span className="flex items-center gap-1"><Sparkles className="w-3 h-3"/> 智能推理</span>}
                          </button>
                      </div>
                      <div className="relative flex-1 flex flex-col gap-2">
                        <textarea 
                            value={activeShot.videoPrompt}
                            onChange={(e) => updateShot(activeShot.id, 'videoPrompt', e.target.value)}
                            className="w-full flex-1 bg-[#131418] border border-slate-700 rounded-lg p-3 text-[11px] text-indigo-200/80 resize-none outline-none focus:border-indigo-500 custom-scrollbar transition-all"
                            placeholder="描述运镜、物理动作、光影流变..."
                        />
                      </div>
                  </div>

                  {/* 2. Video History Module (New Location: Above Separator) */}
                  <div className="shrink-0">
                      <div className="flex justify-between items-center bg-[#131418] px-3 py-2 rounded-lg border border-slate-800">
                          <span className="text-xs font-bold text-indigo-400">生成记录</span>
                          <button 
                              onClick={() => setShowVideoHistory(true)}
                              className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors bg-slate-700/50 hover:bg-slate-700 px-2 py-1 rounded"
                          >
                              <History className="w-3 h-3" /> 视频历史
                          </button>
                      </div>
                  </div>

                  {/* 3. Video Config Rows (Separator starts here) */}
                  <div className="space-y-3 shrink-0 border-t border-slate-800 pt-3">
                      
                      {/* Row 1: Video Size */}
                      <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">视频尺寸</span>
                          <div className="relative min-w-[120px]">
                              <select 
                                  value={activeShot.videoAspectRatio || activeShot.aspectRatio} // Fallback
                                  onChange={(e) => updateShot(activeShot.id, 'videoAspectRatio', e.target.value)}
                                  className="w-full bg-[#1a1c22] border border-slate-700 rounded px-3 py-1.5 text-xs text-white appearance-none outline-none cursor-pointer hover:border-indigo-500 text-center"
                              >
                                  <option value="9:16">9:16</option>
                                  <option value="16:9">16:9</option>
                                  <option value="1:1">1:1</option>
                              </select>
                          </div>
                      </div>

                      {/* Row 2: Duration */}
                      <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">时长</span>
                          <div className="relative min-w-[120px]">
                              <select 
                                  value={activeShot.duration}
                                  onChange={(e) => updateShot(activeShot.id, 'duration', e.target.value)}
                                  className="w-full bg-[#1a1c22] border border-slate-700 rounded px-3 py-1.5 text-xs text-white appearance-none outline-none cursor-pointer hover:border-indigo-500 text-center"
                              >
                                  <option value="15s">15秒</option>
                                  <option value="10s">10秒</option>
                              </select>
                          </div>
                      </div>

                      {/* Row 3: Video Model */}
                      <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-200 font-bold">视频模型</span>
                          <div className="relative min-w-[120px]">
                              <select 
                                  value={settings.video.model}
                                  onChange={(e) => onSettingsChange({...settings, video: {...settings.video, model: e.target.value}})}
                                  className="w-full bg-[#1a1c22] border border-slate-700 rounded px-3 py-1.5 text-xs text-white appearance-none outline-none cursor-pointer hover:border-indigo-500 text-center"
                              >
                                  <option value="sora-2-all">sora-2-all</option>
                                  <option value="sora-2">sora-2</option>
                                  <option value="veo-3.1-fast-generate-preview">veo-3.1</option>
                              </select>
                          </div>
                      </div>

                      {/* Row 4: Inference Mode */}
                      <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">推理模式</span>
                          <div className="relative min-w-[120px]">
                              <select 
                                  className="w-full bg-[#1a1c22] border border-slate-700 rounded px-3 py-1.5 text-xs text-white appearance-none outline-none cursor-pointer hover:border-indigo-500 text-center"
                                  defaultValue="six_grid_infer_video"
                              >
                                  <option value="six_grid_infer_video">六宫格推理</option>
                                  <option value="simple">简易推理</option>
                              </select>
                          </div>
                      </div>

                      {/* Generate Button */}
                      <button 
                          onClick={() => onGenerateVideo(activeShot.id)}
                          disabled={activeShot.isGeneratingVideo || !activeShot.videoPrompt}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                      >
                          {activeShot.isGeneratingVideo ? "生成中..." : "生成视频"}
                      </button>

                  </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-[#050505]">
                <Film className="w-16 h-16 opacity-20 mb-4" />
                <p>请点击下方添加分镜或导入剧本</p>
                <button onClick={handleAddShot} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg">
                    新建分镜
                </button>
            </div>
          )}
      </div>

      {/* Bottom Timeline */}
      <div className="h-40 bg-[#0b0c0f] border-t border-slate-800 flex flex-col shrink-0">
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400">分镜序列</span>
              <div className="flex gap-2">
                  <button onClick={handleAddShot} className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors">
                      添加分镜
                  </button>
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (activeShotId) requestDeleteShot(activeShotId);
                    }} 
                    disabled={!activeShotId}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 rounded text-xs transition-colors disabled:opacity-50"
                  >
                      删除分镜
                  </button>
              </div>
          </div>
          
          <div 
            className="flex-1 overflow-x-auto flex items-center px-4 gap-6 custom-scrollbar" 
            style={{ overflowY: 'hidden' }}
            ref={timelineRef}
          >
              {shots.map((shot, idx) => (
                  <div 
                    id={`timeline-shot-${shot.id}`}
                    key={shot.id}
                    onClick={() => setActiveShotId(shot.id)}
                    className={`relative w-28 h-28 flex-shrink-0 rounded-xl border-2 overflow-hidden cursor-pointer group transition-all flex flex-col ${
                        activeShotId === shot.id ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] scale-105 z-10' : 'border-slate-800 hover:border-slate-600 bg-[#131418] opacity-90 hover:opacity-100'
                    }`}
                  >
                      <div className="flex-1 relative bg-[#131418] aspect-square">
                        {shot.generatedImage ? (
                            <img src={shot.generatedImage} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600">
                                暂无
                            </div>
                        )}
                        <div className="absolute top-1 right-1">
                            {shot.generatedVideo && <div className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-black"></div>}
                        </div>
                      </div>
                      
                      <div className="h-6 bg-[#0e0f12] flex justify-between items-center px-2 text-[9px] border-t border-slate-800">
                          <span className={`font-bold ${activeShotId === shot.id ? 'text-green-400' : 'text-slate-400'}`}>
                              #{idx + 1}
                          </span>
                          <span className="text-slate-500">
                              新分镜
                          </span>
                      </div>
                  </div>
              ))}
              
              <button 
                onClick={handleAddShot}
                className="w-12 h-28 flex-shrink-0 rounded-xl border-2 border-dashed border-slate-800 hover:border-slate-600 flex items-center justify-center text-slate-600 hover:text-slate-400 transition-colors"
              >
                  <Plus className="w-5 h-5" />
              </button>
          </div>
      </div>

    </div>
  );
};
