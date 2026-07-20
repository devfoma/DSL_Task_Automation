'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BackgroundShader from '@/components/BackgroundShader';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [infoMsg, setInfoMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setErrorMsg('');
    setInfoMsg('');
    setIsLoading(true);

    if (!supabase) {
      // Supabase is not configured, simulate success
      setInfoMsg('Supabase not configured. Simulating profile creation...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setInfoMsg('Account created successfully! Check email for confirmation or proceed to login.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-on-background relative overflow-hidden select-none font-sans">
      <BackgroundShader />

      <div className="w-[440px] h-[600px] p-lg glass-panel rounded-2xl border border-white/15 z-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-md">
        <div className="text-center flex flex-col gap-xs">
          <img src="/logo.png" alt="DSL Task Automator Logo" className="w-10 h-10 object-contain mx-auto" />
          <h2 className="font-display font-black text-2xl text-white tracking-tight mt-sm">
            Create an Account
          </h2>
          <p className="text-xs text-on-surface-variant">
            Register below to start scheduling task automations.
          </p>
        </div>

        {errorMsg && (
          <div className="p-sm bg-error-container/10 border border-error/20 rounded-lg text-xs text-error">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="p-sm bg-primary-container/10 border border-primary-container/20 rounded-lg text-xs text-primary-fixed">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-md">
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-container text-on-primary-container py-2.5 rounded-full font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_20px_rgba(0,242,254,0.6)] transition-all active:scale-95 text-sm disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center text-xs text-on-surface-variant border-t border-white/5 pt-md">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary-container hover:underline font-semibold">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
