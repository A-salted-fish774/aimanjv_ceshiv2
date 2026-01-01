
import React, { useState } from 'react';
import { X, Upload, Plus, Trash2, Check } from 'lucide-react';
import { CharacterProfile } from '../types';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterProfile[];
  setCharacters: React.Dispatch<React.SetStateAction<CharacterProfile[]>>;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  characters,
  setCharacters
}) => {
  const [newChar, setNewChar] = useState<Partial<CharacterProfile>>({});

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewChar(prev => ({ ...prev, imageUrl: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addCharacter = () => {
    if (newChar.name && newChar.description && newChar.imageUrl) {
      const char: CharacterProfile = {
        id: Date.now().toString(),
        name: newChar.name,
        description: newChar.description,
        imageUrl: newChar.imageUrl
      };
      setCharacters(prev => [...prev, char]);
      setNewChar({});
    }
  };

  const removeCharacter = (id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#131418] border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">角色设置</h2>
            <p className="text-sm text-slate-500 mt-1">管理剧本中的角色。AI 将参考这些设定来保持画面一致性。</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Add New Section */}
          <div className="bg-[#0b0c0f] p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> 添加新角色
            </h3>
            <div className="flex gap-6 items-start">
              <label className="w-32 h-32 shrink-0 bg-[#1a1c22] border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-[#1f2128] transition-all group overflow-hidden">
                 {newChar.imageUrl ? (
                   <img src={newChar.imageUrl} className="w-full h-full object-cover" />
                 ) : (
                   <>
                     <Upload className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 mb-2" />
                     <span className="text-xs text-slate-500">上传立绘</span>
                   </>
                 )}
                 <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>

              <div className="flex-1 space-y-4">
                <input 
                  type="text" 
                  placeholder="角色名称 (例如: 林初雪)"
                  value={newChar.name || ''}
                  onChange={e => setNewChar(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#1a1c22] border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <textarea 
                  placeholder="角色描述 (例如: 银白色长发，梳着双麻花辫，紫色眼眸，身穿黑色露肩西装校服，腿裹黑丝袜...)"
                  value={newChar.description || ''}
                  onChange={e => setNewChar(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#1a1c22] border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                />
              </div>

              <button 
                onClick={addCharacter}
                disabled={!newChar.name || !newChar.description || !newChar.imageUrl}
                className="self-end px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
              >
                添加
              </button>
            </div>
          </div>

          {/* List Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
              已添加角色 ({characters.length})
            </h3>
            
            {characters.length === 0 && (
              <div className="text-center py-12 text-slate-600 bg-[#0b0c0f] rounded-xl border border-dashed border-slate-800">
                暂无角色，请先添加
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map(char => (
                <div key={char.id} className="flex gap-4 p-4 bg-[#0b0c0f] border border-slate-800 rounded-xl hover:border-slate-700 transition-colors group">
                   <div className="w-20 h-20 shrink-0 bg-black rounded-lg overflow-hidden border border-slate-800">
                     <img src={char.imageUrl} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-200">{char.name}</h4>
                        <button onClick={() => removeCharacter(char.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                     <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                       {char.description}
                     </p>
                   </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-white text-black hover:bg-slate-200 rounded-lg font-bold transition-colors">
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
