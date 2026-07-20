'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BackgroundShader from '@/components/BackgroundShader';
import { DSLInterpreter, LogMessage } from '@/lib/interpreter';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [selectedDemo, setSelectedDemo] = useState<string>('ping');
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Auth modal states
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authInfo, setAuthInfo] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleLaunchDashboard = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      setAuthMode('login');
      setAuthError('Please sign in or create an account to access the dashboard.');
      setShowAuthModal(true);
    }
  };

  const DEMO_SCRIPTS: Record<string, { title: string; desc: string; code: string }> = {
    ping: {
      title: 'API Health Ping',
      desc: 'Polls external REST APIs and logs responses.',
      code: `# Poll API health
log "Initializing server checks..."
http get "https://jsonplaceholder.typicode.com/todos/1"
log "API status: operational."`
    },
    files: {
      title: 'Log Sync File',
      desc: 'Creates a simulated backup report file.',
      code: `# Sync and write report
log "Beginning sync routine..."
create file "system_report.json" with content "{\\"status\\":\\"healthy\\"}"
read file "system_report.json"
log "Report successfully generated."`
    },
    wait: {
      title: 'Sleep Execution',
      desc: 'Pauses task execution pipelines.',
      code: `# Delay process pipeline
log "Entering maintenance mode..."
sleep 2 seconds
log "Maintenance completed. Resuming standard tasks."`
    }
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const runDemo = async (scriptKey: string) => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    setSelectedDemo(scriptKey);
    setLogs([]);

    const interpreter = new DSLInterpreter(
      {}, // Empty virtual file system for sandbox demo
      (logMsg) => setLogs((prev) => [...prev, logMsg]),
      () => {},
      () => {}
    );

    try {
      await interpreter.run(DEMO_SCRIPTS[scriptKey].code);
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toLocaleTimeString(),
          type: 'error',
          message: err.message || 'Error occurred.'
        }
      ]);
    } finally {
      setIsDemoRunning(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthInfo('');
    setAuthLoading(true);

    if (authMode === 'signup' && password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      setAuthLoading(false);
      return;
    }

    if (!supabase) {
      setAuthInfo('Supabase not configured. Simulating profile processing...');
      setTimeout(() => {
        setShowAuthModal(false);
        router.push('/dashboard');
      }, 1500);
      return;
    }

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setAuthError(error.message);
        } else {
          setAuthInfo('Login successful! Redirecting...');
          setTimeout(() => {
            setShowAuthModal(false);
            router.push('/dashboard');
          }, 1000);
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setAuthError(error.message);
        } else {
          setAuthInfo('Account created! Loading login tab...');
          setTimeout(() => {
            setAuthMode('login');
            setPassword('');
            setConfirmPassword('');
            setAuthInfo('');
          }, 2000);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background font-sans relative overflow-hidden select-none">
      {/* Liquid WebGL Background Shader */}
      <BackgroundShader />

      {/* Glassmorphic navigation header */}
      <header className="h-16 border-b border-white/10 glass-panel flex items-center justify-between px-lg z-10 sticky top-0">
        <div className="flex items-center gap-md">
          <img src="/logo.png" alt="DSL Task Automator Logo" className="h-10 w-auto object-contain" />
          <span className="font-display font-bold text-headline-sm tracking-tight text-white">
            DSL Task Automator
          </span>
        </div>
        <div className="flex items-center gap-md">
          <button
            onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
            className="text-on-surface-variant hover:text-white text-sm font-medium transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
            className="flex items-center gap-sm bg-primary-container text-on-primary-container px-lg py-1.5 rounded-full font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_20px_rgba(0,242,254,0.6)] transition-all active:scale-95 text-sm cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main hero & showcase */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-lg py-xl flex flex-col gap-xl justify-center z-10">
        
        {/* Hero section */}
        <section className="text-center flex flex-col items-center gap-md max-w-3xl mx-auto">
          <h1 className="font-display font-black text-white text-4xl md:text-5xl tracking-tight leading-tight">
            Automate Workflows using the <span className="text-primary-container">Domain-Specific Language (DSL) Task Automator</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-3xl leading-relaxed text-center">
            Write clean, plain-text commands to schedule file tasks, sync logs, and run HTTP hooks. No complex scripting required—just direct task instructions compiled in real-time.
          </p>
          <div className="flex gap-md mt-sm">
            <Link
              href="/dashboard"
              onClick={handleLaunchDashboard}
              className="flex items-center gap-sm bg-primary-container text-on-primary-container px-xl py-3 rounded-full font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_20px_rgba(0,242,254,0.6)] transition-all active:scale-95"
            >
              Launch Dashboard
            </Link>
            <button
              onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
              className="px-xl py-3 rounded-full font-bold border border-white/10 hover:bg-white/5 text-white transition-all active:scale-95 cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </section>

        {/* Live Simulator & Sandbox Playground */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-stretch mt-lg">
          {/* Features description column */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-md pr-sm">
            <span className="text-xs uppercase font-bold text-tertiary-fixed tracking-widest">Interactive Sandbox</span>
            <h2 className="font-display font-bold text-3xl text-white">Execute custom scripts instantly</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Test out the automation DSL directly on the right. Select one of the preset automation models and watch the compiler run tasks line-by-line.
            </p>
            <div className="flex flex-col gap-sm mt-xs">
              {Object.entries(DEMO_SCRIPTS).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => runDemo(key)}
                  disabled={isDemoRunning}
                  className={`p-md rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selectedDemo === key
                      ? 'bg-primary-container/10 border-primary-container/30 text-white'
                      : 'bg-white/2 border-white/5 text-on-surface-variant hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  <span className="font-display font-semibold text-xs text-white">{data.title}</span>
                  <span className="text-[11px] text-outline leading-tight">{data.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Code sandbox visualizer column */}
          <div className="lg:col-span-7 glass-panel rounded-2xl flex flex-col overflow-hidden h-96 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {/* Top header bar */}
            <div className="p-md bg-surface-container-high/50 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary" />
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono">sandbox_demo.lscript</span>
            </div>

            {/* Editor preview */}
            <div className="flex-1 flex overflow-hidden">
              <pre className="flex-1 bg-surface-container-lowest/30 p-md font-mono text-xs text-on-surface/90 overflow-y-auto leading-relaxed border-r border-white/5 select-text">
                <code>{DEMO_SCRIPTS[selectedDemo].code}</code>
              </pre>

              {/* Console log outputs */}
              <div className="w-72 flex flex-col bg-black/35 overflow-hidden">
                <div className="p-sm bg-surface-container/50 border-b border-white/5 text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">
                  Live Console
                </div>
                <div className="flex-1 p-sm overflow-y-auto font-mono text-[10px] space-y-1.5">
                  {logs.length === 0 ? (
                    <span className="text-outline italic">Sandbox idle. Click any task preset to run.</span>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex gap-sm items-start border-b border-white/2.5 pb-0.5">
                        <span className={`text-[8px] uppercase px-1 rounded ${
                          log.type === 'success' ? 'bg-tertiary-container/10 text-tertiary-fixed' :
                          log.type === 'error' ? 'bg-error-container/10 text-error' :
                          'bg-primary-container/10 text-primary-fixed'
                        }`}>
                          {log.type}
                        </span>
                        <span className="text-on-surface/90 break-all leading-tight">{log.message}</span>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DSL Automation Examples */}
        <section className="max-w-2xl mx-auto w-full mt-xl">
          {/* Examples Panel */}
          <div className="glass-panel p-lg rounded-2xl border border-white/10 flex flex-col gap-md">
            <h3 className="font-display font-bold text-xl text-white">Examples of Automation Routines</h3>
            <p className="text-on-surface-variant text-xs">
              Review how commands are structured to perform common tasks.
            </p>
            <div className="space-y-sm">
              <div className="bg-black/20 p-sm rounded-lg border border-white/5 font-mono text-[11px] text-on-surface/90">
                <span className="text-primary-fixed"># Create and read log check</span>
                <p>create file "status.log" with content "Healthy"</p>
                <p>read file "status.log"</p>
              </div>
              <div className="bg-black/20 p-sm rounded-lg border border-white/5 font-mono text-[11px] text-on-surface/90">
                <span className="text-primary-fixed"># Sleep and poll health</span>
                <p>sleep 5 seconds</p>
                <p>http get "https://api.github.com/users/supabase"</p>
              </div>
              <div className="bg-black/20 p-sm rounded-lg border border-white/5 font-mono text-[11px] text-on-surface/90">
                <span className="text-primary-fixed"># Append task records</span>
                <p>append file "audit.txt" with content "Job completed"</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-lg border-t border-white/5 z-10 bg-black/15">
        <div className="max-w-6xl mx-auto px-lg flex flex-col md:flex-row items-center justify-between gap-md text-xs text-on-surface-variant">
          <div className="flex items-center gap-sm">
            <img src="/logo.png" alt="DSL Task Automator Logo" className="w-5 h-5 object-contain" />
            <span className="font-semibold text-white">DSL Task Automator</span>
          </div>
          <div className="flex gap-lg">
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
          <div>
            &copy; {new Date().getFullYear()} DSL Task Automator IDE. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-md transition-all duration-300 overflow-y-auto"
          onClick={() => {
            setShowAuthModal(false);
            setAuthError('');
            setAuthInfo('');
          }}
        >
          <div 
            className={`w-[440px] max-w-full ${authMode === 'signup' ? 'h-[620px]' : 'h-[520px]'} p-lg glass-panel rounded-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between relative transition-all duration-300`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => {
                setShowAuthModal(false);
                setAuthError('');
                setAuthInfo('');
              }}
              className="absolute top-4 right-4 p-1 hover:bg-white/5 rounded-full text-on-surface-variant hover:text-white transition-colors cursor-pointer z-20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            {/* Modal Logo & Headers */}
            <div className="text-center flex flex-col gap-xs">
              <img src="/logo.png" alt="DSL Task Automator Logo" className="w-10 h-10 object-contain mx-auto" />
              <h2 className="font-display font-black text-xl text-white tracking-tight mt-sm">
                {authMode === 'login' ? 'Sign in to Task Automator' : 'Create an Account'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {authMode === 'login' ? 'Enter credentials to access dashboard.' : 'Register to schedule automated task scripts.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-white/5 border border-white/10 p-0.5 rounded-full">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); setAuthInfo(''); }}
                className={`flex-1 py-1.5 text-center rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  authMode === 'login' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthInfo(''); }}
                className={`flex-1 py-1.5 text-center rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  authMode === 'signup' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="p-sm bg-error-container/10 border border-error/20 rounded-lg text-xs text-error">
                {authError}
              </div>
            )}

            {authInfo && (
              <div className="p-sm bg-primary-container/10 border border-primary-container/20 rounded-lg text-xs text-primary-fixed">
                {authInfo}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg px-md py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary-container"
                  required
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg px-md py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary-container"
                  required
                />
              </div>

              {authMode === 'signup' && (
                <div className="flex flex-col gap-xs">
                  <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-lowest/50 border border-white/10 rounded-lg px-md py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary-container"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-primary-container text-on-primary-container py-2.5 rounded-full font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_20px_rgba(0,242,254,0.6)] transition-all active:scale-95 text-sm cursor-pointer disabled:opacity-50"
              >
                {authLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
