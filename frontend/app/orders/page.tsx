'use client';

// app/orders/page.tsx
// User Account Area - Profile, Security, Orders

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Shield, Package, Save, LogOut, Eye, EyeOff, MapPin, Plus, Edit, Trash2, Star, Home, BarChart3, FileText, Menu, X, Clock, Euro, TrendingUp, Box } from 'lucide-react';
import uiLabels from '@/config/ui-labels.json';
import type { ShippingAddress } from '@/types/shipping-address';
import type { ReportConfig } from '@/types/report';
import { getAuthInstance } from '@/lib/firebase/config';
import { useFormValidation } from '@/hooks/useFormValidation';
import ValidatedInput from '@/components/ValidatedInput';
import { getReportTitle, getReportDescription } from '@/components/reports/ReportBuilder';
// UserAreaHeader removed - now using layout sidebar

// Common countries list
const COMMON_COUNTRIES = [
  'Italia',
  'Germany',
  'France',
  'Spain',
  'Portugal',
  'Croatia',
  'Slovenia',
  'Greece',
  'Austria',
  'Switzerland',
  'Netherlands',
  'Belgium',
  'United Kingdom',
  'Poland',
  'Czech Republic',
  'Hungary',
  'Romania',
  'Bulgaria',
  'United States',
  'Canada',
  'Other'
];

type Tab = 'dashboard' | 'profile' | 'addresses' | 'security' | 'orders' | 'reports';

type ReportWithSlug = ReportConfig & { slug: string };

interface ProfileData {
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  codiceFiscale?: string;
  ragioneSociale?: string;
  partitaIVA?: string;
  codiceSDI?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  paese?: string;
  preferredLanguage?: 'it' | 'en' | 'de' | 'fr' | 'es' | 'pt' | 'hr' | 'sl' | 'el';
}

