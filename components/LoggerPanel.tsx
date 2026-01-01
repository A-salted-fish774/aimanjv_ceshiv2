
import React, { useEffect, useState } from 'react';
import { logger, LogEntry } from '../utils/logger';
import { X, Trash2, ChevronDown, ChevronRight, Activity } from 'lucide-react';

export const LoggerPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe(setLogs);
    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-0 left-0 h-96 bg-[#0f1115]/95 backdrop-blur-md border-b border-slate-700 shadow-2xl z-[100] flex flex-col font-mono text-xs animate-in slide-in-from-top-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-[#0b0c0f]">
        <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">系统监控日志 (System Monitor)</span>
            <span className="bg-slate-800 text-slate-500 px-1.5 rounded">{logs.length}</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => logger.clear()} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors" title="清空日志">
                <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors" title="关闭面板">
                <X className="w-4 h-4" />
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {logs.map(log => (
            <div key={log.id} className="border border-slate-800 rounded bg-[#131418] overflow-hidden">
                <div 
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                        log.type === 'err' ? 'bg-red-900/10 hover:bg-red-900/20' : 
                        log.type === 'warn' ? 'bg-yellow-900/10 hover:bg-yellow-900/20' :
                        'hover:bg-slate-800/50'
                    }`}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                    <span className="text-slate-600 w-16 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    
                    {log.type === 'req' && <span className="text-blue-400 font-bold px-1 rounded border border-blue-400/20 bg-blue-400/10 w-10 text-center shrink-0">REQ</span>}
                    {log.type === 'res' && <span className="text-green-400 font-bold px-1 rounded border border-green-400/20 bg-green-400/10 w-10 text-center shrink-0">RES</span>}
                    {log.type === 'err' && <span className="text-red-400 font-bold px-1 rounded border border-red-400/20 bg-red-400/10 w-10 text-center shrink-0">ERR</span>}
                    {log.type === 'warn' && <span className="text-yellow-400 font-bold px-1 rounded border border-yellow-400/20 bg-yellow-400/10 w-10 text-center shrink-0">WRN</span>}
                    {log.type === 'info' && <span className="text-slate-400 font-bold px-1 rounded border border-slate-400/20 bg-slate-400/10 w-10 text-center shrink-0">INF</span>}

                    <span className={`flex-1 truncate ${
                        log.type === 'err' ? 'text-red-300' : 
                        log.type === 'warn' ? 'text-yellow-300' :
                        'text-slate-300'
                    }`}>
                        {log.title}
                    </span>
                    
                    {log.data && (
                        expandedId === log.id ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />
                    )}
                </div>
                
                {expandedId === log.id && log.data && (
                    <div className="p-3 bg-[#0b0c0f] border-t border-slate-800 overflow-x-auto">
                        <pre className="text-slate-400 leading-relaxed whitespace-pre-wrap break-all max-h-64 overflow-y-auto custom-scrollbar">
                            {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
                        </pre>
                    </div>
                )}
            </div>
        ))}
        {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                <Activity className="w-8 h-8 opacity-20" />
                <span>暂无活动日志，请操作左侧功能...</span>
            </div>
        )}
      </div>
    </div>
  );
};