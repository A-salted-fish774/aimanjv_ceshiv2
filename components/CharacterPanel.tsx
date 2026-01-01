
import React, { useState, useEffect, useRef } from 'react';
import { CharacterProfile, Shot, ModelSettings, PromptTemplates } from '../types';
import { Upload, Plus, Trash2, Sparkles, RefreshCw, Pin, PinOff, Users, Settings } from 'lucide-react';
import { autoMatchCharacters } from '../services/geminiService';

interface CharacterPanelProps {
  shots: Shot[];
  setShots: React.Dispatch<React.SetStateAction<Shot[]>>;
  characters: CharacterProfile[];
  setCharacters: React.Dispatch<React.SetStateAction<CharacterProfile[]>>;
  activeShotId: string | null;
  settings: ModelSettings;
  templates: PromptTemplates;
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  shots,
  setShots,
  characters,
  setCharacters,
  activeShotId,
  settings,
  templates
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'settings'>('match');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  
  // Dragging State
  const [position, setPosition] = useState({ top: '50%' });
  const panelRef = useRef<HTMLDivElement>(null);

  // New character input state
  const [newChar, setNewChar] = useState<Partial<CharacterProfile>>({});

  const activeShot = shots.find(s => s.id === activeShotId);

  // Smart Drag & Click Handler
  const handleMouseDown = (e: React.MouseEvent) => {
      // Allow drag only on left click
      if (e.button !== 0) return;
      
      // Prevent dragging if clicking interactive elements inside, unless it's the header itself
      if ((e.target as HTMLElement).closest('button, input, textarea, select') && !isMinimized) {
          // If maximized, and clicked on internal button, do nothing (let default happen)
          // But if clicked on header (which has class panel-header), we allow drag
          if (!(e.target as HTMLElement).closest('.panel-header')) return;
      }

      e.preventDefault(); // Prevent text selection
      // We don't stop propagation here to allow potential other listeners, 
      // but usually we want to capture this.
      
      const startY = e.clientY;
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Calculate offset from center to keep visual position stable during drag
      const startCenterY = rect.top + rect.height / 2;
      let hasMoved = false;

      const handleMouseMove = (ev: MouseEvent) => {
          const deltaY = ev.clientY - startY;
          if (Math.abs(deltaY) > 5) {
              hasMoved = true;
          }
          if (hasMoved) {
              setPosition({ top: `${startCenterY + deltaY}px` });
          }
      };

      const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          
          if (!hasMoved && isMinimized) {
              // Only toggle if it was a static click
              setIsMinimized(false);
          }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  };

  const handleToggleCharForShot = (charId: string) => {
    if (!activeShotId) return;
    setShots(prev => prev.map(s => {
      if (s.id === activeShotId) {
        const currentIds = s.characterIds || [];
        const newIds = currentIds.includes(charId)
          ? currentIds.filter(id => id !== charId)
          : [...currentIds, charId];
        return { ...s, characterIds: newIds };
      }
      return s;
    }));
  };

