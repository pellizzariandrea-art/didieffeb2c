'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import uiLabels from '@/config/ui-labels.json';
import {
  Home,
  User,
  MapPin,
  Shield,
  Package,
  BarChart3,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

export default function MyAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const { currentLang, syncWithUserProfile } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  // Helper function to get translated labels (memoized to update when language changes)
  const getLabel = useCallback((path: string): string => {
    const keys = path.split('.');
    let value: any = uiLabels;
    for (const key of keys) {
      value = value?.[key];
    }
    return value?.[currentLang] || value?.['it'] || path;
  }, [currentLang]);

  // Sync language with user profile when user logs in
  useEffect(() => {
    if (user?.preferredLanguage) {
      syncWithUserProfile(user.preferredLanguage);
    }
  }, [user?.preferredLanguage, syncWithUserProfile]);

  // Load logo from settings
  useEffect(() => {
    async function loadLogo() {
      try {
        const response = await fetch('/api/settings/public');
        if (response.ok) {
          const data = await response.json();
          if (data.settings?.logo?.base64) {
            setLogoUrl(data.settings.logo.base64);
          }
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    }
    loadLogo();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Redirect if not logged in
      if (!user) {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Navigation array with translations (memoized to update when language changes)
  // MUST be before early returns to comply with Rules of Hooks
  const navigation = useMemo(() => [
    { name: getLabel('user_area.nav.dashboard'), href: '/orders', icon: Home, exact: true },
    { name: getLabel('user_area.nav.profile'), href: '/orders?tab=profile', icon: User },
    { name: getLabel('user_area.nav.addresses'), href: '/orders?tab=addresses', icon: MapPin },
    { name: getLabel('user_area.nav.security'), href: '/orders?tab=security', icon: Shield },
    { name: getLabel('user_area.nav.orders'), href: '/orders?tab=orders', icon: Package },
    { name: getLabel('user_area.nav.reports'), href: '/orders?tab=reports', icon: BarChart3 },
  ], [currentLang, getLabel]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{getLabel('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Don't render if not logged in
  if (!user) {
    return null;
  }

  const isActive = (href: string, exact?: boolean) => {
    // For reports pages, highlight the Reports menu item
    if (pathname.startsWith('/my-account/reports')) {
      return href.includes('tab=reports');
    }
    if (exact) {
      return pathname === href && !window.location.search;
    }
    return window.location.href.includes(href);
  };

  const isB2B = user.role === 'b2b';
  const userName = isB2B ? user.ragioneSociale : `${user.nome} ${user.cognome}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/30">
      {/* Sidebar Desktop */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${
        sidebarOpen ? 'w-72' : 'w-20'
      } hidden lg:block`}>
        <div className="h-full flex flex-col bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 border-r border-emerald-700 shadow-2xl">
          {/* Logo Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-emerald-700 bg-emerald-900/50">
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="bg-white rounded-lg px-3 py-2 shadow-md">
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        width={180}
                        height={40}
                        className="h-8 w-auto object-contain max-w-[140px]"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">U</span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-bold text-white">{getLabel('user_area.title')}</h1>
                    <p className="text-xs text-emerald-400">{getLabel('user_area.subtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-emerald-700 text-emerald-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="mx-auto p-2 rounded-lg hover:bg-emerald-700 text-emerald-400 hover:text-white transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                      : 'text-emerald-300 hover:bg-emerald-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${!sidebarOpen && 'mx-auto'}`} />
                  {sidebarOpen && (
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{item.name}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="p-4 border-t border-emerald-700 bg-emerald-900/50">
            {sidebarOpen ? (
              <div className="space-y-3">
                <div className="px-3 py-2">
                  <p className="text-xs text-emerald-400 mb-1">{getLabel('user_area.account')}</p>
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  <p className="text-xs text-emerald-400 truncate">{user.email}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/products"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-300 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{getLabel('auth.back_to_catalog')}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{getLabel('auth.logout')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/products"
                  className="p-2 text-emerald-400 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
                  title={getLabel('auth.back_to_catalog')}
                >
                  <ArrowLeft className="w-5 h-5 mx-auto" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  title={getLabel('auth.logout')}
                >
                  <LogOut className="w-5 h-5 mx-auto" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside className="fixed top-0 left-0 z-50 h-screen w-72 bg-emerald-900">
            <div className="h-full flex flex-col">
              {/* Mobile Header */}
              <div className="h-20 flex items-center justify-between px-6 border-b border-emerald-700">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="bg-white rounded-lg px-3 py-2 shadow-md">
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        width={180}
                        height={40}
                        className="h-8 w-auto object-contain max-w-[140px]"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">U</span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-bold text-white">{getLabel('user_area.title')}</h1>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-emerald-700 text-emerald-400"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        active
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                          : 'text-emerald-300 hover:bg-emerald-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile User Info */}
              <div className="p-4 border-t border-emerald-700 bg-emerald-900/50">
                <div className="space-y-3">
                  <div className="px-3 py-2">
                    <p className="text-xs text-emerald-400 mb-1">{getLabel('user_area.account')}</p>
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <p className="text-xs text-emerald-400">{user.email}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/products"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-300 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{getLabel('auth.back_to_catalog')}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{getLabel('auth.logout')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 border-b border-emerald-700 shadow-xl">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-emerald-700 text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          {logoUrl ? (
            <div className="bg-white rounded-lg px-3 py-1.5 shadow-md">
              <Image
                src={logoUrl}
                alt="Logo"
                width={120}
                height={30}
                className="h-6 w-auto object-contain max-w-[100px]"
              />
            </div>
          ) : (
            <span className="text-lg font-bold text-white">{getLabel('user_area.title')}</span>
          )}
          <div className="w-10"></div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'
      } pt-16 lg:pt-0`}>
        {children}
      </main>
    </div>
  );
}
