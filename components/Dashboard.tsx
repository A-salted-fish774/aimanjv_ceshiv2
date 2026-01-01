
import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Settings, 
  Search, 
  Clapperboard, 
  FolderOpen,
  MoreHorizontal,
  FileText,
  Clock,
  Sparkles,
  Crown,
  Edit,
  Trash2,
  Copy,
  Star,
  ExternalLink,
  X,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Zap,
  PieChart,
  Activity,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { UserProfile, Project } from '../types';

interface DashboardProps {
  onOpenScriptInput: () => void;
  userProfile: UserProfile;
  onOpenSettings: () => void;
  onNavigateToProjects?: () => void;
  
  // Data & Handlers
  projects?: Project[];
  onOpenProject?: (id: string) => void;
  onUpdateProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onDuplicateProject?: (id: string) => void;
  onImportProject?: (file: File) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    onOpenScriptInput,
    userProfile,
    onOpenSettings,
    onNavigateToProjects,
    projects = [],
    onOpenProject,
    onUpdateProject,
    onDeleteProject,
    onDuplicateProject,
    onImportProject
}) => {
  const recentProjects = projects.filter(p => !p.isDeleted).slice(0, 5);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Rename & Delete Logic State
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  // Stats Modal State
  const [showStats, setShowStats] = useState(false);

  // File Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
        window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const handleStartRename = (project: Project) => {
      setRenamingProjectId(project.id);
      setNewName(project.title);
      setActiveMenuId(null); // Close menu
  };

  const submitRename = () => {
      if (renamingProjectId && newName.trim() && onUpdateProject) {
          const project = projects.find(p => p.id === renamingProjectId);
          if (project) {
              onUpdateProject({ ...project, title: newName.trim() });
          }
      }
      setRenamingProjectId(null);
  };

  const confirmDelete = () => {
      if (deleteTargetId && onDeleteProject) {
          onDeleteProject(deleteTargetId);
      }
      setDeleteTargetId(null);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImportProject) {
        onImportProject(file);
    }
    // Reset value so same file can be selected again if needed
    if (event.target) event.target.value = '';
  };

  // Calculate stats for the card
  const totalShots = projects.reduce((acc, curr) => acc + (curr.isDeleted ? 0 : curr.shotCount), 0);

  return (
    <div className="flex h-screen w-screen bg-[#030303] text-slate-300 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* Stats Modal */}
      <StatsModal 
        isOpen={showStats} 
        onClose={() => setShowStats(false)} 
        projects={projects}
        userProfile={userProfile}
      />

      {/* Rename Modal Overlay */}
      {renamingProjectId && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={() => setRenamingProjectId(null)}>
              <div className="bg-[#1a1c22] border border-slate-700 rounded-xl p-6 w-96 shadow-2xl flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white">重命名工程</h3>
                  <input 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#0b0c0f] border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') submitRename(); }}
                  />
                  <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setRenamingProjectId(null)}
                        className="px-4 py-2 text-slate-400 hover:text-white"
                      >
                          取消
                      </button>
                      <button 
                        onClick={submitRename}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
                      >
                          保存
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={() => setDeleteTargetId(null)}>
              <div className="bg-[#1a1c22] border border-red-900/50 rounded-xl p-6 w-96 shadow-2xl flex flex-col gap-4 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  {/* Background Accents */}
                  <div className="absolute top-0 right-0 p-12 bg-red-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 relative z-10">
                      <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      确认删除
                  </h3>
                  
                  <div className="relative z-10">
                    <p className="text-sm text-slate-300">
                        确定要删除此工程吗？
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        项目将被移入回收站，您可以在那里恢复或永久删除它。
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 mt-2 relative z-10">
                      <button 
                        onClick={() => setDeleteTargetId(null)}
                        className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                          取消
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-lg shadow-red-900/30 transition-all hover:scale-105"
                      >
                          确认删除
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Minimal Sidebar */}
      <aside className="w-[70px] lg:w-64 bg-[#050505] border-r border-white/5 flex flex-col shrink-0 z-20 transition-all duration-300">
        {/* Brand Area */}
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
           <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-black text-lg tracking-tighter shadow-[0_0_15px_rgba(255,255,255,0.3)]">
             A
           </div>
           <span className="hidden lg:block ml-3 font-bold text-white tracking-wide text-sm">AniScript</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          <NavItem icon={Home} label="工作台" active />
          <NavItem icon={FolderOpen} label="我的工程" onClick={onNavigateToProjects} />
        </nav>

        {/* User Area */}
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={onOpenSettings}
            className="flex items-center gap-3 w-full p-2 hover:bg-white/5 rounded-lg transition-colors group"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg ring-2 ring-[#050505] ${
                userProfile.plan === 'pro' 
                ? 'bg-gradient-to-tr from-yellow-500 to-amber-600'
                : 'bg-gradient-to-tr from-indigo-500 to-purple-500'
            }`}>
              {userProfile.name.substring(0, 2)}
            </div>
            <div className="hidden lg:block text-left">
               <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                   {userProfile.name}
                   {userProfile.plan === 'pro' && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
               </div>
               <div className="text-[10px] text-slate-500">
                   {userProfile.plan === 'pro' ? '专业版' : '体验版'}
               </div>
            </div>
            <Settings className="w-4 h-4 ml-auto text-slate-600 group-hover:text-white hidden lg:block" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#030303] relative">
        {/* Subtle Background Glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Minimal Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 z-10">
           <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></span>
              系统运行正常
           </div>
           
           <div className="flex items-center gap-4">
              {/* Search Removed */}
           </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
           <div className="max-w-6xl mx-auto">
              
              {/* Greeting */}
              <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <h1 className="text-3xl font-light text-white mb-2 tracking-tight">
                    欢迎回来，<span className="font-normal text-indigo-400">导演</span>。
                 </h1>
                 <p className="text-sm text-slate-500 font-light">
                    准备好将今天的灵感转化为视觉了吗？
                 </p>
              </div>

              {/* Primary Action - The "Hero" Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                 
                 {/* Main Create Card */}
                 <div 
                    onClick={onOpenScriptInput}
                    className="md:col-span-2 relative h-64 group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] hover:border-indigo-500/50 transition-all duration-500 shadow-2xl shadow-black/50"
                 >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                       <div className="flex justify-between items-start">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                             <Clapperboard className="w-6 h-6 text-slate-300 group-hover:text-white" />
                          </div>
                          <div className="px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                             Version 3.5
                          </div>
                       </div>

                       <div>
                          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                             新建 AI 漫剧项目
                             <Sparkles className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h2>
                          <p className="text-sm text-slate-400 max-w-md group-hover:text-slate-300 transition-colors">
                             全流程 AI 辅助：从剧本分析到分镜绘制，再到视频生成。支持智能角色一致性与专业运镜推演。
                          </p>
                       </div>
                    </div>
                    
                    {/* Decorative Abstract Shapes */}
                    <div className="absolute right-[-50px] top-[-50px] w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                    <div className="absolute bottom-[-20px] right-[10%] w-40 h-40 bg-purple-500/5 rounded-full blur-2xl" />
                 </div>

                 {/* Secondary Actions / Stats */}
                 <div className="md:col-span-1 flex flex-col gap-4">
                    {/* Import Project Card - Activated */}
                    <div 
                        onClick={handleImportClick}
                        className="flex-1 bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex flex-col justify-center hover:bg-white/10 hover:border-indigo-500/30 transition-all cursor-pointer group relative overflow-hidden"
                    >
                       <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".json,.ani" 
                            onChange={handleFileChange}
                       />
                       {/* Background Glow on Hover */}
                       <div className="absolute top-0 right-0 p-12 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                       
                       <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-500 group-hover:text-white transition-colors border border-white/5 group-hover:scale-110 duration-300">
                          <FolderOpen className="w-5 h-5 text-slate-400 group-hover:text-white" />
                       </div>
                       <h3 className="font-bold text-slate-300 group-hover:text-white transition-colors">导入本地工程</h3>
                       <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-400">支持 .json / .ani 格式</p>
                    </div>

                    {/* Stats Card - Upgraded */}
                    <div 
                        onClick={() => setShowStats(true)}
                        className="flex-1 bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group cursor-pointer hover:bg-white/[0.02] hover:border-indigo-500/30 transition-all"
                    >
                       <div className="flex justify-between items-start z-10">
                          <div>
                            <h3 className="text-3xl font-light text-white group-hover:scale-105 transition-transform origin-left">{totalShots}</h3>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                                本周生成分镜
                                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                          </div>
                          <div className="p-2 bg-white/5 rounded-lg text-slate-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                             <BarChart3 className="w-5 h-5" />
                          </div>
                       </div>
                       <div className="absolute right-4 bottom-4 w-16 h-1 bg-gradient-to-r from-indigo-500 to-transparent rounded-full opacity-50 group-hover:w-32 transition-all" />
                       <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                 </div>
              </div>

              {/* Recent Files List - UPDATED STRUCTURE */}
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 pb-10">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                       <Clock className="w-4 h-4" /> 最近编辑
                    </h3>
                    <button onClick={onNavigateToProjects} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">查看全部</button>
                 </div>

                 {/* Explicit container with no overflow hidden, but specific z-index stacking */}
                 <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl min-h-[100px] flex flex-col relative z-0">
                    {/* List Header */}
                    <div className="grid grid-cols-12 px-6 py-3 border-b border-white/5 text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-[#0A0A0A] rounded-t-2xl z-10 relative">
                       <div className="col-span-6">工程名称</div>
                       <div className="col-span-2">类型</div>
                       <div className="col-span-3">最后修改</div>
                       <div className="col-span-1 text-right">操作</div>
                    </div>

                    {/* Project Items */}
                    {recentProjects.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-slate-600 text-xs">
                            暂无最近项目，开始创作吧！
                        </div>
                    ) : (
                        recentProjects.map((project, index) => {
                            const isLast = index === recentProjects.length - 1;
                            const isNearBottom = index >= recentProjects.length - 2 && recentProjects.length > 2;
                            const isMenuOpen = activeMenuId === project.id;

                            return (
                            <div 
                                key={project.id}
                                className={`grid grid-cols-12 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors group cursor-pointer relative ${
                                    isLast ? 'rounded-b-2xl' : 'border-b border-white/5'
                                } ${isMenuOpen ? 'z-50 bg-[#131418] shadow-2xl rounded-xl border border-white/5 my-[-1px]' : 'z-0'}`}
                                onClick={() => onOpenProject?.(project.id)}
                            >
                                <div className="col-span-6 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                                            {project.title}
                                            {project.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                        </h4>
                                        <p className="text-[10px] text-slate-600 mt-0.5">{project.folderId ? '目录 / ' : '/Projects/'}{project.id}</p>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-1 rounded border border-white/5">
                                        原创剧本
                                    </span>
                                </div>
                                <div className="col-span-3 text-xs text-slate-500 font-mono">
                                    {project.updatedAt}
                                </div>
                                <div className="col-span-1 flex justify-end relative">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === project.id ? null : project.id);
                                        }}
                                        className={`p-2 rounded-lg transition-colors relative z-20 ${activeMenuId === project.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>

                                    {/* Context Menu */}
                                    {isMenuOpen && (
                                        <>
                                        {/* Click Backdrop - Fixed full screen to catch all clicks */}
                                        <div 
                                            className="fixed inset-0 z-30 bg-transparent" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(null);
                                            }}
                                        />
                                        <div 
                                            className={`absolute right-0 z-40 w-48 bg-[#1a1c22] border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right ring-1 ring-white/10 ${
                                                isNearBottom ? 'bottom-full mb-2 origin-bottom-right' : 'top-full mt-2'
                                            }`}
                                            onClick={(e) => e.stopPropagation()} 
                                        >
                                            <div className="p-1.5 space-y-0.5">
                                                <MenuItem 
                                                    icon={ExternalLink} 
                                                    label="打开工程" 
                                                    onClick={(e) => {
                                                        e.stopPropagation(); 
                                                        onOpenProject?.(project.id);
                                                        setActiveMenuId(null);
                                                    }}
                                                />
                                                <MenuItem 
                                                    icon={Edit} 
                                                    label="重命名" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartRename(project);
                                                    }}
                                                />
                                                <MenuItem 
                                                    icon={Copy} 
                                                    label="创建副本" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDuplicateProject?.(project.id);
                                                        setActiveMenuId(null);
                                                    }}
                                                />
                                                <MenuItem 
                                                    icon={Star} 
                                                    label={project.isStarred ? "取消收藏" : "设为星标"}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onUpdateProject) {
                                                            onUpdateProject({ ...project, isStarred: !project.isStarred });
                                                        }
                                                        setActiveMenuId(null);
                                                    }}
                                                />
                                                <div className="h-px bg-slate-700/50 my-1" />
                                                <MenuItem 
                                                    icon={Trash2} 
                                                    label="删除" 
                                                    isDanger 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteTargetId(project.id); // Trigger Modal
                                                        setActiveMenuId(null); // Close Menu
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )})
                    )}
                 </div>
              </div>

           </div>
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ElementType, label: string, active?: boolean, onClick?: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all mb-1 ${
     active 
     ? 'bg-white/10 text-white font-medium' 
     : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
  }`}>
     <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : ''}`} />
     <span className="hidden lg:block text-sm">{label}</span>
  </button>
);

