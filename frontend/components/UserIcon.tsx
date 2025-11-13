'use client';

// components/UserIcon.tsx
// User Authentication Icon with Inline Login Form

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, LogOut, Settings, AlertCircle } from 'lucide-react';
import uiLabels from '@/config/ui-labels.json';
import { login } from '@/lib/firebase/auth';

export default function UserIcon() {
  const { user, logout, loading } = useAuth();
  const { currentLang: language } = useLanguage();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const labels = uiLabels.auth;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      await login(email, password);
      setIsOpen(false);
      setEmail('');
      setPassword('');
      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Errore durante il login');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative">
        <button
          disabled
          className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <User className="w-5 h-5 text-gray-400 animate-pulse" />
        </button>
      </div>
    );
  }

  // Not logged in - show login form dropdown
  if (!user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
          title={labels.login[language]}
        >
          <User className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
        </button>

        {/* Login Form Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
            <form onSubmit={handleLogin} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {labels.login[language]}
              </h3>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                  {labels.email[language]}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={labels.email[language]}
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                  {labels.password[language]}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={labels.password[language]}
                />
              </div>

              {/* Error Message */}
              {loginError && (
                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">{loginError}</p>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loginLoading ? '...' : labels.login[language]}
              </button>

              {/* Register Link */}
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="block w-full py-2 px-4 bg-gray-100 text-gray-700 text-sm font-medium text-center rounded-md hover:bg-gray-200 transition-colors"
              >
                {labels.register[language]}
              </Link>

              {/* Forgot Password */}
              <Link
                href="/auth/forgot-password"
                onClick={() => setIsOpen(false)}
                className="block text-xs text-blue-600 hover:text-blue-700 text-center"
              >
                {labels.forgot_password[language]}
              </Link>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Logged in - show dropdown menu
  const displayName = user.role === 'admin'
    ? `${user.nome} ${user.cognome}`
    : user.role === 'b2c'
    ? `${user.nome} ${user.cognome}`
    : user.ragioneSociale;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
        title={displayName}
      >
        <User className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {user.role === 'admin' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  Admin
                </span>
              )}
              {user.role === 'b2c' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {labels.b2c_customer[language]}
                </span>
              )}
              {user.role === 'b2b' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  {labels.b2b_customer[language]}
                </span>
              )}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* User Panel (B2C/B2B) */}
            {(user.role === 'b2c' || user.role === 'b2b') && (
              <Link
                href="/orders"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="w-4 h-4 mr-3 text-gray-400" />
                {labels.user_panel[language]}
              </Link>
            )}

            {/* Admin Panel */}
            {user.role === 'admin' && (
              <Link
                href="/admin-panel"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="w-4 h-4 mr-3 text-gray-400" />
                {labels.admin_panel[language]}
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-3" />
              {labels.logout[language]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
