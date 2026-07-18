'use client';

import React, { useState, useEffect, useRef } from 'react';
import BackgroundShader from '@/components/BackgroundShader';
import ThreeVisualizer from '@/components/ThreeVisualizer';
import { DSLInterpreter, LogMessage, ScheduledTask } from '@/lib/interpreter';

// Default files structure
const DEFAULT_FILES: Record<string, string> = {
  'api_monitor.lscript': `# API Monitoring & File generation
log "Starting health check automation..."
http get "https://jsonplaceholder.typicode.com/todos/1"
create file "server_status.json" with content "{\\"status\\":\\"active\\",\\"checkedAt\\":\\"now\\"}"
log "Health check complete. Log saved to server_status.json"
`,
  'db_cleanup.lscript': `# Cleanup temporary log files
log "Scanning virtual workspace for old logs..."
create file "temp_log.txt" with content "temporary log content"
read file "temp_log.txt"
delete file "temp_log.txt"
log "Workspace cleanup successfully finished."
`,
  'scheduled_alert.lscript': `# Scheduled health check
every 10 seconds do {
  log "Performing automated ping test..."
  http get "https://jsonplaceholder.typicode.com/posts/1"
}
`
};

export default function Home() {
  // State variables
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('api_monitor.lscript');
  const [editorContent, setEditorContent] = useState<string>('');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [schedules, setSchedules] = useState<ScheduledTask[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'templates' | 'scheduler' | 'settings'>('editor');
  
  // Customization options
  const [backgroundType, setBackgroundType] = useState<'shader' | 'three' | 'none'>('shader');
  const [bgOpacity, setBgOpacity] = useState<number>(30);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newFileName, setNewFileName] = useState<string>('');
  const [showNewFileModal, setShowNewFileModal] = useState<boolean>(false);

  // Interval references for active scheduler tasks
  const scheduleIntervals = useRef<Record<string, NodeJS.Timeout>>({});
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Load from local storage
  useEffect(() => {
    const savedFiles = localStorage.getItem('lscript_files');
    const savedSchedules = localStorage.getItem('lscript_schedules');
    
    if (savedFiles) {
      const parsedFiles = JSON.parse(savedFiles);
      setFiles(parsedFiles);
      if (parsedFiles[selectedFile]) {
        setEditorContent(parsedFiles[selectedFile]);
      }
    } else {
      setFiles(DEFAULT_FILES);
      localStorage.setItem('lscript_files', JSON.stringify(DEFAULT_FILES));
      setEditorContent(DEFAULT_FILES[selectedFile]);
    }

    if (savedSchedules) {
      const parsedSchedules = JSON.parse(savedSchedules);
      setSchedules(parsedSchedules);
      // Restart active schedules
      parsedSchedules.forEach((task: ScheduledTask) => {
        if (task.isActive) {
          startTaskInterval(task);
        }
      });
    }
  }, []);

  // Sync editor content when selected file changes
  useEffect(() => {
    if (files[selectedFile] !== undefined) {
      setEditorContent(files[selectedFile]);
    }
  }, [selectedFile, files]);

  // Scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Clean up all scheduled intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(scheduleIntervals.current).forEach(clearInterval);
    };
  }, []);

  const saveFilesToLocal = (newFiles: Record<string, string>) => {
    setFiles(newFiles);
    localStorage.setItem('lscript_files', JSON.stringify(newFiles));
  };

  const saveSchedulesToLocal = (newSchedules: ScheduledTask[]) => {
    setSchedules(newSchedules);
    localStorage.setItem('lscript_schedules', JSON.stringify(newSchedules));
  };

  // Add a log message
  const addLog = (type: LogMessage['type'], message: string) => {
    const newLog: LogMessage = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Update current file content in workspace
  const handleEditorChange = (val: string) => {
    setEditorContent(val);
    const updated = { ...files, [selectedFile]: val };
    saveFilesToLocal(updated);
  };

  // Handle schedule task execution
  const startTaskInterval = (task: ScheduledTask) => {
    // Clear existing if any
    if (scheduleIntervals.current[task.id]) {
      clearInterval(scheduleIntervals.current[task.id]);
    }

    const intervalId = setInterval(() => {
      // Run the code block inside interpreter
      const interpreter = new DSLInterpreter(
        files,
        (logMsg) => setLogs((prev) => [...prev, logMsg]),
        (updatedFiles) => saveFilesToLocal(updatedFiles),
        () => {} // No nested schedules
      );
      
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleTimeString(),
          type: 'info',
          message: `[Trigger] Running scheduled task: "${task.name}"`,
        },
      ]);
      
      interpreter.run(task.code);

      // Update last run time
      setSchedules((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            const now = new Date().toLocaleTimeString();
            const next = new Date(Date.now() + task.interval * 1000).toLocaleTimeString();
            return { ...t, lastRun: now, nextRun: next };
          }
          return t;
        })
      );
    }, task.interval * 1000);

    scheduleIntervals.current[task.id] = intervalId;
  };

  const stopTaskInterval = (taskId: string) => {
    if (scheduleIntervals.current[taskId]) {
      clearInterval(scheduleIntervals.current[taskId]);
      delete scheduleIntervals.current[taskId];
    }
  };

  // Run the full current script
  const handleRunScript = async () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog('info', `Initializing execution of "${selectedFile}"...`);

    const interpreter = new DSLInterpreter(
      files,
      (logMsg) => setLogs((prev) => [...prev, logMsg]),
      (updatedFiles) => saveFilesToLocal(updatedFiles),
      (schedTask) => {
        // Register new schedule
        const newSched: ScheduledTask = {
          id: Math.random().toString(36).substring(7),
          name: schedTask.name,
          interval: schedTask.interval,
          code: schedTask.code,
          isActive: true,
          nextRun: new Date(Date.now() + schedTask.interval * 1000).toLocaleTimeString(),
        };
        setSchedules((prev) => {
          const updated = [...prev, newSched];
          saveSchedulesToLocal(updated);
          return updated;
        });
        startTaskInterval(newSched);
      }
    );

    try {
      await interpreter.run(editorContent);
      addLog('success', `Finished execution of "${selectedFile}".`);
    } catch (error: any) {
      addLog('error', `Execution aborted: ${error.message || error}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Create virtual file
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.endsWith('.lscript') ? newFileName.trim() : `${newFileName.trim()}.lscript`;
    if (name in files) {
      alert('File already exists.');
      return;
    }
    const updated = { ...files, [name]: '# New Automation script\n' };
    saveFilesToLocal(updated);
    setSelectedFile(name);
    setNewFileName('');
    setShowNewFileModal(false);
    addLog('info', `Created file "${name}" in workspace.`);
  };

  // Delete virtual file
  const handleDeleteFile = (fileNameToDelete: string) => {
    if (Object.keys(files).length <= 1) {
      alert('You must keep at least one file in the workspace.');
      return;
    }
    const updated = { ...files };
    delete updated[fileNameToDelete];
    saveFilesToLocal(updated);
    if (selectedFile === fileNameToDelete) {
      setSelectedFile(Object.keys(updated)[0]);
    }
    addLog('warn', `Deleted file "${fileNameToDelete}" from workspace.`);
  };

  // Add a preset template
  const handleAddTemplate = (name: string, content: string) => {
    const filename = `${name.toLowerCase().replace(/\s+/g, '_')}.lscript`;
    const updated = { ...files, [filename]: content };
    saveFilesToLocal(updated);
    setSelectedFile(filename);
    setActiveTab('editor');
    addLog('success', `Imported template "${name}" as "${filename}".`);
  };

  // Toggle active scheduled task status
  const handleToggleSchedule = (task: ScheduledTask) => {
    const updated = schedules.map((t) => {
      if (t.id === task.id) {
        const nextActive = !t.isActive;
        if (nextActive) {
          startTaskInterval({ ...t, isActive: true });
          addLog('info', `Resumed scheduled job "${t.name}"`);
        } else {
          stopTaskInterval(t.id);
          addLog('warn', `Suspended scheduled job "${t.name}"`);
        }
        return { ...t, isActive: nextActive };
      }
      return t;
    });
    saveSchedulesToLocal(updated);
  };

  // Remove scheduled task completely
  const handleRemoveSchedule = (taskId: string) => {
    stopTaskInterval(taskId);
    const updated = schedules.filter((t) => t.id !== taskId);
    saveSchedulesToLocal(updated);
    addLog('warn', `Removed task schedule.`);
  };

  // Helper to color highlight words in the simple preview
  const renderHighlightedCode = () => {
    const keywords = ['create', 'file', 'with', 'content', 'read', 'append', 'delete', 'log', 'every', 'seconds', 'do', 'wait', 'sleep', 'http', 'get', 'post'];
    return editorContent.split('\n').map((line, idx) => {
      if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
        return <div key={idx} className="text-outline italic">{line}</div>;
      }
      // Simple coloring
      let elements: React.ReactNode[] = [line];
      return (
        <div key={idx} className="font-mono text-on-surface">
          {line.split(/(\s+)/).map((word, wIdx) => {
            const cleanWord = word.toLowerCase().trim();
            if (keywords.includes(cleanWord)) {
              return <span key={wIdx} className="text-primary-container font-semibold">{word}</span>;
            }
            if (word.startsWith('"') && word.endsWith('"')) {
              return <span key={wIdx} className="text-tertiary-fixed-dim">{word}</span>;
            }
            return <span key={wIdx}>{word}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden relative select-none">
      
      {/* Background Graphic elements */}
      {backgroundType === 'shader' && <BackgroundShader />}
      {backgroundType === 'three' && <ThreeVisualizer />}
      <div 
        className="absolute inset-0 bg-background -z-10 pointer-events-none transition-opacity duration-300"
        style={{ opacity: 1 - bgOpacity / 100 }}
      />

      {/* Header bar */}
      <header className="h-16 border-b border-white/10 glass-panel flex items-center justify-between px-lg z-10">
        <div className="flex items-center gap-md">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-container to-secondary-container flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.3)]">
            <span className="text-on-primary-fixed font-black text-sm">LG</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-headline-sm tracking-tight text-white flex items-center gap-xs">
              Liquid Glass <span className="text-[10px] uppercase tracking-widest text-primary-fixed px-2 py-0.5 rounded bg-primary-container/10 border border-primary-container/20">IDE</span>
            </h1>
          </div>
        </div>

        {/* Center menu */}
        <nav className="flex gap-sm">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-md py-1.5 rounded-full text-body-sm font-medium transition-all ${
              activeTab === 'editor' ? 'bg-white/10 text-white border border-white/20' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-md py-1.5 rounded-full text-body-sm font-medium transition-all ${
              activeTab === 'templates' ? 'bg-white/10 text-white border border-white/20' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`px-md py-1.5 rounded-full text-body-sm font-medium transition-all relative ${
              activeTab === 'scheduler' ? 'bg-white/10 text-white border border-white/20' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Scheduler
            {schedules.filter(t => t.isActive).length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-tertiary-fixed animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-md py-1.5 rounded-full text-body-sm font-medium transition-all ${
              activeTab === 'settings' ? 'bg-white/10 text-white border border-white/20' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Settings
          </button>
        </nav>

        {/* Right side buttons */}
        <div className="flex items-center gap-md">
          <button
            onClick={handleRunScript}
            disabled={isRunning}
            className={`flex items-center gap-sm bg-primary-container text-on-primary-container px-lg py-1.5 rounded-full font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_20px_rgba(0,242,254,0.6)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRunning ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-on-primary-container animate-ping" />
                Running...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Run Task
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Workspace */}
      <div className="flex-1 flex overflow-hidden p-panel-margin gap-panel-margin">
        
        {/* Left Panel: Files Explorer */}
        <div className="w-72 glass-panel rounded-xl flex flex-col z-10">
          <div className="p-md border-b border-white/5 flex justify-between items-center">
            <span className="font-display font-semibold text-xs tracking-wider text-on-surface-variant uppercase">Workspace Files</span>
            <button 
              onClick={() => setShowNewFileModal(true)}
              className="p-1 hover:bg-white/5 rounded-full text-on-surface-variant hover:text-white transition-colors"
              title="New Script"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>

          {/* New file modal inside sidebar */}
          {showNewFileModal && (
            <div className="p-md border-b border-white/5 bg-white/5 flex flex-col gap-2">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename.lscript"
                className="w-full bg-surface-container-lowest/80 border border-white/10 rounded px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => setShowNewFileModal(false)}
                  className="px-2 py-1 text-[10px] rounded hover:bg-white/5 text-on-surface-variant"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFile}
                  className="px-2 py-1 text-[10px] rounded bg-primary-container text-on-primary-container font-semibold"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-sm space-y-1">
            {Object.keys(files).map((fileName) => (
              <div
                key={fileName}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer group transition-all ${
                  selectedFile === fileName
                    ? 'bg-primary-container/10 border border-primary-container/20 text-primary-fixed'
                    : 'text-on-surface/75 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setSelectedFile(fileName)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span className="text-body-sm truncate">{fileName}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(fileName);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-error transition-all p-0.5 rounded"
                  title="Delete File"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Virtual File System Preview stats */}
          <div className="p-md border-t border-white/5 bg-surface-container-lowest/50 text-[10px] text-on-surface-variant flex flex-col gap-1">
            <span className="uppercase tracking-wider font-semibold">Virtual Storage status</span>
            <div className="flex justify-between">
              <span>Total Files:</span>
              <span className="text-white font-mono">{Object.keys(files).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Schedules Running:</span>
              <span className="text-tertiary-fixed font-mono">{schedules.filter(t => t.isActive).length}</span>
            </div>
          </div>
        </div>

        {/* Central Panel: Switching tabs */}
        <div className="flex-1 flex flex-col gap-panel-margin z-10 overflow-hidden">
          
          {/* Main workspace panels */}
          <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col">
            
            {activeTab === 'editor' && (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                
                {/* Visual script editor */}
                <div className="flex-1 flex flex-col border-r border-white/5 overflow-hidden">
                  <div className="p-md border-b border-white/5 flex justify-between items-center bg-surface-container/50">
                    <span className="font-mono text-xs text-primary-fixed">{selectedFile}</span>
                    <span className="text-[10px] text-on-surface-variant">Press &apos;Run Task&apos; to execute</span>
                  </div>
                  <textarea
                    value={editorContent}
                    onChange={(e) => handleEditorChange(e.target.value)}
                    className="flex-1 bg-surface-container-lowest/40 font-mono text-code-md text-on-surface p-md focus:outline-none resize-none overflow-y-auto leading-relaxed border-none focus:ring-0"
                    placeholder="# Write your automation tasks here..."
                    spellCheck={false}
                  />
                </div>

                {/* Live Parser Highlighted view */}
                <div className="w-80 flex flex-col bg-surface-container-lowest/20 overflow-hidden">
                  <div className="p-md border-b border-white/5 bg-surface-container/50">
                    <span className="font-display font-semibold text-xs tracking-wider text-on-surface-variant uppercase">Token Highlights</span>
                  </div>
                  <div className="flex-1 p-md overflow-y-auto font-mono text-xs space-y-1 bg-black/25">
                    {renderHighlightedCode()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="flex-1 p-lg overflow-y-auto flex flex-col gap-lg">
                <div>
                  <h2 className="font-display font-bold text-headline-md text-white">Preset Templates</h2>
                  <p className="text-body-sm text-on-surface-variant">Quickly import pre-built DSL scripts to test features.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                  
                  {/* Card 1 */}
                  <div className="glass-panel-interactive rounded-lg p-md flex flex-col justify-between h-48">
                    <div>
                      <div className="flex justify-between items-center mb-sm">
                        <span className="text-[10px] bg-primary-container/10 border border-primary-container/20 text-primary-fixed px-2 py-0.5 rounded font-semibold font-mono">FILE_OP</span>
                        <span className="text-[10px] text-outline">STABLE</span>
                      </div>
                      <h3 className="font-display font-bold text-headline-sm text-white mb-xs">Sync Logs</h3>
                      <p className="text-body-sm text-on-surface-variant line-clamp-2">Reads logs, performs simulated checks, updates a file, and completes.</p>
                    </div>
                    <button
                      onClick={() => handleAddTemplate('Sync Logs', `# Task Sync automation\nlog "Starting syncing routine..."\ncreate file "dest.txt" with content "synchronized log data"\nread file "dest.txt"\nlog "Syncing routine successfully complete."`)}
                      className="mt-md w-full bg-white/5 hover:bg-primary-container hover:text-on-primary-fixed border border-white/10 rounded py-1.5 text-xs font-semibold text-white transition-all"
                    >
                      Import Template
                    </button>
                  </div>

                  {/* Card 2 */}
                  <div className="glass-panel-interactive rounded-lg p-md flex flex-col justify-between h-48">
                    <div>
                      <div className="flex justify-between items-center mb-sm">
                        <span className="text-[10px] bg-tertiary-fixed/10 border border-tertiary-fixed/20 text-tertiary-fixed px-2 py-0.5 rounded font-semibold font-mono">API_POLL</span>
                        <span className="text-[10px] text-outline">STABLE</span>
                      </div>
                      <h3 className="font-display font-bold text-headline-sm text-white mb-xs">API Check</h3>
                      <p className="text-body-sm text-on-surface-variant line-clamp-2">Sends HTTP GET requests to fetch online placeholder resources.</p>
                    </div>
                    <button
                      onClick={() => handleAddTemplate('API Check', `# Check REST APIs\nlog "Requesting API..."\nhttp get "https://jsonplaceholder.typicode.com/posts/1"\nlog "Request check successful!"`)}
                      className="mt-md w-full bg-white/5 hover:bg-primary-container hover:text-on-primary-fixed border border-white/10 rounded py-1.5 text-xs font-semibold text-white transition-all"
                    >
                      Import Template
                    </button>
                  </div>

                  {/* Card 3 */}
                  <div className="glass-panel-interactive rounded-lg p-md flex flex-col justify-between h-48">
                    <div>
                      <div className="flex justify-between items-center mb-sm">
                        <span className="text-[10px] bg-secondary/10 border border-secondary/20 text-secondary px-2 py-0.5 rounded font-semibold font-mono">SCHEDULER</span>
                        <span className="text-[10px] text-outline">CRON</span>
                      </div>
                      <h3 className="font-display font-bold text-headline-sm text-white mb-xs">Job Alert</h3>
                      <p className="text-body-sm text-on-surface-variant line-clamp-2">Runs a recurring automation flow block indefinitely every 5 seconds.</p>
                    </div>
                    <button
                      onClick={() => handleAddTemplate('Job Alert', `# Repeat task automation\nevery 5 seconds do {\n  log "Recurring checks..."\n}`)}
                      className="mt-md w-full bg-white/5 hover:bg-primary-container hover:text-on-primary-fixed border border-white/10 rounded py-1.5 text-xs font-semibold text-white transition-all"
                    >
                      Import Template
                    </button>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'scheduler' && (
              <div className="flex-1 p-lg overflow-y-auto flex flex-col gap-lg">
                <div>
                  <h2 className="font-display font-bold text-headline-md text-white">Active Scheduler Tasks</h2>
                  <p className="text-body-sm text-on-surface-variant">Monitor and control loops configured inside your scripts.</p>
                </div>

                {schedules.length === 0 ? (
                  <div className="flex-1 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-xl text-center">
                    <svg className="w-12 h-12 text-on-surface-variant/40 mb-md" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-on-surface font-semibold mb-xs">No active scheduled loops</h3>
                    <p className="text-body-sm text-on-surface-variant max-w-sm">Use the syntax &quot;every X seconds do &#123; ... &#125;&quot; in your script to spin up scheduled runner tasks.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-md">
                    {schedules.map((task) => (
                      <div key={task.id} className="glass-panel p-md rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-md border border-white/5">
                        <div className="flex gap-md items-start">
                          <div className={`p-2 rounded-full ${task.isActive ? 'bg-tertiary-container/10 text-tertiary-fixed' : 'bg-white/5 text-on-surface-variant'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-sm">
                              <h3 className="font-display font-bold text-body-md text-white">{task.name}</h3>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold ${task.isActive ? 'bg-tertiary-container/10 text-tertiary-fixed border border-tertiary-fixed/20' : 'bg-white/5 text-outline border border-white/10'}`}>
                                {task.isActive ? 'ACTIVE' : 'SUSPENDED'}
                              </span>
                            </div>
                            <p className="text-xs text-on-surface-variant font-mono mt-1">Runs: every {task.interval} seconds</p>
                            <div className="flex gap-md mt-sm text-[10px] text-on-surface-variant">
                              <span>Last Triggered: <strong className="text-white font-mono">{task.lastRun || 'Never'}</strong></span>
                              <span>Next Trigger: <strong className="text-white font-mono">{task.nextRun || 'Pending'}</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-sm items-center self-end md:self-center">
                          <button
                            onClick={() => handleToggleSchedule(task)}
                            className={`px-sm py-1 rounded text-xs font-semibold border ${
                              task.isActive
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                : 'bg-tertiary-container/10 border-tertiary-fixed/30 text-tertiary-fixed hover:bg-tertiary-container/20'
                            }`}
                          >
                            {task.isActive ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            onClick={() => handleRemoveSchedule(task.id)}
                            className="px-sm py-1 rounded text-xs font-semibold bg-error/10 border border-error/30 text-error hover:bg-error/20"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="flex-1 p-lg overflow-y-auto flex flex-col gap-lg">
                <div>
                  <h2 className="font-display font-bold text-headline-md text-white">System Settings &amp; Personalization</h2>
                  <p className="text-body-sm text-on-surface-variant">Modify active glass overlays, animations and virtual FS metrics.</p>
                </div>

                <div className="glass-panel p-md rounded-xl space-y-md border border-white/5">
                  <h3 className="font-display font-semibold text-body-md text-white">Visual Effects Control</h3>
                  
                  {/* Switch animations */}
                  <div className="flex flex-col gap-sm">
                    <label className="text-body-sm text-on-surface-variant">Background Graphics Engine</label>
                    <div className="flex gap-sm">
                      <button
                        onClick={() => setBackgroundType('shader')}
                        className={`px-md py-1.5 rounded text-xs font-semibold border ${
                          backgroundType === 'shader' ? 'bg-primary-container text-on-primary-container border-primary-container' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                        }`}
                      >
                        WebGL Organic Shader
                      </button>
                      <button
                        onClick={() => setBackgroundType('three')}
                        className={`px-md py-1.5 rounded text-xs font-semibold border ${
                          backgroundType === 'three' ? 'bg-primary-container text-on-primary-container border-primary-container' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                        }`}
                      >
                        Three.js Node Graph
                      </button>
                      <button
                        onClick={() => setBackgroundType('none')}
                        className={`px-md py-1.5 rounded text-xs font-semibold border ${
                          backgroundType === 'none' ? 'bg-primary-container text-on-primary-container border-primary-container' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                        }`}
                      >
                        Disabled (Static Canvas)
                      </button>
                    </div>
                  </div>

                  {/* Opacity slider */}
                  <div className="flex flex-col gap-sm pt-sm">
                    <div className="flex justify-between">
                      <label className="text-body-sm text-on-surface-variant">Animation Glow Opacity</label>
                      <span className="text-xs font-mono text-white">{bgOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bgOpacity}
                      onChange={(e) => setBgOpacity(parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-container"
                    />
                  </div>
                </div>

                <div className="glass-panel p-md rounded-xl space-y-md border border-white/5">
                  <h3 className="font-display font-semibold text-body-md text-white">Reset Storage</h3>
                  <p className="text-body-sm text-on-surface-variant">Clear all customized files and virtual states, returning the IDE to its clean-slate layout defaults.</p>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to restore defaults? All virtual scripts will be lost.')) {
                        localStorage.removeItem('lscript_files');
                        localStorage.removeItem('lscript_schedules');
                        setFiles(DEFAULT_FILES);
                        setSelectedFile('api_monitor.lscript');
                        setSchedules([]);
                        addLog('warn', 'Virtual system reset to factory presets.');
                      }
                    }}
                    className="bg-error/10 hover:bg-error/20 border border-error/30 text-error px-md py-2 rounded text-xs font-semibold transition-all"
                  >
                    Restore Workspace Factory Defaults
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Panel: Live scrolling console monitor logs */}
          <div className="h-64 glass-panel rounded-xl flex flex-col overflow-hidden">
            <div className="p-md border-b border-white/5 bg-surface-container/50 flex justify-between items-center flex-shrink-0">
              <span className="font-display font-semibold text-xs tracking-wider text-on-surface-variant uppercase flex items-center gap-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
                Live Console Monitor logs
              </span>
              <button
                onClick={() => setLogs([])}
                className="text-[10px] text-on-surface-variant hover:text-white uppercase font-semibold hover:bg-white/5 px-2 py-1 rounded"
              >
                Clear logs
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-md font-mono text-xs space-y-2 bg-black/45">
              {logs.length === 0 ? (
                <span className="text-outline italic">Console idle. Hit &apos;Run Task&apos; or wait for scheduled trigger updates.</span>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-lg items-start border-b border-white/2.5 pb-1">
                    <span className="text-outline select-none flex-shrink-0">{log.timestamp}</span>
                    <span className={`flex-shrink-0 font-semibold select-none uppercase text-[10px] px-1.5 py-0.5 rounded leading-none ${
                      log.type === 'success' ? 'bg-tertiary-container/10 text-tertiary-fixed border border-tertiary-fixed/20' :
                      log.type === 'warn' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      log.type === 'error' ? 'bg-error-container/10 text-error border border-error/20' :
                      'bg-primary-container/10 text-primary-fixed border border-primary-container/20'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-on-surface break-all white-space-pre-wrap">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
