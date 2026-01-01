
import React from 'react';
import { X, Check } from 'lucide-react';
import { Shot } from '../types';

interface ReferenceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentShotId: string;
  shots: Shot[];
  selectedIds: string[];
  onToggleId: (id: string) => void;
}

export const ReferenceSelector: React.FC<ReferenceSelectorProps> = ({
  isOpen,
  onClose,
  currentShotId,
  shots,
  selectedIds,
  onToggleId
}) => {
  if (!isOpen) return null;

  // Only show shots BEFORE the current one that have generated images
  const currentIndex = shots.findIndex(s => s.id === currentShotId);
  const availableShots = shots.slice(0, currentIndex).filter(s => s.generatedImage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#131418] border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">选择视觉参考帧</h2>
            <p className="text-sm text-slate-500 mt-1">请选择之前的分镜作为当前画面的参考，AI 将参考其构图和光影。</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {availableShots.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              前面还没有生成过图片，无法选择参考。
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availableShots.map(shot => {
                const isSelected = selectedIds.includes(shot.id);
                return (
                  <div 
                    key={shot.id} 
                    onClick={() => onToggleId(shot.id)}
                    className={`relative group cursor-pointer border-2 rounded-xl overflow-hidden transition-all ${
                      isSelected ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'border-transparent hover:border-slate-600'
                    }`}
                  >
                    <img src={shot.generatedImage} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                       <span className="text-[10px] font-mono text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-md">
                         S{shot.sceneNumber}-{shot.shotNumber}
                       </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-indigo-500 text-white p-1 rounded-full shadow-lg">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-[#0b0c0f] rounded-b-2xl">
          <span className="text-sm text-slate-500">已选择 {selectedIds.length} 张参考图</span>
          <button onClick={onClose} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors shadow-lg shadow-indigo-500/20">
            完成设置
          </button>
        </div>
      </div>
    </div>
  );
};