  const handleAutoMatch = async () => {
    if (characters.length === 0) {
        alert("请先添加角色");
        return;
    }
    setIsMatching(true);
    try {
        const resultMap = await autoMatchCharacters(shots, characters, settings.text, templates);
        
        setShots(prev => prev.map(s => {
            if (resultMap.has(s.id)) {
                return { ...s, characterIds: resultMap.get(s.id) || [] };
            }
            return s;
        }));
        alert("全剧本角色匹配完成！");
    } catch (e) {
        alert("匹配失败: " + e);
    } finally {
        setIsMatching(false);
    }
  };

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
    if(confirm("确定删除该角色吗？")) {
        setCharacters(prev => prev.filter(c => c.id !== id));
    }
  };

  if (isMinimized) {
      return (
          <div 
            ref={panelRef}
            className="fixed right-4 z-40 flex flex-col items-end gap-2 cursor-move"
            style={{ top: position.top, transform: 'translateY(-50%)' }}
            onMouseDown={handleMouseDown}
          >
              <button 
                // Removed onClick, handled in handleMouseDown
                className="w-12 h-12 flex items-center justify-center bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-full shadow-lg shadow-purple-900/30 transition-all border-2 border-white/10"
                title="按住拖动，点击打开"
              >
                  <Users className="w-5 h-5" />
                  {activeShot && activeShot.characterIds?.length > 0 && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#050505]"></span>
                  )}
              </button>
          </div>
      );
  }

  return (
    <div 
        ref={panelRef}
        className="fixed right-4 z-40 w-80 bg-[#131418] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300 max-h-[60vh]"
        style={{ top: position.top, transform: 'translateY(-50%)' }}
    >
      
      {/* Header with Drag */}
      <div 
        className="panel-header flex items-center justify-between p-4 bg-[#0b0c0f] border-b border-slate-800 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
         <div className="flex items-center gap-2 text-sm font-bold text-slate-200 pointer-events-none">
             <Users className="w-4 h-4 text-indigo-400" />
             角色面板
             {activeShotId && <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded ml-2">S{activeShot?.sceneNumber}-{activeShot?.shotNumber}</span>}
         </div>
         <div className="flex items-center gap-1">
             <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400">
                 <PinOff className="w-3.5 h-3.5" />
             </button>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-[#0b0c0f] border-b border-slate-800">
          <button 
             onClick={() => setActiveTab('match')}
             className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'match' ? 'bg-[#1a1c22] text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
             匹配 (当前镜)
          </button>
          <button 
             onClick={() => setActiveTab('settings')}
             className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-[#1a1c22] text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
             设置 (添加/删除)
          </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#131418]">
         
         {activeTab === 'match' && (
             <div className="space-y-4">
                 {!activeShotId ? (
                     <div className="text-center py-8 text-slate-500 text-xs">
                         请点击任意分镜<br/>以配置登场角色
                     </div>
                 ) : (
                     <>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400 font-bold">当前分镜登场:</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            {characters.map(char => {
                                const isChecked = activeShot?.characterIds?.includes(char.id);
                                return (
                                    <button
                                        key={char.id}
                                        onClick={() => handleToggleCharForShot(char.id)}
                                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                                            isChecked 
                                            ? 'bg-indigo-900/30 border-indigo-500 text-white' 
                                            : 'bg-[#1a1c22] border-slate-700 text-slate-400 hover:border-slate-500'
                                        }`}
                                    >
                                        <img src={char.imageUrl} className="w-6 h-6 rounded bg-black object-cover" />
                                        <span className="text-xs truncate font-medium">{char.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {characters.length === 0 && <div className="text-xs text-slate-500">暂无角色，请去设置页添加。</div>}
                     </>
                 )}

                 <div className="pt-4 border-t border-slate-800">
                     <button 
                        onClick={handleAutoMatch}
                        disabled={isMatching || characters.length === 0}
                        className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isMatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        全剧本 AI 智能匹配
                     </button>
                     <p className="text-[10px] text-slate-500 mt-2 text-center leading-relaxed">
                         AI 将通读剧本，自动判断每一镜谁在场。<br/>这有助于生图时准确调用角色垫图。
                     </p>
                 </div>
             </div>
         )}

         {activeTab === 'settings' && (
             <div className="space-y-6">
                 {/* Add Form */}
                 <div className="space-y-3 bg-[#0b0c0f] p-3 rounded-xl border border-slate-800">
                     <div className="flex gap-3">
                         <label className="w-16 h-16 shrink-0 bg-[#1a1c22] border border-dashed border-slate-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors overflow-hidden relative group">
                            {newChar.imageUrl ? (
                                <img src={newChar.imageUrl} className="w-full h-full object-cover" />
                            ) : (
                                <Upload className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                            )}
                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                         </label>
                         <div className="flex-1 space-y-2">
                             <input 
                                value={newChar.name || ''}
                                onChange={e => setNewChar(p => ({...p, name: e.target.value}))}
                                placeholder="角色名"
                                className="w-full bg-[#1a1c22] border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                             />
                             <textarea 
                                value={newChar.description || ''}
                                onChange={e => setNewChar(p => ({...p, description: e.target.value}))}
                                placeholder="外貌描述..."
                                className="w-full bg-[#1a1c22] border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 h-12 resize-none"
                             />
                         </div>
                     </div>
                     <button 
                        onClick={addCharacter}
                        disabled={!newChar.name || !newChar.description || !newChar.imageUrl}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                     >
                        <Plus className="w-3 h-3 inline mr-1" /> 添加角色
                     </button>
                 </div>

                 {/* List */}
                 <div className="space-y-2">
                     <h4 className="text-xs font-bold text-slate-500 uppercase">已添加 ({characters.length})</h4>
                     {characters.map(char => (
                         <div key={char.id} className="flex gap-3 p-2 bg-[#1a1c22] border border-slate-800 rounded-lg group hover:border-slate-600 transition-colors">
                             <img src={char.imageUrl} className="w-10 h-10 rounded bg-black object-cover shrink-0" />
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start">
                                     <div className="text-xs font-bold text-slate-200 truncate">{char.name}</div>
                                     <button onClick={() => removeCharacter(char.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                         <Trash2 className="w-3 h-3" />
                                     </button>
                                 </div>
                                 <div className="text-[10px] text-slate-500 truncate">{char.description}</div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         )}

      </div>
    </div>
  );
};
