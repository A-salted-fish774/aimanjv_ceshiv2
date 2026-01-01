
import React, { useState } from 'react';
import { 
  Folder, 
  Trash2, 
  Grid, 
  List, 
  Plus, 
  Search, 
  Cloud, 
  MoreHorizontal, 
  Clock, 
  Star, 
  Filter, 
  ArrowLeft,
  HardDrive,
  Download, 
  Play,
  Copy,
  FolderPlus,
  Lock,
  Loader2,
  FileBox,
  LayoutGrid
} from 'lucide-react';
import { UserProfile, Project, ProjectFolder } from '../types';

interface ProjectManagerProps {
  userProfile: UserProfile;
  onOpenSettings: () => void;
  onBack: () => void;
  // New props
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
}

// Mock Data for Folders (Keep local for now as per plan)
const MOCK_FOLDERS: ProjectFolder[] = [
  { id: 'f1', name: '赛博朋克系列' },
  { id: 'f2', name: '抖音短剧 S1' },
];

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  userProfile,
  onOpenSettings,
  onBack,
  projects,
  onOpenProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onDuplicateProject
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'favorites' | 'trash'>('all');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState(MOCK_FOLDERS);

  // Computed Projects
  const filteredProjects = projects.filter(p => {
      // 1. Basic Search
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // 2. Main Filter Logic
      if (selectedFilter === 'trash') return p.isDeleted;
      if (p.isDeleted) return false; // Don't show deleted in other views

      if (selectedFilter === 'favorites') return p.isStarred;
      
      // 3. Folder Logic
      if (activeFolderId) return p.folderId === activeFolderId;

      return true; // 'all' or 'recent' (simplified for now)
  });

  const handleToggleSelect = (id: string, multi: boolean) => {
      setSelectedProjectIds(prev => {
          const next = new Set(multi ? prev : []);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handleCreateFolder = () => {
      const name = prompt("请输入文件夹名称");
      if (name) {
          setFolders(prev => [...prev, { id: `new_${Date.now()}`, name }]);
      }
  };
  
  const handleBulkAction = (action: 'delete' | 'export') => {
      if (action === 'delete') {
          if (confirm(`确定要删除选中的 ${selectedProjectIds.size} 个项目吗？`)) {
              // Batch delete
              selectedProjectIds.forEach(id => onDeleteProject(id));
              setSelectedProjectIds(new Set());
          }
      }
      if (action === 'export') {
          // Always allow export now
          alert("已开始批量导出...");
      }
  };

  return (
    <div className="flex h-screen w-screen bg-[#030303] text-slate-300 font-sans overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-64 bg-[#050505] border-r border-slate-800 flex flex-col shrink-0">
             {/* Header / Back */}
             <div className="h-16 flex items-center px-6 border-b border-slate-800">
                 <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                     <ArrowLeft className="w-4 h-4" />
                     <span className="font-bold text-sm">返回工作台</span>
                 </button>
             </div>

             {/* Navigation */}
             <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 
                 {/* Main Groups */}
                 <div className="space-y-1">
                     <SidebarItem 
                        icon={LayoutGrid} 
                        label="全部工程" 
                        count={projects.filter(p => !p.isDeleted).length}
                        active={selectedFilter === 'all' && !activeFolderId}
                        onClick={() => { setSelectedFilter('all'); setActiveFolderId(null); }}
                     />
                     <SidebarItem 
                        icon={Clock} 
                        label="最近打开" 
                        active={selectedFilter === 'recent'}
                        onClick={() => { setSelectedFilter('recent'); setActiveFolderId(null); }}
                     />
                     <SidebarItem 
                        icon={Star} 
                        label="星标/收藏" 
                        active={selectedFilter === 'favorites'}
                        onClick={() => { setSelectedFilter('favorites'); setActiveFolderId(null); }}
                     />
                     <SidebarItem 
                        icon={Trash2} 
                        label="回收站" 
                        active={selectedFilter === 'trash'}
                        onClick={() => { setSelectedFilter('trash'); setActiveFolderId(null); }}
                        // Removed alert prop
                     />
                 </div>

                 {/* Folders */}
                 <div>
                     <div className="flex items-center justify-between px-3 mb-2">
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">文件夹</span>
                         <button onClick={handleCreateFolder} className="text-slate-500 hover:text-white transition-colors">
                             <Plus className="w-3.5 h-3.5" />
                         </button>
                     </div>
                     <div className="space-y-1">
                         {folders.map(f => (
                             <SidebarItem 
                                key={f.id}
                                icon={Folder}
                                label={f.name}
                                active={activeFolderId === f.id}
                                onClick={() => { setActiveFolderId(f.id); setSelectedFilter('all'); }}
                             />
                         ))}
                     </div>
                 </div>

             </div>

             {/* Storage / Footer */}
             <div className="p-4 border-t border-slate-800 bg-[#0b0c0f]">
                 <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                         <HardDrive className="w-3 h-3" /> 本地存储
                     </span>
                     <span className="text-xs text-slate-500">1.2 GB</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                     <div className="h-full bg-slate-600 w-[30%]"></div>
                 </div>
                 
                 {/* Cloud Hook */}
                 <button 
                    onClick={onOpenSettings}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all bg-green-500/10 text-green-400 border-green-500/30"
                 >
                     <Cloud className="w-3.5 h-3.5" />
                     云同步已激活
                 </button>
             </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-[#030303] relative">
            
            {/* Top Toolbar */}
            <div className="h-16 flex items-center justify-between px-8 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white">
                        {activeFolderId ? folders.find(f => f.id === activeFolderId)?.name : 
                         selectedFilter === 'trash' ? '回收站' : 
                         selectedFilter === 'favorites' ? '我的收藏' : '我的工程'}
                    </h1>
                    <span className="bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full font-mono">
                        {filteredProjects.length} Projects
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-400 transition-colors" />
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索项目..." 
                            className="bg-[#0b0c0f] border border-slate-700 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 w-48 transition-all"
                        />
                    </div>

                    <div className="h-6 w-px bg-slate-800"></div>

                    {/* View Switch */}
                    <div className="flex bg-[#0b0c0f] border border-slate-700 rounded-lg p-0.5">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-800"></div>

                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-700 text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors">
                            <FolderPlus className="w-3.5 h-3.5" /> 导入
                        </button>
                        <button 
                            onClick={onCreateProject}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
                        >
                            <Plus className="w-3.5 h-3.5" /> 新建项目
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid/List Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative" onClick={() => setSelectedProjectIds(new Set())}>
                
                {filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                        <FileBox className="w-16 h-16 opacity-20" />
                        <div className="text-center">
                            <h3 className="text-sm font-bold text-slate-500">这里空空如也</h3>
                            <p className="text-xs text-slate-600 mt-1">创建新项目或尝试更改筛选条件</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProjects.map(project => (
                                    <ProjectCard 
                                        key={project.id} 
                                        project={project}
                                        selected={selectedProjectIds.has(project.id)}
                                        onSelect={(multi) => handleToggleSelect(project.id, multi)}
                                        onOpen={() => onOpenProject(project.id)}
                                        userProfile={userProfile}
                                        onOpenSettings={onOpenSettings}
                                        onToggleStar={() => onUpdateProject({ ...project, isStarred: !project.isStarred })}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {filteredProjects.map(project => (
                                    <ProjectRow 
                                        key={project.id} 
                                        project={project}
                                        selected={selectedProjectIds.has(project.id)}
                                        onSelect={(multi) => handleToggleSelect(project.id, multi)}
                                        onOpen={() => onOpenProject(project.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Bulk Actions Bar */}
                {selectedProjectIds.size > 0 && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#1a1c22] border border-slate-700 rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-4 z-50">
                        <span className="text-xs font-bold text-white whitespace-nowrap">已选 {selectedProjectIds.size} 项</span>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <button 
                            onClick={() => handleBulkAction('export')}
                            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                        >
                            <Download className="w-4 h-4" /> 批量导出
                        </button>
                        <button 
                            onClick={() => handleBulkAction('delete')}
                            className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> 删除
                        </button>
                        <div className="h-4 w-px bg-slate-700"></div>
                         <button onClick={() => setSelectedProjectIds(new Set())} className="text-slate-500 hover:text-white">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

// --- Sub Components ---

const SidebarItem: React.FC<{ 
    icon: any, 
    label: string, 
    active?: boolean, 
    count?: number,
    alert?: boolean,
    onClick: () => void 
}> = ({ icon: Icon, label, active, count, alert, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${
            active 
            ? 'bg-indigo-600/10 text-indigo-400 font-bold' 
            : 'text-slate-400 hover:bg-[#1a1c22] hover:text-slate-200'
        }`}
    >
        <div className="flex items-center gap-3">
            <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            <span className="text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            {alert && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Feature limited"></span>}
            {count !== undefined && <span className="text-xs text-slate-600">{count}</span>}
        </div>
    </button>
);

const ProjectCard: React.FC<{
    project: Project;
    selected: boolean;
    onSelect: (multi: boolean) => void;
    onOpen: () => void;
    userProfile: UserProfile;
    onOpenSettings: () => void;
    onToggleStar: () => void;
}> = ({ project, selected, onSelect, onOpen, userProfile, onOpenSettings, onToggleStar }) => {
    
    return (
        <div 
            onClick={(e) => {
                if (e.ctrlKey || e.shiftKey) {
                    e.stopPropagation();
                    onSelect(true);
                } else {
                    onOpen();
                }
            }}
            className={`group relative aspect-video rounded-xl bg-[#0b0c0f] border transition-all cursor-pointer overflow-hidden ${
                selected 
                ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                : 'border-slate-800 hover:border-slate-600 hover:shadow-2xl'
            }`}
        >
            {/* Thumbnail */}
            <div className="absolute inset-0">
                {project.thumbnailUrl ? (
                    <img src={project.thumbnailUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900/20 to-purple-900/20 flex items-center justify-center">
                        <span className="text-4xl font-black text-white/10 select-none">{project.title.substring(0,2)}</span>
                    </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0f] via-[#0b0c0f]/40 to-transparent" />
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
                <StatusBadge status={project.status} />
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
                {project.isPro && <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">PRO</span>}
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
                    className={`p-1 rounded-full backdrop-blur-md transition-colors ${project.isStarred ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-600 hover:text-yellow-400 bg-black/30'}`}
                >
                    <Star className={`w-3.5 h-3.5 ${project.isStarred ? 'fill-yellow-400' : ''}`} />
                </button>
            </div>

            {/* Cloud Sync Icon (Corner Hook) */}
            <div className="absolute bottom-3 right-3 z-20">
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    className="p-1.5 rounded-lg backdrop-blur-md border transition-all bg-green-500/20 text-green-400 border-green-500/30"
                    title="已同步"
                 >
                    <Cloud className="w-3.5 h-3.5" />
                 </button>
            </div>

            {/* Info */}
            <div className="absolute bottom-4 left-4 right-12 z-10">
                <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{project.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                    <span>{project.updatedAt.split(' ')[0]}</span>
                    <span>•</span>
                    <span>{project.sceneCount} Sc / {project.shotCount} Shots</span>
                </div>
            </div>

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[1px]">
                 <button 
                    className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg"
                    title="快速预览"
                    onClick={(e) => { e.stopPropagation(); /* Preview logic */ }}
                 >
                     <Play className="w-5 h-5 ml-0.5" />
                 </button>
                 <button 
                    className="p-3 bg-black/50 text-white border border-white/20 rounded-full hover:bg-black hover:border-white transition-all shadow-lg"
                    title="快速导出"
                    onClick={(e) => { 
                        e.stopPropagation(); 
                    }}
                 >
                     <Download className="w-5 h-5" />
                 </button>
            </div>

            {/* Selection Checkbox (Visible on hover or selected) */}
            <div 
                className={`absolute top-3 left-3 z-30 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                onClick={(e) => { e.stopPropagation(); onSelect(false); }}
            >
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${selected ? 'bg-indigo-600 border-indigo-600' : 'bg-black/50 border-white/30 hover:border-white'}`}>
                    {selected && <CheckIcon className="w-3 h-3 text-white" />}
                </div>
            </div>
        </div>
    );
};

const ProjectRow: React.FC<{
    project: Project;
    selected: boolean;
    onSelect: (multi: boolean) => void;
    onOpen: () => void;
}> = ({ project, selected, onSelect, onOpen }) => (
    <div 
        onClick={(e) => {
             if (e.ctrlKey || e.shiftKey) { e.stopPropagation(); onSelect(true); } 
             else onOpen(); 
        }}
        className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
            selected 
            ? 'bg-indigo-900/20 border-indigo-500/30' 
            : 'bg-[#0b0c0f] border-slate-800 hover:bg-[#131418] hover:border-slate-700'
        }`}
    >
        <div className="w-16 h-10 bg-black rounded overflow-hidden shrink-0">
             {project.thumbnailUrl && <img src={project.thumbnailUrl} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2">
                 <h4 className="text-sm font-bold text-slate-200 truncate">{project.title}</h4>
                 <StatusBadge status={project.status} size="small" />
             </div>
             <div className="text-[10px] text-slate-500 font-mono mt-0.5">{project.updatedAt}</div>
        </div>
        <div className="text-right text-[10px] text-slate-600 font-mono w-24">
            {project.size}
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: Project['status'], size?: 'small' | 'normal' }> = ({ status, size = 'normal' }) => {
    const config = {
        completed: { color: 'bg-green-500', text: '已完结' },
        rendering: { color: 'bg-yellow-500', text: '渲染中', animate: true },
        draft: { color: 'bg-slate-500', text: '草稿' }
    }[status];

    return (
        <div className={`flex items-center gap-1.5 ${size === 'small' ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded-full bg-black/60 backdrop-blur-md border border-white/5`}>
            <span className={`rounded-full ${size === 'small' ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${config.color} ${config.animate ? 'animate-pulse' : ''}`}></span>
            <span className={`text-[9px] font-bold text-slate-300`}>{config.text}</span>
        </div>
    );
};

// Simple Icons
const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);
const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
