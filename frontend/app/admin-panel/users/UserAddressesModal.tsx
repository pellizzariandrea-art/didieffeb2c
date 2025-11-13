// app/admin-panel/users/UserAddressesModal.tsx
// Modal component for managing user shipping addresses from admin panel

'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Plus, Edit, Trash2, Star, Save } from 'lucide-react';
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

interface UserAddressesModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserAddressesModal({
  userId,
  userName,
  isOpen,
  onClose,
}: UserAddressesModalProps) {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ShippingAddress | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { errors, validateField, setFieldError, clearFieldError } = useFormValidation();
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
    }
  }, [isOpen, userId]);

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

  const loadAddresses = async () => {
    try {
      setLoading(true);

      // Get Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        showMessage('error', 'Errore di autenticazione');
        return;
      }

      const response = await fetch(`/api/shipping-addresses?userId=${userId}`, {
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
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddNew = () => {
    setEditing(null);
    setFormData({
      recipientName: userName,
      addressLine: '',
      city: '',
      postalCode: '',
      province: '',
      country: 'Italia',
      phone: '',
      notes: '',
      isDefault: addresses.length === 0,
    });
    setShowForm(true);
  };

  const handleEdit = (address: ShippingAddress) => {
    setEditing(address);
    setFormData({
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
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Get Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        showMessage('error', 'Errore di autenticazione');
        return;
      }

      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { id: editing.id, userId, ...formData }
        : { userId, ...formData };

      const response = await fetch('/api/shipping-addresses', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Indirizzo salvato con successo');
        setShowForm(false);
        await loadAddresses();
      } else {
        showMessage('error', data.error || 'Errore nel salvataggio');
      }
    } catch (error) {
      console.error('Save address error:', error);
      showMessage('error', 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo indirizzo?')) {
      return;
    }

    try {
      // Get Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        showMessage('error', 'Errore di autenticazione');
        return;
      }

      const response = await fetch(`/api/shipping-addresses?id=${addressId}&userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Indirizzo eliminato');
        await loadAddresses();
      } else {
        showMessage('error', data.error || 'Errore nell\'eliminazione');
      }
    } catch (error) {
      console.error('Delete address error:', error);
      showMessage('error', 'Errore nell\'eliminazione');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Indirizzi di Spedizione</h2>
            <p className="text-sm text-gray-600 mt-1">{userName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showForm ? (
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editing ? 'Modifica Indirizzo' : 'Nuovo Indirizzo'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Destinatario
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indirizzo
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine}
                    onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Città
                    </label>
                    <ValidatedInput
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={(e) => {
                        const newFormData = { ...formData, city: e.target.value };
                        setFormData(newFormData);
                        if (touched.city) {
                          const result = validateField('citta', e.target.value, formData.country);
                          if (!result.valid) {
                            setFieldError('city', result.error);
                          } else {
                            clearFieldError('city');
                          }
                        }
                      }}
                      onBlur={() => {
                        setTouched({ ...touched, city: true });
                        const result = validateField('citta', formData.city, formData.country);
                        if (!result.valid) {
                          setFieldError('city', result.error);
                        }
                      }}
                      error={errors.city}
                      touched={touched.city}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CAP
                    </label>
                    <ValidatedInput
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => {
                        const newFormData = { ...formData, postalCode: e.target.value };
                        setFormData(newFormData);
                        if (touched.postalCode) {
                          const result = validateField('cap', e.target.value, formData.country);
                          if (!result.valid) {
                            setFieldError('postalCode', result.error);
                          } else {
                            clearFieldError('postalCode');
                          }
                        }
                      }}
                      onBlur={() => {
                        setTouched({ ...touched, postalCode: true });
                        const result = validateField('cap', formData.postalCode, formData.country);
                        if (!result.valid) {
                          setFieldError('postalCode', result.error);
                        }
                      }}
                      error={errors.postalCode}
                      touched={touched.postalCode}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provincia
                    </label>
                    <ValidatedInput
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={(e) => {
                        const newFormData = { ...formData, province: e.target.value };
                        setFormData(newFormData);
                        if (touched.province) {
                          const result = validateField('provincia', e.target.value, formData.country);
                          if (!result.valid) {
                            setFieldError('province', result.error);
                          } else {
                            clearFieldError('province');
                          }
                        }
                      }}
                      onBlur={() => {
                        setTouched({ ...touched, province: true });
                        const result = validateField('provincia', formData.province, formData.country);
                        if (!result.valid) {
                          setFieldError('province', result.error);
                        }
                      }}
                      error={errors.province}
                      touched={touched.province}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paese
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => {
                      setFormData({ ...formData, country: e.target.value });
                      // Re-validate all fields with new country
                      setTouched({});
                      clearFieldError('postalCode');
                      clearFieldError('province');
                      clearFieldError('city');
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault-admin"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isDefault-admin" className="ml-2 text-sm text-gray-700">
                    Imposta come predefinito
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Salvataggio...' : 'Salva'}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Caricamento...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nessun indirizzo salvato</p>
              <button
                onClick={handleAddNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Aggiungi Indirizzo
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nuovo Indirizzo
                </button>
              </div>

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
                          Predefinito
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
                        onClick={() => handleEdit(address)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Modifica
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
