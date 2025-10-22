'use client';

// components/WizardSearch.tsx - Guided Product Search Wizard
import { useState, useMemo } from 'react';
import { Product } from '@/types/product';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { getLabel } from '@/lib/ui-labels';
import Image from 'next/image';
import { getTranslatedValue } from '@/lib/product-utils';

interface Category {
  field: string;
  label: string;
  translations: Record<string, string>;
  icon?: string;
  image?: string;
  count?: number;
}

interface Filter {
  key: string;
  values: string[];
  type?: string;
  options?: Array<{
    value: string;
    label: Record<string, string> | string;
    icon?: string;
  }>;
}

interface WizardSearchProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  filters: Filter[];
  products: Product[];
  currentLang: string;
  onApplyFilters: (filters: {
    category: string | null;
    selectedFilters: Record<string, string[]>;
  }) => void;
}

type WizardStep = 'welcome' | 'category' | 'application' | 'characteristics' | 'results';

interface WizardState {
  step: WizardStep;
  selectedCategory: string | null;
  selectedApplication: string[];
  selectedCharacteristics: Record<string, string[]>;
}

export default function WizardSearch({
  isOpen,
  onClose,
  categories,
  filters,
  products,
  currentLang,
  onApplyFilters,
}: WizardSearchProps) {
  const [wizardState, setWizardState] = useState<WizardState>({
    step: 'welcome',
    selectedCategory: null,
    selectedApplication: [],
    selectedCharacteristics: {},
  });

  // Find application filter (Applicazione su Legno, Alluminio, PVC)
  const applicationFilters = useMemo(() => {
    return filters.filter(f =>
      f.key.toLowerCase().includes('applicazione') &&
      f.options &&
      f.options.length > 0
    );
  }, [filters]);

  // Find characteristic filters (exclude application filters)
  const characteristicFilters = useMemo(() => {
    return filters.filter(f =>
      !f.key.toLowerCase().includes('applicazione') &&
      f.key !== 'prezzo' &&
      f.options &&
      f.options.length > 0 &&
      f.options.length <= 10 // Only filters with reasonable number of options
    ).slice(0, 5); // Max 5 characteristic filters
  }, [filters]);

  // Calculate filtered products based on current wizard state
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filter by category
      if (wizardState.selectedCategory) {
        const categoryAttr = product.attributi?.[wizardState.selectedCategory];
        if (!categoryAttr) return false;
        const categoryValue = typeof categoryAttr === 'object' && 'value' in categoryAttr
          ? categoryAttr.value
          : categoryAttr;
        if (categoryValue !== true && categoryValue !== 'true' && categoryValue !== 1 && categoryValue !== '1') {
          return false;
        }
      }

      // Filter by application (OR logic - match any selected)
      if (wizardState.selectedApplication.length > 0) {
        const hasAnyApplication = wizardState.selectedApplication.some(appKey => {
          const appAttr = product.attributi?.[appKey];
          if (!appAttr) return false;
          const appValue = typeof appAttr === 'object' && 'value' in appAttr
            ? appAttr.value
            : appAttr;
          return appValue === true || appValue === 'true' || appValue === 1 || appValue === '1';
        });
        if (!hasAnyApplication) return false;
      }

      // Filter by characteristics (AND logic - match all selected)
      for (const [filterKey, filterValues] of Object.entries(wizardState.selectedCharacteristics)) {
        if (filterValues.length === 0) continue;
        const productValue = product.attributi?.[filterKey];
        if (!productValue) return false;
        const strValue = typeof productValue === 'string' ? productValue : String(productValue);
        if (!filterValues.includes(strValue)) return false;
      }

      return true;
    });
  }, [products, wizardState]);

  const handleSelectCategory = (categoryField: string) => {
    setWizardState(prev => ({
      ...prev,
      selectedCategory: categoryField,
      step: 'application',
    }));
  };

  const handleToggleApplication = (appKey: string) => {
    setWizardState(prev => ({
      ...prev,
      selectedApplication: prev.selectedApplication.includes(appKey)
        ? prev.selectedApplication.filter(k => k !== appKey)
        : [...prev.selectedApplication, appKey],
    }));
  };

  const handleToggleCharacteristic = (filterKey: string, value: string) => {
    setWizardState(prev => {
      const current = prev.selectedCharacteristics[filterKey] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];

      return {
        ...prev,
        selectedCharacteristics: {
          ...prev.selectedCharacteristics,
          [filterKey]: updated,
        },
      };
    });
  };

  const handleNext = () => {
    if (wizardState.step === 'welcome') {
      setWizardState(prev => ({ ...prev, step: 'category' }));
    } else if (wizardState.step === 'category') {
      setWizardState(prev => ({ ...prev, step: 'application' }));
    } else if (wizardState.step === 'application') {
      setWizardState(prev => ({ ...prev, step: 'characteristics' }));
    } else if (wizardState.step === 'characteristics') {
      setWizardState(prev => ({ ...prev, step: 'results' }));
    }
  };

  const handleBack = () => {
    if (wizardState.step === 'category') {
      setWizardState(prev => ({ ...prev, step: 'welcome' }));
    } else if (wizardState.step === 'application') {
      setWizardState(prev => ({ ...prev, step: 'category' }));
    } else if (wizardState.step === 'characteristics') {
      setWizardState(prev => ({ ...prev, step: 'application' }));
    } else if (wizardState.step === 'results') {
      setWizardState(prev => ({ ...prev, step: 'characteristics' }));
    }
  };

  const handleApply = () => {
    // Build filters object for ProductCatalog
    const appliedFilters: Record<string, string[]> = {};

    // Add application filters
    wizardState.selectedApplication.forEach(appKey => {
      appliedFilters[appKey] = ['1'];
    });

    // Add characteristic filters
    Object.entries(wizardState.selectedCharacteristics).forEach(([key, values]) => {
      if (values.length > 0) {
        appliedFilters[key] = values;
      }
    });

    onApplyFilters({
      category: wizardState.selectedCategory,
      selectedFilters: appliedFilters,
    });
    onClose();
  };

  const handleReset = () => {
    setWizardState({
      step: 'welcome',
      selectedCategory: null,
      selectedApplication: [],
      selectedCharacteristics: {},
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">
                {getLabel('wizard.title', currentLang)}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>
                {wizardState.step === 'welcome' && getLabel('wizard.steps.welcome', currentLang)}
                {wizardState.step === 'category' && getLabel('wizard.steps.category', currentLang)}
                {wizardState.step === 'application' && getLabel('wizard.steps.application', currentLang)}
                {wizardState.step === 'characteristics' && getLabel('wizard.steps.characteristics', currentLang)}
                {wizardState.step === 'results' && getLabel('wizard.steps.results', currentLang)}
              </span>
              <span className="font-semibold">{getLabel('wizard.products_count', currentLang, { count: filteredProducts.length })}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                initial={{ width: 0 }}
                animate={{
                  width: wizardState.step === 'welcome' ? '0%' :
                         wizardState.step === 'category' ? '25%' :
                         wizardState.step === 'application' ? '50%' :
                         wizardState.step === 'characteristics' ? '75%' : '100%'
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {/* Welcome Step */}
              {wizardState.step === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {getLabel('wizard.welcome.greeting', currentLang)}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {getLabel('wizard.welcome.message', currentLang)}
                  </p>
                </motion.div>
              )}

              {/* Category Step */}
              {wizardState.step === 'category' && (
                <motion.div
                  key="category"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {getLabel('wizard.category_question', currentLang)}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {getLabel('wizard.category_subtitle', currentLang)}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.field}
                        onClick={() => handleSelectCategory(category.field)}
                        className={`p-4 rounded-xl border-2 transition-all hover:border-emerald-500 hover:shadow-md ${
                          wizardState.selectedCategory === category.field
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {category.image ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden mx-auto mb-2">
                            <img
                              src={category.image}
                              alt={category.translations[currentLang] || category.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="text-3xl mb-2">{category.icon || '📦'}</div>
                        )}
                        <p className="text-sm font-semibold text-gray-900 text-center">
                          {category.translations[currentLang] || category.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Application Step */}
              {wizardState.step === 'application' && applicationFilters.length > 0 && (
                <motion.div
                  key="application"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {getLabel('wizard.application_question', currentLang)}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {getLabel('wizard.application_subtitle', currentLang)}
                  </p>

                  <div className="space-y-3">
                    {applicationFilters.map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => handleToggleApplication(filter.key)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          wizardState.selectedApplication.includes(filter.key)
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-gray-200 bg-white hover:border-emerald-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                          wizardState.selectedApplication.includes(filter.key)
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-gray-300'
                        }`}>
                          {wizardState.selectedApplication.includes(filter.key) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 flex-1 text-left">
                          {filter.options?.[0]?.label
                            ? (typeof filter.options[0].label === 'string'
                                ? filter.options[0].label
                                : filter.options[0].label[currentLang] || filter.key)
                            : filter.key}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Characteristics Step */}
              {wizardState.step === 'characteristics' && characteristicFilters.length > 0 && (
                <motion.div
                  key="characteristics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {getLabel('wizard.characteristics_question', currentLang)}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {getLabel('wizard.characteristics_subtitle', currentLang)}
                  </p>

                  <div className="space-y-6">
                    {characteristicFilters.map((filter) => (
                      <div key={filter.key}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          {filter.options?.[0]?.label
                            ? (typeof filter.options[0].label === 'string'
                                ? filter.key
                                : filter.options[0].label[currentLang] || filter.key)
                            : filter.key}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {filter.options?.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleToggleCharacteristic(filter.key, option.value)}
                              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                wizardState.selectedCharacteristics[filter.key]?.includes(option.value)
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                              }`}
                            >
                              {typeof option.label === 'string' ? option.label : option.label[currentLang] || option.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Results Step */}
              {wizardState.step === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {getLabel('wizard.products_found', currentLang, { count: filteredProducts.length })}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {getLabel('wizard.results_message', currentLang)}
                    </p>

                    {/* Preview first 3 products */}
                    {filteredProducts.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {filteredProducts.slice(0, 3).map((product) => (
                          <div key={product.codice} className="bg-gray-50 rounded-lg p-2">
                            <div className="relative w-full aspect-square bg-white rounded-md overflow-hidden mb-2">
                              {product.immagine ? (
                                <Image
                                  src={product.immagine}
                                  alt={getTranslatedValue(product.nome, currentLang)}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 33vw, 150px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {getTranslatedValue(product.nome, currentLang)}
                            </p>
                            <p className="text-xs font-bold text-emerald-600">
                              €{product.prezzo.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              {wizardState.step !== 'welcome' && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {getLabel('wizard.back', currentLang)}
                </button>
              )}

              <div className="flex-1" />

              {wizardState.step === 'results' ? (
                <>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    {getLabel('wizard.reset', currentLang)}
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold flex items-center gap-2"
                  >
                    {getLabel('wizard.view_all', currentLang)}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={wizardState.step === 'category' && !wizardState.selectedCategory}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wizardState.step === 'welcome'
                    ? getLabel('wizard.welcome.start', currentLang)
                    : getLabel('wizard.next', currentLang)}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
