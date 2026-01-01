
import React, { useState, useEffect, useRef } from 'react';
import { List, X, Trash2, CheckCircle2, AlertCircle, Loader2, MapPin, Play, Clock, AlertTriangle } from 'lucide-react';
import { Task, TaskStatus } from '../types';

interface TaskDashboardProps {
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onClearTasks: () => void;
  onLocateTask: (shotId: string) => void;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({
  tasks,
  onDeleteTask,
  onClearTasks,
  onLocateTask
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedTaskIds, setDismissedTaskIds] = useState<Set<string>>(new Set());

  // Dragging State
  const [position, setPosition] = useState({ top: '50%' });
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      
      const startY = e.clientY;
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      
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
          
          if (!hasMoved) {
              // Click
              setIsOpen(prev => !prev);
          }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  };

  // Derive visible failed tasks: active failed tasks that haven't been dismissed
  const failedTasks = tasks.filter(t => t.status === 'failed' && !dismissedTaskIds.has(t.id));
  const activeTasks = tasks.filter(t => t.status === 'running' || t.status === 'pending');

  const handleDismissErrors = () => {
     setDismissedTaskIds(prev => {
        const next = new Set(prev);
        failedTasks.forEach(t => next.add(t.id));
        return next;
     });
  };

  return (
    <>
      {/* 1. Global Notification Banner (Top Center) */}
      {failedTasks.length > 0 && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300 w-full max-w-lg">
           <div className="bg-[#1a1c22] border-l-4 border-red-500 rounded-r-lg shadow-2xl p-4 flex items-start justify-between">
              <div className="flex gap-3">
                 <div className="p-2 bg-red-500/10 rounded-full text-red-500 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-slate-200">全局异常 ({failedTasks.length})</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {failedTasks[0].error || "任务提交失败: 提示词中包含中文或服务不可用"}
                    </p>
                 </div>
              </div>
              <button 
                onClick={handleDismissErrors} 
                className="text-slate-500 hover:text-white p-1 hover:bg-slate-700/50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
           </div>
        </div>
      )}

      {/* 2. Task Indicator (Draggable) */}
      <div 
        ref={buttonRef}
        className="fixed right-4 z-40 flex flex-col gap-3 items-end cursor-move"
        style={{ top: position.top, transform: 'translateY(-50%)' }} 
        onMouseDown={handleMouseDown}
      >
         <div className="relative group/drag">
             <button 
               className={`relative group flex items-center justify-center w-12 h-12 rounded-full shadow-2xl transition-all border-2 border-white/10 ${
                 failedTasks.length > 0 
                   ? 'bg-red-600 text-white hover:bg-red-500' 
                   : 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed]' 
               }`}
               title="按住拖动，点击打开任务列表"
             >
               <List className="w-5 h-5" />
               
