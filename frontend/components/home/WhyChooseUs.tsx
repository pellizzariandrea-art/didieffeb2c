'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getCatalogText, Language } from '@/lib/catalog-translations';
import { Factory, Cog, Award, Users, TrendingUp, Shield } from 'lucide-react';
import { getCompanyContent } from '@/lib/company-content';

export default function WhyChooseUs() {
  const { currentLang } = useLanguage();
  const content = getCompanyContent(currentLang);

  const icons = [Factory, Award, Users, TrendingUp, Cog, Shield];

  const features = content.values.map((value, index) => ({
    icon: icons[index],
    title: value.title,
    description: value.description
  }));


  return (
    <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto">
        {/* Intestazione Minimal */}
        <div className="max-w-3xl mb-20">
          <div className="text-sm uppercase tracking-wider text-green-600 font-semibold mb-4">
            {getCatalogText('whyChooseUs', currentLang as Language)}
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {getCatalogText('qualityWithoutCompromise', currentLang as Language)}
          </h2>
          <p className="text-xl text-gray-600">
            {getCatalogText('experienceDescription', currentLang as Language)}
          </p>
        </div>

        {/* Features Grid - Design Minimal e Pulito */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group"
              >
                {/* Icona Minimal */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>

                {/* Testo */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats Bar - Minimal */}
        <div className="mt-24 pt-12 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">150+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wider">
                {getCatalogText('products', currentLang as Language)}
              </div>
            </div>

            <div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wider">
                {getCatalogText('clients', currentLang as Language)}
              </div>
            </div>

            <div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">99%</div>
              <div className="text-sm text-gray-600 uppercase tracking-wider">
                {getCatalogText('satisfaction', currentLang as Language)}
              </div>
            </div>

            <div>
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-sm text-gray-600 uppercase tracking-wider">
                {getCatalogText('support', currentLang as Language)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
