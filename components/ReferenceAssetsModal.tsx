import React, { useState } from 'react';
import { X, Upload, Trash2, Check, LayoutTemplate, Palette, Image as ImageIcon } from 'lucide-react';
import { GlobalReferences } from '../types';

interface ReferenceAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalRefs: GlobalReferences;
  setGlobalRefs: React.Dispatch<React.SetStateAction<GlobalReferences>>;
}

type Tab = 'style' | 'layout';

export const ReferenceAssetsModal: React.FC<ReferenceAssetsModalProps> = ({
  isOpen,
  onClose,
  globalRefs,
  setGlobalRefs
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('style');

  if (!isOpen) return null;

  const currentList = activeTab === 'style' 
    ? globalRefs.styleImages || [] 
    : globalRefs.layoutImages || [];
  
  const currentActive = activeTab === 'style' 
    ? globalRefs.activeStyleImage 
    : globalRefs.activeLayoutImage;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target?.result as string;
          setGlobalRefs(prev => {
            if (activeTab === 'style') {
              const newList = [...(prev.styleImages || []), base64];
              // If first image, auto select it
              const newActive = prev.activeStyleImage || base64;
              return { ...prev, styleImages: newList, activeStyleImage: newActive };
            } else {
              const newList = [...(prev.layoutImages || []), base64];
              const newActive = prev.activeLayoutImage || base64;
              return { ...prev, layoutImages: newList, activeLayoutImage: newActive };
            }
          });
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  const handleSelect = (img: string) => {
    setGlobalRefs(prev => {
        if (activeTab === 'style') {
            // Toggle off if already selected? No, let's keep it simple: always select.
            // Or allow deselecting. Let's allow switching.
            return { ...prev, activeStyleImage: img };
        } else {
            return { ...prev, activeLayoutImage: img };
        }
    });
  };

  const handleDelete = (img: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定删除这张参考图吗？')) return;

    setGlobalRefs(prev => {
        if (activeTab === 'style') {
            const newList = (prev.styleImages || []).filter(i => i !== img);
            const newActive = prev.activeStyleImage === img ? (newList[0] || undefined) : prev.activeStyleImage;
            return { ...prev, styleImages: newList, activeStyleImage: newActive };
        } else {
            const newList = (prev.layoutImages || []).filter(i => i !== img);
            const newActive = prev.activeLayoutImage === img ? (newList[0] || undefined) : prev.activeLayoutImage;
            return { ...prev, layoutImages: newList, activeLayoutImage: newActive };
        }
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#131418] border border-slate-800 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b0c0f]">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <ImageIcon className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-white">全局视觉参考库</h2>
                <p className="text-xs text-slate-500">配置生图时自动垫入的风格与布局基准图</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* Sidebar */}
            <div className="w-48 bg-[#0e0f12] border-r border-slate-800 flex flex-col p-2 gap-1">
                <button 
                    onClick={() => setActiveTab('style')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'style' 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                        : 'text-slate-400 hover:bg-[#1a1c22] hover:text-slate-200'
                    }`}
                >
                    <Palette className="w-4 h-4" />
                    画风参考
                </button>
                <button 
                    onClick={() => setActiveTab('layout')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'layout' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                        : 'text-slate-400 hover:bg-[#1a1c22] hover:text-slate-200'
                    }`}
                >
                    <LayoutTemplate className="w-4 h-4" />
                    六宫格排版
                </button>
            </div>

            {/* Main Area */}
            <div className="flex-1 bg-[#131418] p-6 overflow-y-auto custom-scrollbar">
                
                <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {activeTab === 'style' ? '画风参考图集 (Style Assets)' : '排版结构图集 (Layout Assets)'}
                    </h3>
                    <span className="text-xs text-slate-500">
                        选中一张作为当前生效的基准图
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Upload Button */}
                    <label className="aspect-square border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-[#1a1c22] transition-all group bg-[#0b0c0f]">
                        <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mb-2" />
                        <span className="text-xs text-slate-500 font-bold group-hover:text-white">上传图片</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleUpload} />
                    </label>

                    {/* Image List */}
                    {currentList.map((img, idx) => {
                        const isActive = img === currentActive;
                        return (
                            <div 
                                key={idx} 
                                onClick={() => handleSelect(img)}
                                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 transition-all ${
                                    isActive 
                                    ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] ring-1 ring-green-500' 
                                    : 'border-slate-800 hover:border-indigo-400'
                                }`}
                            >
                                <img src={img} className="w-full h-full object-cover" />
                                
                                {/* Overlay Gradient */}
                                <div className={`absolute inset-0 bg-black/40 transition-opacity ${isActive ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'}`} />

                                {/* Active Indicator */}
                                {isActive && (
                                    <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                                        <Check className="w-3 h-3" /> 当前使用
                                    </div>
                                )}

                                {/* Delete Button */}
                                <button 
                                    onClick={(e) => handleDelete(img, e)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {currentList.length === 0 && (
                    <div className="mt-8 text-center text-slate-600 text-xs">
                        暂无上传图片，点击左上角方块上传。
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0b0c0f] flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-white text-black hover:bg-slate-200 rounded-lg font-bold transition-colors">
                完成设置
            </button>
        </div>
      </div>
    </div>
  );
};