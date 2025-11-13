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
    <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center space-y-2 text-sm text-gray-600">
          {company.name && (
            <p className="font-semibold text-gray-900">{company.name}</p>
          )}
          {(company.address || company.city || company.postalCode) && (
            <p>
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
          {(company.phone || company.email) && (
            <p>
              {company.phone && <span>Tel: {company.phone}</span>}
              {company.phone && company.email && <span> | </span>}
              {company.email && <span>Email: {company.email}</span>}
            </p>
          )}
          {(company.vatNumber || company.taxCode) && (
            <p className="text-xs">
              {company.vatNumber && <span>P.IVA: {company.vatNumber}</span>}
              {company.vatNumber && company.taxCode && <span> | </span>}
              {company.taxCode && <span>C.F.: {company.taxCode}</span>}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
