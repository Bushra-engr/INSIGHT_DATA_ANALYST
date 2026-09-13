import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Lock, Mail, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function AuthModal() {
  const { authModal, setAuthModal, loginUser, registerUser, continueAsGuest } = useApp();
  const [mode, setMode] = useState(authModal.mode || 'login');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authModal.isOpen) return null;

  const handleTabChange = (newMode) => {
    setMode(newMode);
    setName('');
    setIdentifier('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim();
    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
    }
    if (!cleanId) {
      setError(mode === 'login' ? 'Please enter your email or username.' : 'Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (mode === 'register') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginUser(cleanId, password);
      } else {
        await registerUser(name.trim(), cleanId, password);
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setName('');
    setIdentifier('');
    setPassword('');
    setAuthModal({ isOpen: false, mode: 'login' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 relative space-y-4">
        {/* Animated Loading Bar */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
            <div className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 animate-pulse w-full shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
          </div>
        )}
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 border border-blue-200 dark:border-blue-800">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' 
              ? 'Sign in to access your saved datasets & history' 
              : 'Register to unlock full database persistence & reports'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              mode === 'login' 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              mode === 'register' 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Inline Error Banner */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex flex-col gap-1.5 animate-in fade-in duration-150">
            <div className="flex items-start gap-2 font-semibold leading-snug">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
            {mode === 'login' && /register|exist/i.test(error) && (
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className="text-left text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pl-6 cursor-pointer"
              >
                Click here to Register this account &rarr;
              </button>
            )}
            {mode === 'register' && /already registered|sign in/i.test(error) && (
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className="text-left text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pl-6 cursor-pointer"
              >
                Already have an account? Sign in &rarr;
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {mode === 'login' ? 'Email or Username' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={mode === 'login' ? 'text' : 'email'}
                required
                placeholder={mode === 'login' ? 'Enter email or username' : 'name@company.com'}
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Password</label>
              {mode === 'register' && (
                <span className="text-[10px] text-slate-400">Min. 8 characters</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={mode === 'register' ? 8 : 1}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all disabled:opacity-50 mt-2 shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            {loading 
              ? (mode === 'login' ? 'Verifying Account...' : 'Creating Account...') 
              : (mode === 'login' ? 'Sign In to Workspace' : 'Create Free Account')}
          </button>
        </form>

        {/* Guest Session Bypass */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              setError('');
              continueAsGuest();
            }}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium py-1.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Continue as Guest Analyst &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
