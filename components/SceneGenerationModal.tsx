import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Check, Maximize2 } from 'lucide-react';
import { Shot, SceneData, ModelSettings, PromptTemplates } from '../types';
import { generateSceneAnalysis, generateSceneImages } from '../services/geminiService';

interface SceneGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneNumber: string;
  shots: Shot[]; // All shots in this scene
  existingSceneData?: SceneData;
  onSave: (data: SceneData) => void;
  settings: ModelSettings;
  templates: PromptTemplates;
}

const LABELS = [
  "1. 主视角 (Main)",
  "2. 向后延伸 (Backward)",
  "3. 向前延伸 (Forward)",
  "4. 俯视布局 (Top-down)",
  "5. 天空/鸟瞰 (Aerial)"
];

export const SceneGenerationModal: React.FC<SceneGenerationModalProps> = ({
  isOpen,
  onClose,
  sceneNumber,
  shots,
  existingSceneData,
  onSave,
  settings,
  templates
}) => {
  const [description, setDescription] = useState(existingSceneData?.description || "");
  const [images, setImages] = useState<string[]>(existingSceneData?.images || []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const desc = await generateSceneAnalysis(sceneNumber, shots, settings.text, templates);
      setDescription(desc);
    } catch (e) {
      alert("分析失败: " + e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!description) return;
    setIsGenerating(true);
    setImages([]); // Clear previous
    try {
      const imgs = await generateSceneImages(description, settings.image, templates);
      setImages(imgs);
    } catch (e) {
      alert("生成失败: " + e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSave({
      sceneNumber,
      description,
      images,
      isAnalyzing: false,
      isGeneratingImages: false
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
      
      {/* Full Screen Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-8 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
           <button 
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setPreviewImage(null)}
           >
             <X className="w-8 h-8" />
           </button>
           <img 
            src={previewImage} 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" 
            onClick={(e) => e.stopPropagation()} 
            alt="Preview"
           />
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-400 text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
             点击任意处关闭预览
           </div>
        </div>
      )}

      <div className="bg-[#131418] border border-slate-800 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0b0c0f]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-600 rounded text-sm font-mono">SCENE {sceneNumber}</span>
              场景工坊 (Scene Studio)
            </h2>
            <p className="text-sm text-slate-500 mt-1">AI 自动提取环境特征，生成 5 个标准机位场景参考图，用于统一全场美术风格。</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Step 1: Analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                 1. 场景环境分析
               </h3>
               <button 
                 onClick={handleAnalyze}
                 disabled={isAnalyzing}
                 className="text-xs flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
               >
                 {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                 {description ? "重新分析" : "开始分析"}
               </button>
            </div>
            
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="点击上方按钮，AI 将阅读剧本并总结场景特征..."
              className="w-full h-32 bg-[#0b0c0f] border border-slate-700 rounded-xl p-4 text-slate-300 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

          {/* Step 2: Image Generation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                 2. 场景参考图生成 (标准五维机位)
               </h3>
               <button 
                 onClick={handleGenerateImages}
                 disabled={isGenerating || !description}
                 className="text-xs flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-purple-900/20"
               >
                 {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                 {images.length > 0 ? "全部重新生成" : "开始构建场景 (依次生成)"}
               </button>
            </div>
            
            {images.length === 0 && !isGenerating ? (
               <div className="h-64 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600 bg-[#0b0c0f] gap-2">
                  <Sparkles className="w-8 h-8 opacity-20" />
                  <span>暂无生成的场景图，点击右上角开始构建</span>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Main Shot - Large */}
                 <div className="md:col-span-2 row-span-2 group relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500 transition-colors shadow-2xl">
                    {images[0] ? (
                        <>
                            <img 
                                src={images[0]} 
                                className="w-full h-full object-cover cursor-zoom-in" 
                                onClick={() => setPreviewImage(images[0])}
                            />
                            <div className="absolute top-4 left-4">
                                <span className="bg-indigo-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md">
                                    {LABELS[0]} (核心基准)
                                </span>
                            </div>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setPreviewImage(images[0])} className="p-2 bg-black/50 text-white rounded-lg backdrop-blur-md">
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-[#0b0c0f]">
                           {isGenerating && <RefreshCw className="w-8 h-8 animate-spin mb-2" />}
                           <span>{isGenerating ? "正在构建主视角..." : "等待生成"}</span>
                        </div>
                    )}
                 </div>

                 {/* Other 4 Shots */}
                 {[1, 2, 3, 4].map((idx) => (
                   <div key={idx} className="group relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500 transition-colors">
                      {images[idx] ? (
                        <>
                           <img 
                            src={images[idx]} 
                            className="w-full h-full object-cover cursor-zoom-in" 
                            onClick={() => setPreviewImage(images[idx])}
                           />
                           <div className="absolute top-2 left-2">
                                <span className="bg-black/60 text-slate-200 text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md border border-white/10">
                                    {LABELS[idx]}
                                </span>
                           </div>
                           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setPreviewImage(images[idx])} className="p-1.5 bg-black/50 text-white rounded-lg backdrop-blur-md">
                                    <Maximize2 className="w-3 h-3" />
                                </button>
                           </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-[#0b0c0f] text-xs">
                           {isGenerating && images.length === idx ? (
                               <>
                                <RefreshCw className="w-4 h-4 animate-spin mb-1" />
                                <span>推演中...</span>
                               </>
                           ) : (
                            <span>等待生成</span>
                           )}
                        </div>
                      )}
                   </div>
                 ))}
               </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end bg-[#0b0c0f] gap-3">
          <button onClick={onClose} className="px-6 py-2 text-slate-400 hover:text-white font-medium transition-colors">
            取消
          </button>
          <button 
            onClick={handleSave} 
            disabled={images.length === 0}
            className="px-6 py-2 bg-white text-black hover:bg-slate-200 rounded-lg font-bold transition-colors disabled:opacity-50 shadow-lg"
          >
            保存并应用到场景 {sceneNumber}
          </button>
        </div>
      </div>
    </div>
  );
};