const MenuItem: React.FC<{ icon: React.ElementType, label: string, onClick: (e: React.MouseEvent) => void, isDanger?: boolean }> = ({ icon: Icon, label, onClick, isDanger }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-colors group ${
            isDanger 
            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`}
    >
        <Icon className={`w-3.5 h-3.5 ${isDanger ? '' : 'text-slate-500 group-hover:text-white transition-colors'}`} />
        <span className="font-medium">{label}</span>
    </button>
);

// --- Stats Modal ---

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    userProfile: UserProfile;
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, projects, userProfile }) => {
    if (!isOpen) return null;

    // Mock Data Calculation
    const totalShots = projects.reduce((acc, p) => acc + (p.isDeleted ? 0 : p.shotCount), 0);
    const activeProjects = projects.filter(p => !p.isDeleted && p.status !== 'completed').length;
    
    // Mock daily activity for the chart (Fixed 7 Days)
    const currentData = [12, 18, 5, 24, 8, 32, 15];
    const maxActivity = Math.max(...currentData);
    const labels7d = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#131418] border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0b0c0f]">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                             <Activity className="w-5 h-5" />
                         </div>
                         <div>
                             <h2 className="text-xl font-bold text-white">生产力数据中心</h2>
                             <p className="text-xs text-slate-500">数据统计与效率分析</p>
                         </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    
                    {/* 1. Overview Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <StatCard 
                            icon={Clapperboard} 
                            label="本周生成分镜" 
                            value={totalShots} 
                            trend="+12%" 
                            trendUp 
                            color="indigo"
                        />
                         <StatCard 
                            icon={FolderOpen} 
                            label="活跃项目数" 
                            value={activeProjects} 
                            color="purple"
                        />
                        <StatCard 
                            icon={Zap} 
                            label="消耗算力 (点数)" 
                            value={Math.floor(totalShots * 1.5)} 
                            subtext={`剩余: ${userProfile.plan === 'pro' ? '∞' : userProfile.credits}`}
                            color="yellow"
                        />
                        <StatCard 
                            icon={TrendingUp} 
                            label="生产效率评级" 
                            value="高效" 
                            trend="前 10%"
                            trendUp
                            color="green"
                        />
                    </div>

                    {/* 2. Main Chart Section */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Bar Chart */}
                        <div className="col-span-2 bg-[#0b0c0f] border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-300 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-slate-500" />
                                    创作活跃度趋势 (近 7 天)
                                </h3>
                            </div>
                            
                            <div className="h-48 flex items-end justify-between gap-2 px-2">
                                {currentData.map((val, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group min-w-[2%]">
                                        <div className="relative w-full flex justify-center items-end h-[150px]">
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                {val} 镜头
                                            </div>
                                            {/* Bar */}
                                            <div 
                                                className="w-full max-w-[24px] bg-indigo-600 rounded-t-sm opacity-60 group-hover:opacity-100 transition-all hover:bg-indigo-500"
                                                style={{ height: `${Math.max(4, (val / maxActivity) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-600 font-mono truncate w-full text-center">
                                            {labels7d[idx]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pie Chart / Distribution */}
                        <div className="col-span-1 bg-[#0b0c0f] border border-slate-800 rounded-xl p-6 flex flex-col">
                            <h3 className="font-bold text-slate-300 flex items-center gap-2 mb-6">
                                <PieChart className="w-4 h-4 text-slate-500" />
                                项目精力分布
                            </h3>
                            <div className="flex-1 flex flex-col justify-center gap-4">
                                {projects.slice(0, 4).map((p, idx) => (
                                    <div key={p.id}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400 truncate max-w-[120px]">{p.title}</span>
                                            <span className="text-slate-600">{p.shotCount} 镜头</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500'][idx % 4]}`} 
                                                style={{ width: `${Math.min(100, (p.shotCount / Math.max(1, totalShots)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {projects.length === 0 && <div className="text-xs text-slate-600 text-center">无数据</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ 
    icon: any, 
    label: string, 
    value: number | string, 
    trend?: string, 
    trendUp?: boolean,
    subtext?: string, 
    color: 'indigo' | 'purple' | 'green' | 'yellow'
}> = ({ icon: Icon, label, value, trend, trendUp, subtext, color }) => {
    
    const colors = {
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
        yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    }[color];

    return (
        <div className="bg-[#0b0c0f] border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${colors} border`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trendUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
                {subtext && <div className="text-[10px] text-slate-600 mt-2 pt-2 border-t border-slate-800">{subtext}</div>}
            </div>
        </div>
    );
};
