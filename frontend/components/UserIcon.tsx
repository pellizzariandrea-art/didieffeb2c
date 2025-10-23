'use client';

// components/UserIcon.tsx
// User Authentication Icon with Dropdown Menu

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, LogOut, Package, Settings } from 'lucide-react';
import uiLabels from '@/config/ui-labels.json';

export default function UserIcon() {
  const { user, logout, loading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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

  // Not logged in - show login link
  if (!user) {
    return (
      <Link
        href="/login"
        className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
        title={labels.login[language]}
      >
        <User className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
      </Link>
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
            {/* Orders */}
            {(user.role === 'b2c' || user.role === 'b2b') && (
              <Link
                href="/orders"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Package className="w-4 h-4 mr-3 text-gray-400" />
                {language === 'it' ? 'I miei ordini' : language === 'en' ? 'My orders' : language === 'de' ? 'Meine Bestellungen' : language === 'fr' ? 'Mes commandes' : language === 'es' ? 'Mis pedidos' : 'Meus pedidos'}
              </Link>
            )}

            {/* Admin Dashboard */}
            {user.role === 'admin' && (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com'}/admin`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="w-4 h-4 mr-3 text-gray-400" />
                {language === 'it' ? 'Dashboard Admin' : language === 'en' ? 'Admin Dashboard' : language === 'de' ? 'Admin-Dashboard' : language === 'fr' ? 'Tableau de bord Admin' : language === 'es' ? 'Panel de administración' : 'Painel do administrador'}
              </a>
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
