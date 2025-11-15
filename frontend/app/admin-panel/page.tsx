'use client';

// app/admin-panel/page.tsx
// Admin Dashboard - Premium Design

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import uiLabels from '@/config/ui-labels.json';
import {
  Settings,
  Users,
  Mail,
  BarChart3,
  LayoutDashboard,
  Languages,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentLang } = useLanguage();
  const [logoUrl, setLogoUrl] = useState<string>('');

  // Helper function to get translated labels
  const getLabel = (path: string): string => {
    const keys = path.split('.');
    let value: any = uiLabels;
    for (const key of keys) {
      value = value?.[key];
    }
    return value?.[currentLang] || value?.['it'] || path;
  };

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
  const cards = [
    {
      title: getLabel('admin.nav.users'),
      description: 'Approva, modifica ed elimina utenti',
      icon: Users,
      href: '/admin-panel/users',
      gradient: 'from-blue-500 to-indigo-600',
      color: 'blue'
    },
    {
      title: getLabel('admin.nav.translations'),
      description: getLabel('admin.nav.translations_subtitle'),
      icon: Languages,
      href: '/admin-panel/translations',
      gradient: 'from-purple-500 to-pink-600',
      color: 'purple'
    },
    {
      title: getLabel('admin.nav.reports'),
      description: 'Gestione dinamica report B2B',
      icon: BarChart3,
      href: '/admin-panel/reports',
      gradient: 'from-orange-500 to-red-600',
      color: 'orange'
    },
    {
      title: getLabel('admin.nav.email_templates'),
      description: 'Template email transazionali',
      icon: Mail,
      href: '/admin-panel/email-templates',
      gradient: 'from-green-500 to-emerald-600',
      color: 'green'
    },
    {
      title: getLabel('admin.nav.dashboard_kpi'),
      description: getLabel('admin.nav.dashboard_kpi_subtitle'),
      icon: LayoutDashboard,
      href: '/admin-panel/dashboard-config',
      gradient: 'from-cyan-500 to-blue-600',
      color: 'cyan'
    },
    {
      title: getLabel('admin.nav.settings'),
      description: 'Configurazione azienda e sistema',
      icon: Settings,
      href: '/admin-panel/settings',
      gradient: 'from-slate-500 to-gray-600',
      color: 'slate'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 lg:p-12 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-2xl bg-white backdrop-blur-sm flex items-center justify-center px-4 py-3 shadow-lg">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={180}
                height={40}
                className="h-10 w-auto object-contain max-w-[180px]"
              />
            ) : (
              <Sparkles className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">{getLabel('admin.title')}</h1>
            <p className="text-blue-100 text-lg">
              {getLabel('admin.welcome')}
            </p>
          </div>
        </div>
        <p className="text-blue-50 max-w-2xl">
          {getLabel('admin.description')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Oggi</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">Sistema Attivo</h3>
          <p className="text-sm text-gray-600">Tutti i servizi operativi</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Brevo</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">Email Attive</h3>
          <p className="text-sm text-gray-600">Servizio configurato</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Languages className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Lingue</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">9 Lingue</h3>
          <p className="text-sm text-gray-600">Sistema multilingua</p>
        </div>
      </div>

      {/* Main Cards Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestione Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white rounded-2xl shadow-sm border-2 border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  {/* Icon with gradient background */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {card.description}
                  </p>

                  {/* Action */}
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                    <span>Gestisci</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Decorative gradient bottom */}
                <div className={`h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Link Rapidi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin-panel/email-logs"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Email Logs</div>
              <div className="text-xs text-gray-500">Cronologia invii</div>
            </div>
          </Link>

          <Link
            href="/admin-panel/users"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Utenti Attivi</div>
              <div className="text-xs text-gray-500">Gestisci accessi</div>
            </div>
          </Link>

          <Link
            href="/admin-panel/settings"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Configurazione</div>
              <div className="text-xs text-gray-500">Impostazioni base</div>
            </div>
          </Link>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Vai al Sito</div>
              <div className="text-xs text-gray-500">Frontend pubblico</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