               {tasks.length > 0 && (
                 <span className="absolute -top-1 -right-1 flex h-4 w-4">
                   <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${failedTasks.length > 0 ? 'bg-red-400' : 'bg-indigo-400'}`}></span>
                   <span className={`relative inline-flex rounded-full h-4 w-4 ${failedTasks.length > 0 ? 'bg-red-500' : 'bg-indigo-500'} text-[9px] items-center justify-center text-white font-bold`}>
                     {tasks.length}
                   </span>
                 </span>
               )}
             </button>
         </div>
      </div>

      {/* 3. Task List Modal - Modified to stay mounted but hidden */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
            isOpen 
            ? 'bg-black/50 backdrop-blur-sm opacity-100 pointer-events-auto' 
            : 'bg-transparent opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      >
           
           <div 
             className={`relative bg-[#131418] border border-slate-800 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden transition-all duration-300 transform ${
              isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
             }`}
             onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
           >
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0b0c0f]">
                 <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">任务队列</h3>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">{tasks.length}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Use window.confirm explicitly to ensure it works reliably
                        if(window.confirm('确定清空所有任务记录吗？')) {
                            onClearTasks();
                        }
                      }} 
                      className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 hover:bg-slate-800 px-2 py-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 清空
                    </button>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                 </div>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#1a1c22] text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                 <div className="col-span-3">业务 (TASK NAME)</div>
                 <div className="col-span-1">序号</div>
                 <div className="col-span-1">状态</div>
                 <div className="col-span-2">进度</div>
                 <div className="col-span-3">时间信息</div>
                 <div className="col-span-2 text-right">操作</div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-0 bg-[#0b0c0f] custom-scrollbar">
                 {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-600 gap-2">
                       <List className="w-8 h-8 opacity-20" />
                       <span className="text-xs">暂无任务记录</span>
                    </div>
                 ) : (
                    tasks.map(task => (
                        <TaskRow 
                           key={task.id} 
                           task={task} 
                           onDelete={() => onDeleteTask(task.id)}
                           onLocate={() => {
                              if (task.shotId) {
                                  onLocateTask(task.shotId);
                                  setIsOpen(false);
                              }
                           }}
                        />
                    ))
                 )}
              </div>
           </div>
        </div>
    </>
  );
};

const TaskRow: React.FC<{ 
  task: Task; 
  onDelete: () => void; 
  onLocate: () => void;
}> = ({ task, onDelete, onLocate }) => {
  // Initialize progress state based on time to prevent visual reset on remount
  const [displayProgress, setDisplayProgress] = useState(() => {
     if (task.status === 'success') return 100;
     if (task.status === 'running' && task.startTime) {
         const startTimeMs = new Date(task.startTime).getTime();
         if (!isNaN(startTimeMs)) {
            const elapsed = Date.now() - startTimeMs;
            // 0.6% per 10ms -> 0.06% per ms. Let's make it 0.0006 per ms (0.6% per sec)
            return Math.min(95, Math.max(task.progress, elapsed * 0.0006));
         }
     }
     return task.progress;
  });

  useEffect(() => {
    if (task.status === 'success') {
       setDisplayProgress(100);
       return;
    }
    if (task.status === 'failed') {
       return;
    }
    if (task.status === 'pending' || !task.startTime) {
       setDisplayProgress(0);
       return;
    }

    const startTimeMs = new Date(task.startTime).getTime();
    if (isNaN(startTimeMs)) return;

    const update = () => {
        const now = Date.now();
        const elapsed = now - startTimeMs;
        const calculated = Math.min(95, elapsed * 0.0006);
        setDisplayProgress(Math.max(task.progress, calculated));
    };

    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [task.status, task.startTime, task.progress]);

  const getStatusColor = (s: TaskStatus) => {
     switch(s) {
        case 'running': return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
        case 'success': return 'text-green-400 border-green-500/30 bg-green-500/10';
        case 'failed': return 'text-red-400 border-red-500/30 bg-red-500/10';
        default: return 'text-slate-400 border-slate-600/30 bg-slate-600/10';
     }
  };

  const getStatusLabel = (s: TaskStatus) => {
     switch(s) {
        case 'running': return '执行中';
        case 'success': return '成功';
        case 'failed': return '失败';
        case 'pending': return '排队';
     }
  };

  // Helper to safely display time strings
  const displayTime = (isoString: string | undefined) => {
      if (!isoString) return '';
      try {
          const date = new Date(isoString);
          return date.toLocaleTimeString();
      } catch (e) {
          return isoString.split(' ')[1] || isoString;
      }
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-800/50 items-center hover:bg-[#131418] transition-colors group text-xs">
       
       {/* Name */}
       <div className="col-span-3 font-medium text-slate-300 truncate pr-2">
          {task.name}
          {task.description && <div className="text-[10px] text-slate-500 mt-0.5 truncate">{task.description}</div>}
       </div>

       {/* Seq */}
       <div className="col-span-1 text-slate-400 font-mono">
          {task.sceneNumber && task.shotNumber ? `S${task.sceneNumber}-${task.shotNumber}` : '-'}
       </div>

       {/* Status */}
       <div className="col-span-1">
          <span className={`px-2 py-1 rounded text-[10px] border ${getStatusColor(task.status)} font-bold inline-flex items-center gap-1`}>
             {task.status === 'running' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
             {getStatusLabel(task.status)}
          </span>
       </div>

       {/* Progress */}
       <div className="col-span-2">
          <div className="flex items-center gap-2">
             <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${task.status === 'failed' ? 'bg-red-500' : 'bg-indigo-500'}`}
                  style={{ width: `${task.status === 'failed' ? 100 : displayProgress}%` }}
                ></div>
             </div>
             <span className="text-[10px] text-slate-500 w-8 text-right">{Math.floor(displayProgress)}%</span>
          </div>
       </div>

       {/* Time / Error Info */}
       <div className="col-span-3">
          {task.status === 'failed' ? (
             <div className="text-red-400 truncate flex items-center gap-1 bg-red-900/10 px-2 py-1 rounded border border-red-900/30">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span title={task.error}>异常: {task.error}</span>
             </div>
          ) : (
             <div className="flex flex-col gap-1 text-[10px] text-slate-500">
                <div className="flex items-center gap-1">
                   <Clock className="w-3 h-3" />
                   提交: {displayTime(task.submitTime)}
                </div>
                {task.startTime && (
                   <div className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      开始: {displayTime(task.startTime)}
                   </div>
                )}
             </div>
          )}
       </div>

       {/* Action */}
       <div className="col-span-2 flex justify-end gap-2 opacity-100">
          <button 
             onClick={onLocate}
             disabled={!task.shotId}
             className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] disabled:bg-slate-800 disabled:text-slate-500"
          >
             定位
          </button>
          <button 
             onClick={onDelete}
             className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px]"
          >
             删除
          </button>
       </div>
    </div>
  );
};
