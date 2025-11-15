'use client';

// app/admin-panel/layout.tsx
// Protected Admin Panel Layout - Modern Premium Design

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import uiLabels from '@/config/ui-labels.json';
import {
  LayoutDashboard,
  Settings,
  Mail,
  FileText,
  Users,
  BarChart3,
  LogOut,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Languages
} from 'lucide-react';

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { currentLang } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

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
      // Redirect if not logged in or not admin
      if (!user) {
        router.push('/?redirect=/admin-panel');
      } else if (user.role !== 'admin') {
        router.push('/'); // Regular users go to homepage
      }
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    if (confirm('Sei sicuro di voler uscire?')) {
      await logout();
      router.push('/');
    }
  };

  // Helper function to get translated labels
  const getLabel = (path: string): string => {
    const keys = path.split('.');
    let value: any = uiLabels;
    for (const key of keys) {
      value = value?.[key];
    }
    return value?.[currentLang] || value?.['it'] || path;
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">{getLabel('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  const navigation = [
    { name: getLabel('admin.nav.dashboard'), href: '/admin-panel', icon: LayoutDashboard, badge: null },
    { name: getLabel('admin.nav.users'), href: '/admin-panel/users', icon: Users, badge: null },
    { name: getLabel('admin.nav.translations'), href: '/admin-panel/translations', icon: Languages, badge: null, subtitle: getLabel('admin.nav.translations_subtitle') },
    { name: getLabel('admin.nav.reports'), href: '/admin-panel/reports', icon: BarChart3, badge: null },
    { name: getLabel('admin.nav.dashboard_kpi'), href: '/admin-panel/dashboard-config', icon: LayoutDashboard, badge: null, subtitle: getLabel('admin.nav.dashboard_kpi_subtitle') },
    { name: getLabel('admin.nav.email_templates'), href: '/admin-panel/email-templates', icon: Mail, badge: null },
    { name: getLabel('admin.nav.email_logs'), href: '/admin-panel/email-logs', icon: FileText, badge: null },
    { name: getLabel('admin.nav.settings'), href: '/admin-panel/settings', icon: Settings, badge: null },
  ];

  const isActive = (href: string) => {
    if (href === '/admin-panel') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Sidebar Desktop */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${
        sidebarOpen ? 'w-72' : 'w-20'
      } hidden lg:block`}>
        <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 shadow-2xl">
          {/* Logo Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-700 bg-slate-900/50">
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">A</span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-bold text-white">{getLabel('admin.title')}</h1>
                    <p className="text-xs text-slate-400">{getLabel('admin.subtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="mx-auto p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  } ${!sidebarOpen && 'justify-center'}`}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {sidebarOpen && (
                    <>
                      <div className="flex-1">
                        <div className={`${active ? 'text-white' : ''}`}>{item.name}</div>
                        {(item as any).subtitle && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{(item as any).subtitle}</div>
                        )}
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {active && !sidebarOpen && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-r-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="p-4 border-t border-slate-700 bg-slate-900/50">
            {sidebarOpen ? (
              <div className="space-y-3">
                <div className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">{getLabel('admin.logged_in_as')}</p>
                  <p className="text-sm font-medium text-white truncate">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {getLabel('admin.site')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {getLabel('auth.logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title={getLabel('admin.site')}
                >
                  <ExternalLink className="w-5 h-5 mx-auto" />
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
          <aside className="fixed top-0 left-0 z-50 h-screen w-72 bg-slate-900">
            <div className="h-full flex flex-col">
              {/* Mobile Header */}
              <div className="h-20 flex items-center justify-between px-6 border-b border-slate-700">
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">A</span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-bold text-white">{getLabel('admin.title')}</h1>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div className="flex-1">
                        <div>{item.name}</div>
                        {(item as any).subtitle && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{(item as any).subtitle}</div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile User Info */}
              <div className="p-4 border-t border-slate-700">
                <div className="space-y-3">
                  <div className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">{getLabel('admin.logged_in_as')}</p>
                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {getLabel('admin.site')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {getLabel('auth.logout')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}`}>
        {/* Top Header (Mobile) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">{getLabel('admin.title')}</h1>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen p-4 lg:p-8">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
