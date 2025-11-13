'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import uiLabels from '@/config/ui-labels.json';

interface SettingsResponse {
  success: boolean;
  settings: {
    company: {
      name: string;
      address?: string;
      city?: string;
      postalCode?: string;
      province?: string;
      country?: string;
      website?: string;
      email?: string;
      phone?: string;
      vatNumber?: string;
      taxCode?: string;
    };
    logo?: {
      base64: string;
      type: string;
    };
  };
}

export default function UserAreaHeader() {
  const { logout } = useAuth();
  const { currentLang: language } = useLanguage();
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsResponse | null>(null);

  const labels = uiLabels.auth;

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error loading settings:', err));
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check if base64 already includes the data URI prefix
  const logoSrc = settings?.settings?.logo
    ? (settings.settings.logo.base64.startsWith('data:')
        ? settings.settings.logo.base64
        : `data:${settings.settings.logo.type};base64,${settings.settings.logo.base64}`)
    : null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-2xl">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <div className="bg-white rounded-lg px-3 py-2 shadow-md">
                <img
                  src={logoSrc}
                  alt={settings?.settings?.company?.name || 'Logo'}
                  className="h-8 w-auto object-contain max-w-[140px]"
                />
              </div>
            ) : (
              <span className="text-xl font-bold text-white">
                {settings?.settings?.company?.name || 'Company'}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:border-slate-500 transition-all shadow-lg font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{labels.back_to_catalog?.[language] || 'Back to catalog'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-500 bg-red-600 text-white hover:bg-red-700 hover:border-red-600 transition-all shadow-lg font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{labels.logout[language]}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
