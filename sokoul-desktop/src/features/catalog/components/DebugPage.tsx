import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Copy, Bug, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useLogStore } from '@/stores/logStore';

export default function DebugPage() {
  const navigate = useNavigate();
  const { logs, clear } = useLogStore();

  const copyToClipboard = () => {
    const text = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] ${l.category}: ${l.message} ${l.data ? JSON.stringify(l.data) : ''}`).join('\n');
    navigator.clipboard.writeText(text);
    alert('Logs copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 pt-20 font-mono text-sm overflow-hidden flex flex-col">
      <div className="fixed top-0 left-0 right-0 bg-[#161b22] border-b border-white/10 p-4 flex items-center justify-between z-50 h-[60px]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded"><ChevronLeft /></button>
          <h1 className="text-lg font-bold flex items-center gap-2 text-red-400"><Bug /> DIAGNOSTIC</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={copyToClipboard} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 rounded text-xs"><Copy size={14} /> Copy</button>
          <button onClick={clear} className="flex items-center gap-2 px-3 py-1.5 bg-red-600/80 hover:bg-red-500 rounded text-xs"><Trash2 size={14} /> Clear</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-10 mt-4">
        {logs.length === 0 && (
          <div className="text-center text-gray-500 mt-20 flex flex-col items-center">
            <CheckCircle size={48} className="mb-4 opacity-20" />
            <p>No logs recorded.</p>
            <p className="text-xs mt-2">Navigate the app to generate events.</p>
          </div>
        )}
        
        {logs.map(log => (
          <div key={log.id} className={`p-3 rounded border-l-4 ${
            log.level === 'error' ? 'bg-red-900/20 border-red-500' :
            log.level === 'warn' ? 'bg-yellow-900/20 border-yellow-500' :
            log.level === 'success' ? 'bg-green-900/20 border-green-500' :
            'bg-gray-800/40 border-blue-500'
          }`}>
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                {log.level === 'error' && <AlertTriangle size={14} className="text-red-500" />}
                {log.level === 'info' && <Info size={14} className="text-blue-500" />}
                <span className="font-bold text-xs px-1.5 py-0.5 rounded bg-white/10">{log.category}</span>
                <span className="font-semibold">{log.message}</span>
              </div>
              <span className="text-[10px] opacity-50">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            
            {log.data != null && (
              <pre className="mt-2 p-2 bg-black/50 rounded overflow-x-auto text-[10px] text-gray-400 border border-white/5">
                {String(JSON.stringify(log.data, null, 2))}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