export default function AccountPage() {
  const { user, loading: authLoading, logout, refreshProfile } = useAuth();
  const { currentLang: language, syncWithUserProfile } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get tab from URL search params on client side
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Update tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab') as Tab;
    setActiveTab(tab || 'dashboard');
  }, [searchParams]);
  const [profileData, setProfileData] = useState<ProfileData>({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    codiceFiscale: '',
    ragioneSociale: '',
    partitaIVA: '',
    codiceSDI: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    paese: '',
    preferredLanguage: 'it',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { errors, validateField, setFieldError, clearFieldError } = useFormValidation();
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Addresses state
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    recipientName: '',
    addressLine: '',
    city: '',
    postalCode: '',
    province: '',
    country: 'Italia',
    phone: '',
    notes: '',
    isDefault: false,
  });

  // Reports state
  const [reports, setReports] = useState<ReportWithSlug[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Dashboard KPI state
  const [dashboardKpis, setDashboardKpis] = useState<any[]>([]);
  const [loadingKpis, setLoadingKpis] = useState(false);

  const labels = uiLabels.account;

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Update active tab when URL changes
  useEffect(() => {
    const handleRouteChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab as Tab);
      } else {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    handleRouteChange();

    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  // Load user data
  useEffect(() => {
    if (user) {
      // Extract address based on user type
      let addressData = {
        indirizzo: '',
        citta: '',
        cap: '',
        provincia: '',
        paese: '',
      };

      if (user.role === 'b2c' && 'indirizzoSpedizione' in user && user.indirizzoSpedizione) {
        addressData = {
          indirizzo: user.indirizzoSpedizione.via || '',
          citta: user.indirizzoSpedizione.citta || '',
          cap: user.indirizzoSpedizione.cap || '',
          provincia: user.indirizzoSpedizione.provincia || '',
          paese: user.indirizzoSpedizione.paese || '',
        };
      } else if (user.role === 'b2b' && 'indirizzoFatturazione' in user && user.indirizzoFatturazione) {
        addressData = {
          indirizzo: user.indirizzoFatturazione.via || '',
          citta: user.indirizzoFatturazione.citta || '',
          cap: user.indirizzoFatturazione.cap || '',
          provincia: user.indirizzoFatturazione.provincia || '',
          paese: user.indirizzoFatturazione.paese || '',
        };
      }

      setProfileData({
        nome: user.nome || '',
        cognome: user.cognome || '',
        email: user.email || '',
        telefono: (user.role === 'b2c' && 'telefono' in user) ? user.telefono || '' :
                 (user.role === 'b2b' && 'referente' in user) ? user.referente?.telefono || '' : '',
        codiceFiscale: (user.role === 'b2c' && 'codiceFiscale' in user) ? user.codiceFiscale || '' : '',
        ragioneSociale: (user.role === 'b2b' && 'ragioneSociale' in user) ? user.ragioneSociale || '' : '',
        partitaIVA: ('partitaIva' in user) ? user.partitaIva || '' : '',
        codiceSDI: (user.role === 'b2b' && 'codiceSDI' in user) ? user.codiceSDI || '' : '',
        preferredLanguage: user.preferredLanguage || 'it',
        ...addressData,
      });
    }
  }, [user]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Get Firebase ID token
  const getIdToken = async (): Promise<string | null> => {
    try {
      const auth = getAuthInstance();
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      return await currentUser.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  const handleProfileSave = async () => {
    try {
      setSaving(true);

      // Get Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        showMessage('error', 'Errore di autenticazione');
        return;
      }

      // Call update profile API
      const response = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        // Sync language preference with UI first
        syncWithUserProfile(profileData.preferredLanguage);
        // Then refresh profile from Firestore
        await refreshProfile();
        // Show success message in the NEW language
        showMessage('success', labels.profile.success[profileData.preferredLanguage || language]);
      } else {
        showMessage('error', data.error || labels.profile.error[language]);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('error', labels.profile.error[language]);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', labels.security.password_mismatch[language]);
      return;
    }

    try {
      setUpdating(true);

      // Get Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        showMessage('error', 'Errore di autenticazione');
        return;
      }

      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', labels.security.password_success[language]);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        showMessage('error', data.error || labels.security.password_error[language]);
      }
    } catch (error) {
      console.error('Password update error:', error);
      showMessage('error', labels.security.password_error[language]);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    if (confirm(labels.security.logout_confirm[language])) {
      try {
        await logout();
        router.push('/');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  // Load addresses when addresses tab is selected
  useEffect(() => {
    if (activeTab === 'addresses' && addresses.length === 0) {
      loadAddresses();
    }
  }, [activeTab]);

  // Load reports when reports tab is selected
  useEffect(() => {
    if (activeTab === 'reports' && reports.length === 0 && user) {
      loadReports();
    }
  }, [activeTab, user]);

  // Load dashboard KPIs when dashboard tab is selected
  useEffect(() => {
    if (activeTab === 'dashboard' && dashboardKpis.length === 0 && user) {
      loadDashboardKpis();
    }
  }, [activeTab, user]);

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const response = await fetch('/api/reports/config');
      const data = await response.json();

      // Convert object to array and filter based on user role
      const allReports: ReportWithSlug[] = Object.entries(data).map(
        ([slug, config]) => ({
          ...(config as ReportConfig),
          slug,
        })
      );

      // Filter reports based on:
      // 1. enabled !== false
      // 2. clientTypes includes user role OR clientTypes is empty/undefined (tutti)
      const availableReports = allReports.filter((report) => {
        if (report.enabled === false) return false;

        if (!report.clientTypes || report.clientTypes.length === 0) {
          return true; // Disponibile per tutti
        }

        return report.clientTypes.includes(user!.role as 'b2b' | 'b2c');
      });

      setReports(availableReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const loadDashboardKpis = async () => {
    try {
      setLoadingKpis(true);

      // Only load for B2B users with client code (for now)
      // B2C users will see a limited dashboard with addresses count only
      if (!user?.clientCode) {
        setDashboardKpis([]);
        return;
      }

      const response = await fetch(`/api/dashboard/data?clientCode=${user.clientCode}`);
      const data = await response.json();

      if (data.success) {
        setDashboardKpis(data.kpis || []);
      } else {
        console.error('Error loading dashboard KPIs:', data.error);
        setDashboardKpis([]);
      }
    } catch (error) {
      console.error('Error loading dashboard KPIs:', error);
      setDashboardKpis([]);
    } finally {
      setLoadingKpis(false);
    }
  };

  // Helper function to get icon component
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      package: Package,
      clock: Clock,
      euro: Euro,
      'trending-up': TrendingUp,
      box: Box,
      'bar-chart': BarChart3,
    };
    return icons[iconName] || Package;
  };

  // Helper function to get color classes
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'from-blue-50 to-blue-100', text: 'text-blue-900', border: 'border-blue-200' },
      orange: { bg: 'from-orange-50 to-orange-100', text: 'text-orange-900', border: 'border-orange-200' },
      green: { bg: 'from-green-50 to-green-100', text: 'text-green-900', border: 'border-green-200' },
      purple: { bg: 'from-purple-50 to-purple-100', text: 'text-purple-900', border: 'border-purple-200' },
      indigo: { bg: 'from-indigo-50 to-indigo-100', text: 'text-indigo-900', border: 'border-indigo-200' },
      teal: { bg: 'from-teal-50 to-teal-100', text: 'text-teal-900', border: 'border-teal-200' },
      red: { bg: 'from-red-50 to-red-100', text: 'text-red-900', border: 'border-red-200' },
      yellow: { bg: 'from-yellow-50 to-yellow-100', text: 'text-yellow-900', border: 'border-yellow-200' },
    };
    return colorMap[color] || colorMap.blue;
  };

  // Helper function to format KPI value
  const formatKpiValue = (value: number | null, valueType: string, format: string) => {
    if (value === null) return 'N/A';

    if (valueType === 'currency') {
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
      }).format(value);
    }

    if (valueType === 'percentage') {
      return `${value.toFixed(1)}%`;
    }

    // Number
    return new Intl.NumberFormat('it-IT').format(value);
  };

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);

      // Get Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        showMessage('error', 'Errore di autenticazione');
        return;
      }

      const response = await fetch('/api/shipping-addresses', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setAddresses(data.addresses);
      } else {
        showMessage('error', data.error || 'Errore nel caricamento indirizzi');
      }
    } catch (error) {
      console.error('Load addresses error:', error);
      showMessage('error', 'Errore nel caricamento indirizzi');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressFormData({
      recipientName: `${user?.nome || ''} ${user?.cognome || ''}`.trim(),
      addressLine: '',
      city: '',
      postalCode: '',
      province: '',
      country: 'Italia',
      phone: user?.telefono || '',
      notes: '',
      isDefault: addresses.length === 0,
    });
    setShowAddressForm(true);
  };

  const handleEditAddress = (address: ShippingAddress) => {
    setEditingAddress(address);
    setAddressFormData({
      recipientName: address.recipientName,
      addressLine: address.addressLine,
      city: address.city,
      postalCode: address.postalCode,
      province: address.province,
      country: address.country,
      phone: address.phone,
      notes: address.notes || '',
      isDefault: address.isDefault,
    });
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    try {
      setSaving(true);

      // Get Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        showMessage('error', 'Errore di autenticazione');
        return;
      }

      const url = editingAddress
        ? '/api/shipping-addresses'
        : '/api/shipping-addresses';

      const method = editingAddress ? 'PUT' : 'POST';

      const body = editingAddress
        ? { id: editingAddress.id, ...addressFormData }
        : addressFormData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', labels.addresses.success[language]);
        setShowAddressForm(false);
        await loadAddresses();
      } else {
        showMessage('error', data.error || labels.addresses.error[language]);
      }
    } catch (error) {
      console.error('Save address error:', error);
      showMessage('error', labels.addresses.error[language]);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm(labels.addresses.delete_confirm[language])) {
      return;
    }

    try {
      // Get Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        showMessage('error', 'Errore di autenticazione');
        return;
      }

      const response = await fetch(`/api/shipping-addresses?id=${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', labels.addresses.deleted[language]);
        await loadAddresses();
      } else {
        showMessage('error', data.error || labels.addresses.error[language]);
      }
    } catch (error) {
      console.error('Delete address error:', error);
      showMessage('error', labels.addresses.error[language]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isB2B = user.role === 'b2b';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl border-2 font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Content - Navigation via sidebar */}
        <div className="space-y-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Dashboard
              </h2>

              {/* Stats Cards */}
              {loadingKpis ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Dynamic KPI Cards from configuration */}
                    {dashboardKpis.map((kpi, index) => {
                      const IconComponent = getIconComponent(kpi.icon);
                      const colors = getColorClasses(kpi.color);

                      return (
                        <div
                          key={index}
                          className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-6 border-2 ${colors.border} shadow-sm`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-sm font-medium ${colors.text}`}>{kpi.title}</h3>
                            <IconComponent className={`w-5 h-5 ${colors.text.replace('900', '600')}`} />
                          </div>
                          <p className={`text-3xl font-bold ${colors.text}`}>
                            {formatKpiValue(kpi.value, kpi.valueType, kpi.format)}
                          </p>
                          <p className={`text-xs ${colors.text.replace('900', '700')} mt-1`}>
                            {kpi.description}
                          </p>
                        </div>
                      );
                    })}

                    {/* Addresses Card - Always visible */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-green-900">Indirizzi</h3>
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-green-900">{addresses.length}</p>
                      <p className="text-xs text-green-700 mt-1">Indirizzi salvati</p>
                    </div>

                    {/* Reports Card - Only for B2B users */}
                    {user?.clientCode && (
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-purple-900">Report</h3>
                          <BarChart3 className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-purple-900">{reports.length}</p>
                        <p className="text-xs text-purple-700 mt-1">Report disponibili</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-left"
                    >
                      <User className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Edit Profile</p>
                        <p className="text-sm text-gray-600">Update your information</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('addresses')}
                      className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-left"
                    >
                      <MapPin className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Manage Addresses</p>
                        <p className="text-sm text-gray-600">Add or edit addresses</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('security')}
                      className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                    >
                      <Shield className="w-6 h-6 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-900">Security</p>
                        <p className="text-sm text-gray-600">Change your password</p>
                      </div>
                    </button>

                    {user?.clientCode && (
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                      >
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                        <div>
                          <p className="font-medium text-gray-900">View Reports</p>
                          <p className="text-sm text-gray-600">Access your analytics</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {labels.profile.title[language]}
                </h2>
                <p className="text-gray-600 mb-6">
                  {labels.profile.subtitle[language]}
                </p>

                <div className="space-y-4">
                  {/* Personal Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {labels.profile.first_name[language]}
                      </label>
                      <input
                        type="text"
                        value={profileData.nome}
                        onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {labels.profile.last_name[language]}
                      </label>
                      <input
                        type="text"
                        value={profileData.cognome}
                        onChange={(e) => setProfileData({ ...profileData, cognome: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {labels.profile.email[language]}
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {labels.profile.email_readonly[language]}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {labels.profile.phone[language]}
                    </label>
                    <input
                      type="tel"
                      value={profileData.telefono}
                      onChange={(e) => setProfileData({ ...profileData, telefono: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Preferred Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {labels.profile.preferred_language[language]}
                    </label>
                    <select
                      value={profileData.preferredLanguage || 'it'}
                      onChange={(e) => setProfileData({ ...profileData, preferredLanguage: e.target.value as any })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="it">🇮🇹 Italiano</option>
                      <option value="en">🇬🇧 English</option>
                      <option value="de">🇩🇪 Deutsch</option>
                      <option value="fr">🇫🇷 Français</option>
                      <option value="es">🇪🇸 Español</option>
                      <option value="pt">🇵🇹 Português</option>
                      <option value="hr">🇭🇷 Hrvatski</option>
                      <option value="sl">🇸🇮 Slovenščina</option>
                      <option value="el">🇬🇷 Ελληνικά</option>
                    </select>
                  </div>

                  {/* Company Info for B2B */}
                  {isB2B && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.profile.company_name[language]}
                        </label>
                        <input
                          type="text"
                          value={profileData.ragioneSociale}
                          onChange={(e) => setProfileData({ ...profileData, ragioneSociale: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      {profileData.paese === 'Italia' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {labels.profile.sdi_code[language]}
                          </label>
                          <input
                            type="text"
                            value={profileData.codiceSDI}
                            onChange={(e) => setProfileData({ ...profileData, codiceSDI: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Tax Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {labels.profile.vat_number[language]}
                      </label>
                      <ValidatedInput
                        type="text"
                        name="partitaIVA"
                        value={profileData.partitaIVA}
                        onChange={(e) => {
                          const newData = { ...profileData, partitaIVA: e.target.value };
                          setProfileData(newData);
                          if (touched.partitaIVA) {
                            const result = validateField('partitaIva', e.target.value, profileData.paese);
                            if (!result.valid) {
                              setFieldError('partitaIVA', result.error);
                            } else {
                              clearFieldError('partitaIVA');
                            }
                          }
                        }}
                        onBlur={() => {
                          setTouched({ ...touched, partitaIVA: true });
                          const result = validateField('partitaIva', profileData.partitaIVA || '', profileData.paese);
                          if (!result.valid && profileData.partitaIVA) {
                            setFieldError('partitaIVA', result.error);
                          }
                        }}
                        error={errors.partitaIVA}
                        touched={touched.partitaIVA}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    {!isB2B && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.profile.tax_code[language]}
                        </label>
                        <ValidatedInput
                          type="text"
                          name="codiceFiscale"
                          value={profileData.codiceFiscale}
                          onChange={(e) => {
                            const newData = { ...profileData, codiceFiscale: e.target.value };
                            setProfileData(newData);
                            if (touched.codiceFiscale) {
                              const result = validateField('codiceFiscale', e.target.value, profileData.paese);
                              if (!result.valid) {
                                setFieldError('codiceFiscale', result.error);
                              } else {
                                clearFieldError('codiceFiscale');
                              }
                            }
                          }}
                          onBlur={() => {
                            setTouched({ ...touched, codiceFiscale: true });
                            const result = validateField('codiceFiscale', profileData.codiceFiscale || '', profileData.paese);
                            if (!result.valid && profileData.codiceFiscale) {
                              setFieldError('codiceFiscale', result.error);
                            }
                          }}
                          error={errors.codiceFiscale}
                          touched={touched.codiceFiscale}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Main Address Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {labels.profile.main_address_title[language]}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {labels.profile.main_address_description[language]}
                    </p>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {labels.profile.address[language]}
                      </label>
                      <input
                        type="text"
                        value={profileData.indirizzo}
                        onChange={(e) => setProfileData({ ...profileData, indirizzo: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder={labels.profile.address_placeholder[language]}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.profile.city[language]}
                        </label>
                        <ValidatedInput
                          type="text"
                          name="citta"
                          value={profileData.citta}
                          onChange={(e) => {
                            const newData = { ...profileData, citta: e.target.value };
                            setProfileData(newData);
                            if (touched.citta) {
                              const result = validateField('citta', e.target.value, profileData.paese);
                              if (!result.valid) {
                                setFieldError('citta', result.error);
                              } else {
                                clearFieldError('citta');
                              }
                            }
                          }}
                          onBlur={() => {
                            setTouched({ ...touched, citta: true });
                            const result = validateField('citta', profileData.citta || '', profileData.paese);
                            if (!result.valid && profileData.citta) {
                              setFieldError('citta', result.error);
                            }
                          }}
                          error={errors.citta}
                          touched={touched.citta}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.profile.postal_code[language]}
                        </label>
                        <ValidatedInput
                          type="text"
                          name="cap"
                          value={profileData.cap}
                          onChange={(e) => {
                            const newData = { ...profileData, cap: e.target.value };
                            setProfileData(newData);
                            if (touched.cap) {
                              const result = validateField('cap', e.target.value, profileData.paese);
                              if (!result.valid) {
                                setFieldError('cap', result.error);
                              } else {
                                clearFieldError('cap');
                              }
                            }
                          }}
                          onBlur={() => {
                            setTouched({ ...touched, cap: true });
                            const result = validateField('cap', profileData.cap || '', profileData.paese);
                            if (!result.valid && profileData.cap) {
                              setFieldError('cap', result.error);
                            }
                          }}
                          error={errors.cap}
                          touched={touched.cap}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.profile.province[language]}
                        </label>
                        <ValidatedInput
                          type="text"
                          name="provincia"
                          value={profileData.provincia}
                          onChange={(e) => {
                            const newData = { ...profileData, provincia: e.target.value };
                            setProfileData(newData);
                            if (touched.provincia) {
                              const result = validateField('provincia', e.target.value, profileData.paese);
                              if (!result.valid) {
                                setFieldError('provincia', result.error);
                              } else {
                                clearFieldError('provincia');
                              }
                            }
                          }}
                          onBlur={() => {
                            setTouched({ ...touched, provincia: true });
                            const result = validateField('provincia', profileData.provincia || '', profileData.paese);
                            if (!result.valid && profileData.provincia) {
                              setFieldError('provincia', result.error);
                            }
                          }}
                          error={errors.provincia}
                          touched={touched.provincia}
                          placeholder="ES: VI, PD"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.profile.country[language]}
                        </label>
                        <select
                          value={profileData.paese}
                          onChange={(e) => {
                            setProfileData({ ...profileData, paese: e.target.value });
                            // Clear validations when country changes
                            setTouched({});
                            clearFieldError('cap');
                            clearFieldError('provincia');
                            clearFieldError('citta');
                            clearFieldError('partitaIVA');
                            clearFieldError('codiceFiscale');
                          }}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          {COMMON_COUNTRIES.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleProfileSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/30"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? labels.profile.saving[language] : labels.profile.save_button[language]}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {labels.addresses.title[language]}
                    </h2>
                    <p className="text-gray-600">
                      {labels.addresses.subtitle[language]}
                    </p>
                  </div>
                  {!showAddressForm && (
                    <button
                      onClick={handleAddAddress}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      {labels.addresses.add_new[language]}
                    </button>
                  )}
                </div>

                {showAddressForm ? (
                  <div className="border border-gray-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingAddress ? labels.addresses.edit_address[language] : labels.addresses.add_new[language]}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.addresses.recipient_name[language]}
                        </label>
                        <input
                          type="text"
                          value={addressFormData.recipientName}
                          onChange={(e) => setAddressFormData({ ...addressFormData, recipientName: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.addresses.address_line[language]}
                        </label>
                        <input
                          type="text"
                          value={addressFormData.addressLine}
                          onChange={(e) => setAddressFormData({ ...addressFormData, addressLine: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {labels.addresses.city[language]}
                          </label>
                          <input
                            type="text"
                            value={addressFormData.city}
                            onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {labels.addresses.postal_code[language]}
                          </label>
                          <input
                            type="text"
                            value={addressFormData.postalCode}
                            onChange={(e) => setAddressFormData({ ...addressFormData, postalCode: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {labels.addresses.province[language]}
                          </label>
                          <input
                            type="text"
                            value={addressFormData.province}
                            onChange={(e) => setAddressFormData({ ...addressFormData, province: e.target.value })}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.addresses.country[language]}
                        </label>
                        <input
                          type="text"
                          value={addressFormData.country}
                          onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.addresses.phone[language]}
                        </label>
                        <input
                          type="tel"
                          value={addressFormData.phone}
                          onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.addresses.notes[language]}
                        </label>
                        <textarea
                          value={addressFormData.notes}
                          onChange={(e) => setAddressFormData({ ...addressFormData, notes: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={addressFormData.isDefault}
                          onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                          {labels.addresses.set_default[language]}
                        </label>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveAddress}
                          disabled={saving}
                          className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {saving ? labels.addresses.saving[language] : labels.addresses.save_button[language]}
                        </button>
                        <button
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddress(null);
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {labels.addresses.cancel[language]}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : loadingAddresses ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Caricamento...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      {labels.addresses.no_addresses[language]}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="border-2 border-gray-200 rounded-2xl p-4 hover:shadow-lg hover:border-green-200 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <h4 className="font-medium text-gray-900">
                              {address.recipientName}
                            </h4>
                          </div>
                          {address.isDefault && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              <Star className="w-3 h-3 mr-1" />
                              {labels.addresses.is_default[language]}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 space-y-1 mb-4">
                          <p>{address.addressLine}</p>
                          <p>
                            {address.postalCode} {address.city} {address.province && `(${address.province})`}
                          </p>
                          <p>{address.country}</p>
                          {address.phone && <p>{address.phone}</p>}
                          {address.notes && (
                            <p className="text-xs text-gray-500 italic mt-2">{address.notes}</p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            {language === 'it' ? 'Modifica' : language === 'en' ? 'Edit' : 'Editar'}
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            {language === 'it' ? 'Elimina' : language === 'en' ? 'Delete' : 'Eliminar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {labels.security.title[language]}
                </h2>
                <p className="text-gray-600 mb-6">
                  {labels.security.subtitle[language]}
                </p>

                <div className="space-y-6">
                  {/* Change Password Section */}
                  <div className="border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {labels.security.change_password[language]}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.security.current_password[language]}
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.security.new_password[language]}
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels.security.confirm_password[language]}
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handlePasswordUpdate}
                        disabled={updating}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {updating ? labels.security.updating[language] : labels.security.update_password[language]}
                      </button>
                    </div>
                  </div>

                  {/* Logout Section */}
                  <div className="border-2 border-red-200 rounded-2xl p-6 bg-red-50">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {labels.security.logout_button[language]}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {labels.security.logout_confirm[language]}
                    </p>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-rose-700 transition-all shadow-lg shadow-red-500/30"
                    >
                      <LogOut className="w-5 h-5" />
                      {labels.security.logout_button[language]}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {labels.orders.title[language]}
                </h2>
                <p className="text-gray-600 mb-6">
                  {labels.orders.subtitle[language]}
                </p>

                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    {labels.orders.no_orders[language]}
                  </p>
                  <p className="text-sm text-gray-400">
                    {labels.orders.coming_soon[language]}
                  </p>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {labels.reports.title[language]}
                </h2>
                <p className="text-gray-600 mb-6">
                  {labels.reports.subtitle[language]}
                </p>

                {!user?.clientCode ? (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
                    <p className="text-yellow-800">
                      {labels.reports.no_client_code[language]}
                    </p>
                  </div>
                ) : loadingReports ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Caricamento...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {labels.reports.no_reports[language]}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reports.map((report) => (
                      <Link
                        key={report.slug}
                        href={`/my-account/reports/${report.slug}`}
                        className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-green-500 hover:shadow-xl transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                            <BarChart3 className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {getReportTitle(report.slug, language, report.title)}
                            </h3>
                            {report.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {getReportDescription(report.slug, language, report.description)}
                              </p>
                            )}
                            <div className="text-sm text-green-600 font-medium">
                              {labels.reports.view_report[language]}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
