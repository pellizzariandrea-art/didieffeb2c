'use client';

import { useState, useEffect } from 'react';

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
  };
}

export default function UserAreaFooter() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error loading settings:', err));
  }, []);

  if (!settings?.success || !settings.settings) return null;

  const company = settings.settings.company;

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-300 py-10 mt-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center space-y-3">
          {company.name && (
            <p className="text-lg font-bold text-gray-900">{company.name}</p>
          )}
          {(company.address || company.city || company.postalCode) && (
            <p className="text-sm text-gray-700">
              {company.address}
              {(company.postalCode || company.city) && (
                <span>
                  {company.address && ' - '}
                  {company.postalCode} {company.city}
                  {company.province && ` (${company.province})`}
                </span>
              )}
              {company.country && ` - ${company.country}`}
            </p>
          )}
          {(company.phone || company.email || company.website) && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-700">
              {company.phone && (
                <span className="flex items-center gap-1">
                  <span className="font-medium">Tel:</span> {company.phone}
                </span>
              )}
              {company.email && (
                <span className="flex items-center gap-1">
                  <span className="font-medium">Email:</span> {company.email}
                </span>
              )}
              {company.website && (
                <span className="flex items-center gap-1">
                  <span className="font-medium">Web:</span> {company.website}
                </span>
              )}
            </div>
          )}
          {(company.vatNumber || company.taxCode) && (
            <p className="text-xs text-gray-600 pt-2 border-t border-gray-300 mt-4 inline-block px-6">
              {company.vatNumber && <span className="font-medium">P.IVA: {company.vatNumber}</span>}
              {company.vatNumber && company.taxCode && <span className="mx-2">•</span>}
              {company.taxCode && <span className="font-medium">C.F.: {company.taxCode}</span>}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
