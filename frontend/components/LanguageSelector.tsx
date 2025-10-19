'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const languageInfo: Record<string, { name: string; flag: string }> = {
  it: { name: 'Italiano', flag: '🇮🇹' },
  en: { name: 'English', flag: '🇬🇧' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  fr: { name: 'Français', flag: '🇫🇷' },
  es: { name: 'Español', flag: '🇪🇸' },
  pt: { name: 'Português', flag: '🇵🇹' },
};

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLang, setLanguage, availableLanguages } = useLanguage();

  const currentLangInfo = languageInfo[currentLang] || languageInfo['it'];

  return (
    <div className="relative">
      {/* Bottone principale */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
      >
        <span className="text-2xl">{currentLangInfo.flag}</span>
        <span className="font-medium text-gray-700 hidden sm:inline">
          {currentLangInfo.name}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Overlay per chiudere */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-20">
            {availableLanguages.map((lang) => {
              const info = languageInfo[lang];
              if (!info) return null;

              const isActive = lang === currentLang;

              return (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-2xl">{info.flag}</span>
                  <span className="flex-1 text-left">{info.name}</span>
                  {isActive && (
                    <svg
                      className="w-5 h-5 text-emerald-700"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
