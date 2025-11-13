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

  const logoSrc = settings?.settings?.logo
    ? `data:${settings.settings.logo.type};base64,${settings.settings.logo.base64}`
    : null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={settings?.settings?.company?.name || 'Logo'}
                className="h-12 w-auto object-contain max-w-[200px]"
              />
            ) : (
              <span className="text-xl font-bold text-gray-900">
                {settings?.settings?.company?.name || 'Company'}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">{labels.back_to_catalog?.[language] || 'Back to catalog'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">{labels.logout[language]}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
