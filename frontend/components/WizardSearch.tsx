'use client';

// components/WizardSearch.tsx - Guided Product Search Wizard
import { useState, useMemo, useEffect } from 'react';
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
  availableValues?: string[];
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

interface WizardConfigStep {
  id: string;
  order: number;
  type: 'category' | 'filter' | 'multi_filter' | 'characteristics';
  filterKey?: string;
  required?: boolean;
  multiSelect?: boolean;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  aiPrompt?: string;
  allowTextInput?: boolean;
  maxFilters?: number;
  excludeFilters?: string[];
}

interface WizardConfig {
  version: string;
  lastUpdated: string;
  steps: WizardConfigStep[];
  ai?: {
    enabled: boolean;
    provider: string;
    model: string;
    systemPrompt: string;
    temperature: number;
  };
}

interface WizardState {
  stepIndex: number;
  selectedCategory: string | null;
  selectedFilters: Record<string, string[]>;
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
  const [wizardConfig, setWizardConfig] = useState<WizardConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [wizardState, setWizardState] = useState<WizardState>({
    stepIndex: 0,
    selectedCategory: null,
    selectedFilters: {},
  });

  // Load wizard configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/admin/api/get-wizard-config.php');
        const data = await response.json();
        if (data.success && data.config) {
          setWizardConfig(data.config);
        }
      } catch (error) {
        console.error('Error loading wizard config:', error);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  // Get current step configuration
  const currentStep = useMemo(() => {
    if (!wizardConfig || wizardState.stepIndex >= wizardConfig.steps.length + 1) {
      return null;
    }
    // Step 0 is welcome, steps 1+ are from config, last step is results
    if (wizardState.stepIndex === 0) return null; // Welcome step
    if (wizardState.stepIndex === wizardConfig.steps.length + 1) return null; // Results step
    return wizardConfig.steps[wizardState.stepIndex - 1];
  }, [wizardConfig, wizardState.stepIndex]);

  // Get filter for current step
  const currentFilter = useMemo(() => {
    if (!currentStep || currentStep.type === 'category' || currentStep.type === 'multi_filter' || currentStep.type === 'characteristics') {
      return null;
    }
    return filters.find(f => f.key === currentStep.filterKey);
  }, [currentStep, filters]);

  // Get boolean filters for characteristics step
  const characteristicsFilters = useMemo(() => {
    if (!currentStep || currentStep.type !== 'characteristics') {
      return [];
    }
    // Get all boolean filters (filters with only '1' as available value)
    return filters.filter(f => {
      const hasOnlyTrue = f.availableValues && f.availableValues.length === 1 && f.availableValues[0] === '1';
      const hasOptions = f.options && f.options.length > 0;
      return hasOnlyTrue || hasOptions;
    });
  }, [currentStep, filters]);

  // Get available filters for multi-filter step
  const availableMultiFilters = useMemo(() => {
    if (!currentStep || currentStep.type !== 'multi_filter') {
      return [];
    }
    const excludeKeys = currentStep.excludeFilters || [];
    return filters.filter(f => {
      const isNotExcluded = !excludeKeys.includes(f.key);
      const isNotPrice = f.key !== 'prezzo';
      const hasValues = f.availableValues && f.availableValues.length > 0;
      return isNotExcluded && isNotPrice && hasValues;
    }).slice(0, currentStep.maxFilters || 10);
  }, [currentStep, filters]);

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

      // Filter by selected filters
      for (const [filterKey, filterValues] of Object.entries(wizardState.selectedFilters)) {
        if (filterValues.length === 0) continue;

        const productValue = product.attributi?.[filterKey];
        if (!productValue) return false;

        // Handle boolean attributes (for application filters)
        if (typeof productValue === 'boolean' || productValue === 'true' || productValue === 'false' ||
            productValue === '1' || productValue === '0' || productValue === 1 || productValue === 0) {
          const boolValue = productValue === true || productValue === 'true' || productValue === 1 || productValue === '1';
          if (filterValues.includes('1') && !boolValue) return false;
          continue;
        }

        // Handle string/value attributes
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
    }));
  };

  const handleToggleFilter = (filterKey: string, value: string, multiSelect: boolean = true) => {
    setWizardState(prev => {
      const current = prev.selectedFilters[filterKey] || [];
      let updated: string[];

      if (multiSelect) {
        updated = current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value];
      } else {
        updated = current.includes(value) ? [] : [value];
      }

      return {
        ...prev,
        selectedFilters: {
          ...prev.selectedFilters,
          [filterKey]: updated,
        },
      };
    });
  };

  const handleNext = () => {
    if (!wizardConfig) return;
    const maxStepIndex = wizardConfig.steps.length + 1; // +1 for results step
    if (wizardState.stepIndex < maxStepIndex) {
      setWizardState(prev => ({ ...prev, stepIndex: prev.stepIndex + 1 }));
    }
  };

  const handleBack = () => {
    if (wizardState.stepIndex > 0) {
      setWizardState(prev => ({ ...prev, stepIndex: prev.stepIndex - 1 }));
    }
  };

  const handleApply = () => {
    // Build filters object for ProductCatalog
    const appliedFilters: Record<string, string[]> = {};

    // Add all selected filters
    Object.entries(wizardState.selectedFilters).forEach(([key, values]) => {
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
      stepIndex: 0,
      selectedCategory: null,
      selectedFilters: {},
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
                {wizardState.stepIndex === 0 && getLabel('wizard.steps.welcome', currentLang)}
                {currentStep && (currentStep.title[currentLang] || currentStep.title['it'])}
                {wizardConfig && wizardState.stepIndex === wizardConfig.steps.length + 1 && getLabel('wizard.steps.results', currentLang)}
              </span>
              <span className="font-semibold">{getLabel('wizard.products_count', currentLang, { count: filteredProducts.length })}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                initial={{ width: 0 }}
                animate={{
                  width: wizardConfig ? `${(wizardState.stepIndex / (wizardConfig.steps.length + 1)) * 100}%` : '0%'
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingConfig ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Caricamento configurazione...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* Welcome Step */}
                {wizardState.stepIndex === 0 && (
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
                {currentStep && currentStep.type === 'category' && (
                  <motion.div
                    key="category"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {currentStep.title[currentLang] || currentStep.title['it']}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      {currentStep.subtitle[currentLang] || currentStep.subtitle['it']}
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

                {/* Filter Step (single filter with options) */}
                {currentStep && currentStep.type === 'filter' && currentFilter && (
                  <motion.div
                    key={`filter-${currentStep.id}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {currentStep.title[currentLang] || currentStep.title['it']}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      {currentStep.subtitle[currentLang] || currentStep.subtitle['it']}
                    </p>

                    <div className="space-y-3">
                      {currentFilter.options && currentFilter.options.length > 0 ? (
                        currentFilter.options.map((option) => {
                          const isSelected = wizardState.selectedFilters[currentFilter.key]?.includes('1');
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleToggleFilter(currentFilter.key, '1', currentStep.multiSelect || false)}
                              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50'
                                  : 'border-gray-200 bg-white hover:border-emerald-300'
                              }`}
                            >
                              {currentStep.multiSelect && (
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                                }`}>
                                  {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                              )}
                              <span className="text-sm font-semibold text-gray-900 flex-1 text-left">
                                {typeof option.label === 'string' ? option.label : option.label[currentLang] || option.value}
                              </span>
                            </button>
                          );
                        })
                      ) : currentFilter.availableValues && currentFilter.availableValues.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentFilter.availableValues.map((value) => (
                            <button
                              key={value}
                              onClick={() => handleToggleFilter(currentFilter.key, value, currentStep.multiSelect || false)}
                              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                wizardState.selectedFilters[currentFilter.key]?.includes(value)
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Nessuna opzione disponibile</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Multi-Filter Step (show multiple filters) */}
                {currentStep && currentStep.type === 'multi_filter' && (
                  <motion.div
                    key="multi-filter"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {currentStep.title[currentLang] || currentStep.title['it']}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      {currentStep.subtitle[currentLang] || currentStep.subtitle['it']}
                    </p>

                    <div className="space-y-6">
                      {availableMultiFilters.map((filter) => (
                        <div key={filter.key}>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            {filter.key}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {filter.availableValues?.map((value) => (
                              <button
                                key={value}
                                onClick={() => handleToggleFilter(filter.key, value, true)}
                                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                  wizardState.selectedFilters[filter.key]?.includes(value)
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                                }`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Characteristics Step (boolean filters as checkboxes) */}
                {currentStep && currentStep.type === 'characteristics' && (
                  <motion.div
                    key="characteristics"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {currentStep.title[currentLang] || currentStep.title['it']}
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      {currentStep.subtitle[currentLang] || currentStep.subtitle['it']}
                    </p>

                    <div className="space-y-3">
                      {characteristicsFilters.map((filter) => {
                        const isSelected = wizardState.selectedFilters[filter.key]?.includes('1');
                        const label = filter.options && filter.options.length > 0
                          ? (typeof filter.options[0].label === 'string'
                              ? filter.options[0].label
                              : filter.options[0].label[currentLang] || filter.options[0].label['it'] || filter.key)
                          : filter.key;

                        return (
                          <button
                            key={filter.key}
                            onClick={() => handleToggleFilter(filter.key, '1', true)}
                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200 bg-white hover:border-purple-300'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 flex-1 text-left">
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Results Step */}
                {wizardConfig && wizardState.stepIndex === wizardConfig.steps.length + 1 && (
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
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {!isLoadingConfig && (
              <div className="flex items-center gap-3">
                {wizardState.stepIndex > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {getLabel('wizard.back', currentLang)}
                  </button>
                )}

                <div className="flex-1" />

                {wizardConfig && wizardState.stepIndex === wizardConfig.steps.length + 1 ? (
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
                    disabled={currentStep?.type === 'category' && !wizardState.selectedCategory}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {wizardState.stepIndex === 0
                      ? getLabel('wizard.welcome.start', currentLang)
                      : getLabel('wizard.next', currentLang)}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
