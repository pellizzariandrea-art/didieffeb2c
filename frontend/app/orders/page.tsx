'use client';

// app/orders/page.tsx
// User Account Area - Profile, Security, Orders

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Shield, Package, Save, LogOut, Eye, EyeOff, MapPin, Plus, Edit, Trash2, Star, Home } from 'lucide-react';
import uiLabels from '@/config/ui-labels.json';
import type { ShippingAddress } from '@/types/shipping-address';
import { getAuthInstance } from '@/lib/firebase/config';
import { useFormValidation } from '@/hooks/useFormValidation';
import ValidatedInput from '@/components/ValidatedInput';

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

type Tab = 'profile' | 'addresses' | 'security' | 'orders';

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
}

export default function AccountPage() {
  const { user, loading: authLoading, logout, refreshProfile } = useAuth();
  const { currentLang: language } = useLanguage();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
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

  const labels = uiLabels.account;

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        nome: user.nome || '',
        cognome: user.cognome || '',
        email: user.email || '',
        telefono: user.telefono || '',
        codiceFiscale: user.codiceFiscale || '',
        ragioneSociale: user.ragioneSociale || '',
        partitaIVA: user.partitaIVA || '',
        codiceSDI: user.codiceSDI || '',
        indirizzo: user.indirizzo || '',
        citta: user.citta || '',
        cap: user.cap || '',
        provincia: user.provincia || '',
        paese: user.paese || '',
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
        showMessage('success', labels.profile.success[language]);
        // Refresh profile from Firestore
        await refreshProfile();
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Top Buttons */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Home className="w-5 h-5" />
            {labels.back_to_site[language]}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            {labels.security.logout_button[language]}
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {labels.page_title[language]}
          </h1>
          <p className="text-gray-600">
            {isB2B ? user.ragioneSociale : `${user.nome} ${user.cognome}`} • {user.email}
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <User className="w-5 h-5" />
              {labels.tabs.profile[language]}
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'addresses'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-5 h-5" />
              {labels.tabs.addresses[language]}
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'security'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Shield className="w-5 h-5" />
              {labels.tabs.security[language]}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Package className="w-5 h-5" />
              {labels.tabs.orders[language]}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={addressFormData.isDefault}
                          onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                          {labels.addresses.set_default[language]}
                        </label>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveAddress}
                          disabled={saving}
                          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <h4 className="font-medium text-gray-900">
                              {address.recipientName}
                            </h4>
                          </div>
                          {address.isDefault && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
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
                            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
                  <div className="border border-gray-200 rounded-lg p-6">
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
                  <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {labels.security.logout_button[language]}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {labels.security.logout_confirm[language]}
                    </p>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
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
          </div>
        </div>
      </div>
    </div>
  );
}
