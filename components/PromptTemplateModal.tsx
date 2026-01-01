
import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Code, ChevronDown, FlaskConical, Lock, ChevronRight, Check } from 'lucide-react';
import { PromptTemplateCollection, PromptTemplates, TemplateCategory, UserProfile } from '../types';
import { DEFAULT_PROMPT_COLLECTION } from '../services/promptPresets';

interface PromptTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCollection: PromptTemplateCollection;
  onUpdateCollection: (newCollection: PromptTemplateCollection) => void;
  userProfile: UserProfile;
}

export const PromptTemplateModal: React.FC<PromptTemplateModalProps> = ({
  isOpen,
  onClose,
  currentCollection,
  onUpdateCollection,
  userProfile
}) => {
  const [activeTab, setActiveTab] = useState<keyof PromptTemplates>('breakdownSystemPrompt');
  const [tempCollection, setTempCollection] = useState<PromptTemplateCollection>(currentCollection);
  const [isSaved, setIsSaved] = useState(false);
  
  // Initialize state when modal opens or collection updates
  useEffect(() => {
    if (isOpen) {
      setTempCollection(currentCollection);
      setIsSaved(false);
    }
  }, [isOpen, currentCollection]); 

  if (!isOpen) return null;

  const currentCategory = tempCollection[activeTab];
  // Fallback to first variant if selected one is missing 
  const currentVariant = currentCategory?.variants.find(v => v.id === currentCategory.activeId) || currentCategory?.variants[0];

  const handleTabChange = (key: keyof PromptTemplates) => {
    setActiveTab(key);
  };

  const handleVariantChange = (variantId: string) => {
    setTempCollection(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        activeId: variantId
      }
    }));
  };

  const handleContentChange = (val: string) => {
    setTempCollection(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        variants: prev[activeTab].variants.map(v => 
          v.id === currentCategory.activeId ? { ...v, content: val } : v
        )
      }
    }));
  };

  const handleSave = () => {
    // UNLOCKED: No Plan Check here
    onUpdateCollection(tempCollection);
    
    // Show feedback
    setIsSaved(true);
    setTimeout(() => {
        setIsSaved(false);
        onClose();
    }, 500);
  };

  const handleReset = () => {
    if (confirm("确定要恢复默认提示词模板吗？所有自定义变体都将丢失。")) {
      setTempCollection(DEFAULT_PROMPT_COLLECTION);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#131418] border border-slate-800 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0b0c0f]">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                <FlaskConical className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    提示词工程实验室
                    <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded border border-yellow-500/30">UNLOCKED</span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">自定义 AI 的“导演风格”与生成逻辑。</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Master Detail Layout */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Left Sidebar: Pipeline Steps */}
            <div className="w-80 bg-[#0b0c0f] border-r border-slate-800 flex flex-col">
               <div className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pipeline Steps</div>
               <div className="flex-1 overflow-y-auto px-2 space-y-1">
                 {Object.values(tempCollection).map((cat: TemplateCategory) => {
                     const isActive = activeTab === cat.key;
                     const isCustom = cat.activeId !== 'default' && cat.activeId !== 'anime';
                     return (
                        <button
                        key={cat.key}
                        onClick={() => handleTabChange(cat.key as keyof PromptTemplates)}
                        className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                            isActive 
                            ? 'bg-[#1a1c22] text-white border border-slate-700 shadow-lg' 
                            : 'text-slate-400 hover:bg-[#1a1c22] hover:text-slate-200'
                        }`}
                        >
                            <span className="flex-1 truncate pr-2" title={cat.name}>{cat.name}</span>
                            {isCustom ? (
                                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
                            ) : (
                                <ChevronRight className={`w-4 h-4 text-slate-600 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                            )}
                        </button>
                     );
                 })}
               </div>
            </div>

            {/* Right Editor Area */}
            <div className="flex-1 flex flex-col bg-[#131418] relative">
               
               {/* Toolbar */}
               <div className="h-16 border-b border-slate-800 bg-[#1a1c22] flex items-center justify-between px-6 shrink-0">
                  <div className="flex items-center gap-4">
                      <span className="text-slate-500 text-sm font-medium">预设风格模板:</span>
                      
                      <div className="relative group">
                          <select 
                            value={currentCategory?.activeId}
                            onChange={(e) => handleVariantChange(e.target.value)}
                            className="appearance-none bg-[#0b0c0f] border border-slate-700 rounded-lg pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 hover:border-slate-500 transition-colors cursor-pointer min-w-[240px]"
                          >
                             {currentCategory?.variants.map(v => (
                                 <option key={v.id} value={v.id}>{v.name}</option>
                             ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                  </div>

                  <div className="flex items-center gap-3">
                      <button 
                        onClick={handleReset}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="恢复默认"
                      >
                         <RotateCcw className="w-4 h-4" />
                      </button>
                  </div>
               </div>
               
               {/* Text Editor */}
               <div className="flex-1 relative group/editor">
                   <textarea
                     value={currentVariant?.content || ''}
                     onChange={(e) => handleContentChange(e.target.value)}
                     className="absolute inset-0 w-full h-full bg-[#131418] p-8 text-sm font-mono text-slate-300 resize-none focus:outline-none leading-loose custom-scrollbar selection:bg-indigo-500/30"
                     spellCheck={false}
                   />
                   
                   {/* Variable Hint Overlay (Static for now) */}
                   <div className="absolute top-4 right-8 pointer-events-none opacity-50 text-[10px] text-slate-500 bg-[#0b0c0f] px-3 py-1.5 rounded-full border border-slate-800">
                       Variables like <span className="text-yellow-500">{`{{script}}`}</span> are highlighted
                   </div>
               </div>

               {/* Footer */}
               <div className="p-6 border-t border-slate-800 bg-[#0b0c0f] flex justify-end items-center">
                    {/* Removed Warning Text */}
                    <button 
                        onClick={handleSave} 
                        disabled={isSaved}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
                            isSaved 
                            ? 'bg-green-500 text-white hover:bg-green-600 scale-105' 
                            : 'bg-white text-black hover:bg-slate-200 hover:scale-[1.02]'
                        }`}
                    >
                        {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaved ? '已保存!' : '保存所有修改'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
