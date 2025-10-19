'use client';

// components/CategoryBar.tsx
import { getLabel } from '@/lib/ui-labels';

interface Category {
  field: string;
  label: string;
  translations: Record<string, string>;
  icon?: string;
  color?: string;
  description?: string;
  count?: number;
}

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  lang?: string;
}

export default function CategoryBar({
  categories,
  selectedCategory,
  onCategorySelect,
  lang = 'it',
}: CategoryBarProps) {
  if (categories.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-white/95">
      <div className="container mx-auto">
        <div className="relative">
          {/* Gradiente fade sinistra */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/95 to-transparent z-10 pointer-events-none" />

          {/* Scroll container */}
          <div className="flex items-center gap-3 overflow-x-auto py-4 pl-4 scrollbar-hide">
            {/* Tutte le categorie */}
            <button
              onClick={() => onCategorySelect(null)}
              className={`group relative px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-white text-emerald-700 border-3 border-emerald-600 shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-lg border border-gray-200 hover:border-emerald-300'
              }`}
            >
              <span className="flex items-center gap-2 lg:gap-2.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {getLabel('categories.all', lang)}
              </span>
            </button>

            {/* Categorie dinamiche */}
            {categories.map((category) => {
              const isSelected = selectedCategory === category.field;
              const translatedName = category.translations[lang] || category.translations['it'] || category.label;

              return (
                <button
                  key={category.field}
                  onClick={() => onCategorySelect(isSelected ? null : category.field)}
                  className={`group relative px-3 lg:px-5 py-2.5 lg:py-3.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                    isSelected
                      ? 'bg-white text-emerald-700 border-3 border-emerald-600 shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-lg border border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <span className="flex items-center gap-2 lg:gap-3.5">
                    {/* Immagine o icona con effetti premium - più piccola su tablet */}
                    <div className="relative">
                      {category.image ? (
                        <>
                          <img
                            src={category.image}
                            alt={translatedName}
                            className={`w-8 h-8 lg:w-14 lg:h-14 rounded-full object-cover shadow-md transition-all duration-300 ${
                              isSelected
                                ? 'ring-2 lg:ring-3 ring-emerald-500 group-hover:scale-110'
                                : 'ring-1 lg:ring-2 ring-gray-200 group-hover:ring-emerald-300 group-hover:scale-110 group-hover:shadow-lg'
                            }`}
                            onError={(e) => console.error('Failed to load image:', category.image)}
                          />
                          {/* Badge count prodotti */}
                          {category.count !== undefined && category.count > 0 && (
                            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center shadow-md ring-2 ring-white">
                              {category.count}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xl lg:text-2xl">{category.icon || '📦'}</span>
                      )}
                    </div>

                    {/* Nome categoria */}
                    <span className="font-semibold text-sm lg:text-base">{translatedName}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Gradiente fade destra */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/95 to-transparent z-10 pointer-events-none" />
        </div>
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
