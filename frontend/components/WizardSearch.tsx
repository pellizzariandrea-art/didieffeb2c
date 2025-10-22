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
  includeFilters?: string[];
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
        // Use Next.js API route proxy for both development and production
        const apiUrl = '/admin/api/get-wizard-config';

        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log('[DEBUG] Loaded wizard config from:', apiUrl);
        console.log('[DEBUG] Loaded wizard config:', data);
        if (data.success && data.config) {
          console.log('[DEBUG] Step 2 before filter:', data.config.steps[1]);
          console.log('[DEBUG] Step 2 includeFilters:', data.config.steps[1]?.includeFilters);
          // Filter out deprecated "category" type steps
          const filteredConfig = {
            ...data.config,
            steps: data.config.steps.filter((step: WizardConfigStep) => step.type !== 'category')
          };
          console.log('[DEBUG] Step 1 after filter (was step 2):', filteredConfig.steps[0]);
          console.log('[DEBUG] Step 1 includeFilters:', filteredConfig.steps[0]?.includeFilters);
          setWizardConfig(filteredConfig);
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

  // Calculate filtered products based on current wizard state
  const filteredProducts = useMemo(() => {
    console.log('[WIZARD STATE]', {
      selectedCategory: wizardState.selectedCategory,
      selectedFilters: wizardState.selectedFilters,
      totalProducts: products.length
    });
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

        let productValue = product.attributi?.[filterKey];
        if (!productValue) return false;

        // Extract value from object structure if needed
        if (typeof productValue === 'object' && 'value' in productValue) {
          productValue = productValue.value;
        }

        // Handle boolean attributes (for application filters)
        if (typeof productValue === 'boolean' || productValue === 'true' || productValue === 'false' ||
            productValue === '1' || productValue === '0' || productValue === 1 || productValue === 0) {
          const boolValue = productValue === true || productValue === 'true' || productValue === 1 || productValue === '1';
          if (filterValues.includes('1') && !boolValue) return false;
          continue;
        }

        // Handle multilingual values
        if (typeof productValue === 'object' && 'it' in productValue) {
          productValue = productValue.it;
        }

        // Handle string/value attributes
        const strValue = (typeof productValue === 'string' ? productValue : String(productValue)).trim();
        // Case-insensitive matching
        const matched = filterValues.some(fv => fv.trim().toLowerCase() === strValue.toLowerCase());
        if (!matched) {
          return false;
        }
      }

      return true;
    });
  }, [products, wizardState]);


  // Get filter for current step
  const currentFilter = useMemo(() => {
    if (!currentStep || currentStep.type === 'category' || currentStep.type === 'multi_filter' || currentStep.type === 'characteristics') {
      return null;
    }
    return filters.find(f => f.key === currentStep.filterKey);
  }, [currentStep, filters]);
  // Calculate available values for current filter based on filtered products
  const filteredAvailableValues = useMemo(() => {
    if (!currentFilter || !currentStep || currentStep.type !== 'filter') {
      return null;
    }

    // For multi-select filters, we need to calculate available values EXCLUDING the current filter
    // to allow selecting multiple options
    const productsToCheck = products.filter(product => {
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

      // Filter by selected filters EXCEPT the current one
      for (const [filterKey, filterValues] of Object.entries(wizardState.selectedFilters)) {
        if (filterKey === currentFilter.key) continue; // Skip current filter
        if (filterValues.length === 0) continue;

        let productValue = product.attributi?.[filterKey];
        if (!productValue) return false;

        if (typeof productValue === 'object' && 'value' in productValue) {
          productValue = productValue.value;
        }

        if (typeof productValue === 'boolean' || productValue === 'true' || productValue === 'false' ||
            productValue === '1' || productValue === '0' || productValue === 1 || productValue === 0) {
          const boolValue = productValue === true || productValue === 'true' || productValue === 1 || productValue === '1';
          if (filterValues.includes('1') && !boolValue) return false;
          continue;
        }

        if (typeof productValue === 'object' && 'it' in productValue) {
          productValue = productValue.it;
        }

        const strValue = typeof productValue === 'string' ? productValue : String(productValue);
        if (!filterValues.includes(strValue)) return false;
      }

      return true;
    });

    // Collect unique values from these products for this filter
    const availableSet = new Set<string>();
    productsToCheck.forEach(product => {
      const value = product.attributi?.[currentFilter.key];
      if (!value) return;

      // Extract string value
      let strValue: string;
      if (typeof value === 'object' && 'value' in value) {
        strValue = typeof value.value === 'object' && 'it' in value.value
          ? value.value.it
          : String(value.value);
      } else if (typeof value === 'object' && 'it' in value) {
        strValue = value.it;
      } else {
        strValue = String(value);
      }

      availableSet.add(strValue.trim());
    });

    const result = Array.from(availableSet);
    console.log('[DEBUG] filteredAvailableValues for', currentFilter.key, ':', result, 'from', filteredProducts.length, 'products');
    return result;
  }, [currentFilter, currentStep, filteredProducts]);


  // Get boolean filters for characteristics step
  const characteristicsFilters = useMemo(() => {
    if (!currentStep || currentStep.type !== 'characteristics') {
      return [];
    }

    const includeKeys = currentStep.includeFilters || [];
    const excludeKeys = currentStep.excludeFilters || [];

    // Get all boolean filters (filters with only '0' and '1' as available values)
    const result = filters.filter(f => {
      if (!f.availableValues || f.availableValues.length === 0) return false;

      // Check if all values are either '0' or '1'
      const onlyBooleanValues = f.availableValues.every(v => v === '0' || v === '1');
      if (!onlyBooleanValues) return false;

      // If includeFilters is specified, only include those
      if (includeKeys.length > 0) {
        return includeKeys.includes(f.key);
      }

      // Otherwise exclude specified filters
      if (excludeKeys.length > 0) {
        return !excludeKeys.includes(f.key);
      }

      // Fallback: if no includeFilters specified, show only "Applicazione su..." filters
      if (includeKeys.length === 0) {
        return f.key.startsWith('Applicazione su');
      }

      return true;
    });

    console.log('[DEBUG] characteristicsFilters result:', result.length, 'filters:', result.map(f => f.key));
    return result;
  }, [currentStep, filters]);

  // Get available filters for multi-filter step
  const availableMultiFilters = useMemo(() => {
    if (!currentStep || currentStep.type !== 'multi_filter') {
      return [];
    }
    const excludeKeys = currentStep.excludeFilters || [];

    // For each filter, calculate available values from filtered products
    return filters.filter(f => {
      const isNotExcluded = !excludeKeys.includes(f.key);
      const isNotPrice = f.key !== 'prezzo';
      return isNotExcluded && isNotPrice;
    }).map(f => {
      // Calculate available values from filtered products
      const availableSet = new Set<string>();
      filteredProducts.forEach(product => {
        const value = product.attributi?.[f.key];
        if (!value) return;

        // Extract string value
        let strValue: string;
        if (typeof value === 'object' && 'value' in value) {
          strValue = typeof value.value === 'object' && 'it' in value.value
            ? value.value.it
            : String(value.value);
        } else if (typeof value === 'object' && 'it' in value) {
          strValue = value.it;
        } else {
          strValue = String(value);
        }

        availableSet.add(strValue.trim());
      });

      return {
        ...f,
        availableValues: Array.from(availableSet)
      };
    }).filter(f => f.availableValues.length > 0).slice(0, currentStep.maxFilters || 10);
  }, [currentStep, filters, filteredProducts]);



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

    // Se siamo all'ultimo step e non ci sono prodotti, non andare avanti
    if (wizardState.stepIndex === wizardConfig.steps.length && filteredProducts.length === 0) {
      return;
    }

    if (wizardState.stepIndex < maxStepIndex) {
      setWizardState(prev => ({ ...prev, stepIndex: prev.stepIndex + 1 }));
    }
  };

  const handleBack = () => {
    if (wizardState.stepIndex > 0) {
      setWizardState(prev => {
        // Rimuovi il filtro dello step corrente quando torni indietro
        const newFilters = { ...prev.selectedFilters };
        if (currentStep && currentStep.filterKey) {
          delete newFilters[currentStep.filterKey];
        }
        // Se lo step corrente è characteristics, rimuovi tutti i filtri inclusi
        if (currentStep && currentStep.type === 'characteristics' && currentStep.includeFilters) {
          currentStep.includeFilters.forEach(key => delete newFilters[key]);
        }
        return {
          ...prev,
          stepIndex: prev.stepIndex - 1,
          selectedFilters: newFilters
        };
      });
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
          className="relative bg-white rounded-t-2xl md:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
              <h2 className="text-base md:text-lg font-bold text-gray-900">
                {getLabel('wizard.title', currentLang)}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-4 md:px-6 py-2 md:py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0 text-xs text-gray-600 mb-2">
              <span className="truncate text-xs md:text-sm">
                {wizardState.stepIndex === 0 && getLabel('wizard.steps.welcome', currentLang)}
                {currentStep && (currentStep.title[currentLang] || currentStep.title['it'])}
                {wizardConfig && wizardState.stepIndex === wizardConfig.steps.length + 1 && getLabel('wizard.steps.results', currentLang)}
              </span>
              <span className="font-semibold text-xs md:text-sm whitespace-nowrap">{getLabel('wizard.products_count', currentLang, { count: filteredProducts.length })}</span>
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
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {isLoadingConfig ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm md:text-base text-gray-600">Caricamento configurazione...</p>
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
                    className="text-center py-4 md:py-8"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                      <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 px-2">
                      {getLabel('wizard.welcome.greeting', currentLang)}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 max-w-md mx-auto px-4">
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
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">
                      {currentStep.title[currentLang] || currentStep.title['it']}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
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
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">
                      {currentStep.title[currentLang] || currentStep.title['it']}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
                      {currentStep.subtitle[currentLang] || currentStep.subtitle['it']}
                    </p>

                    <div className="space-y-2 md:space-y-3">
                      {(filteredAvailableValues && filteredAvailableValues.length > 0) ? (
                        <div className="flex flex-wrap gap-2">
                          {filteredAvailableValues.map((value) => {
                            // Helper to get translated value from object or string
                            const getTranslatedValue = (val: any, lang: string): string => {
                              if (typeof val === 'string') return val;
                              if (typeof val === 'object' && val !== null) {
                                return val[lang] || val['it'] || Object.values(val)[0] || '';
                              }
                              return String(val);
                            };

                            // Find the option by comparing Italian values
                            const option = currentFilter.options?.find(opt => {
                              const itValue = getTranslatedValue(opt.value, 'it').trim();
                              return itValue === value.trim();
                            });

                            // Get the translated label
                            const displayLabel = option
                              ? getTranslatedValue(option.value, currentLang).trim()
                              : value;

                            return (
                              <button
                                key={value}
                                onClick={() => handleToggleFilter(currentFilter.key, value, currentStep.multiSelect || false)}
                                className={`px-3 py-2.5 md:px-4 md:py-2 rounded-lg border-2 text-xs md:text-sm font-medium transition-all flex items-center gap-2 touch-manipulation ${
                                  wizardState.selectedFilters[currentFilter.key]?.includes(value)
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                                }`}
                              >
                                {currentStep.multiSelect && wizardState.selectedFilters[currentFilter.key]?.includes(value) && (
                                  <Check className="w-3 h-3 md:w-4 md:h-4" />
                                )}
                                {displayLabel}
                              </button>
                            );
                          })}
                        </div>
                      ) : (filteredAvailableValues === null && currentFilter.options && currentFilter.options.length > 0) ? (
                        currentFilter.options.map((option, index) => {
                          const optionValue = typeof option.value === 'string' ? option.value : String(option.value);
                          const isSelected = wizardState.selectedFilters[currentFilter.key]?.includes(optionValue);
                          return (
                            <button
                              key={`${currentFilter.key}-${optionValue}-${index}`}
                              onClick={() => handleToggleFilter(currentFilter.key, optionValue, currentStep.multiSelect || false)}
                              className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all flex items-center gap-3 touch-manipulation ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50'
                                  : 'border-gray-200 bg-white hover:border-emerald-300'
                              }`}
                            >
                              {currentStep.multiSelect && (
                                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />}
                                </div>
                              )}
                              <span className="text-xs md:text-sm font-semibold text-gray-900 flex-1 text-left">
                                {typeof option.label === 'string' ? option.label : option.label[currentLang] || option.value}
                              </span>
                            </button>
                          );
                        })
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
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">
                      {currentStep.title[currentLang] || currentStep.title['it']}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
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
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">
                      {currentStep.title[currentLang] || currentStep.title['it']}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
                      {currentStep.subtitle[currentLang] || currentStep.subtitle['it']}
                    </p>

                    <div className="space-y-2 md:space-y-3">
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
                            className={`w-full p-3 md:p-4 rounded-xl border-2 transition-all flex items-center gap-3 touch-manipulation ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200 bg-white hover:border-purple-300'
                            }`}
                          >
                            <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />}
                            </div>
                            <span className="text-xs md:text-sm font-semibold text-gray-900 flex-1 text-left">
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
          <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 bg-gray-50">
            {!isLoadingConfig && (
              <>
                {/* Warning quando 0 prodotti (solo dopo lo step di benvenuto) */}
                {wizardState.stepIndex > 0 && filteredProducts.length === 0 && wizardConfig && wizardState.stepIndex !== wizardConfig.steps.length + 1 && (
                  <div className="mb-3 p-2.5 md:p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-semibold text-red-900">Nessun prodotto trovato</p>
                      <p className="text-xs text-red-700 hidden md:block">La selezione attuale non corrisponde ad alcun prodotto. Modifica i filtri o torna indietro.</p>
                    </div>
                  </div>
                )}
              <div className="flex items-center gap-2 md:gap-3">
                {wizardState.stepIndex > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-3 py-2.5 md:px-4 md:py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium flex items-center gap-1.5 md:gap-2 text-sm md:text-base touch-manipulation"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">{getLabel('wizard.back', currentLang)}</span>
                  </button>
                )}

                <div className="flex-1" />

                {wizardConfig && wizardState.stepIndex === wizardConfig.steps.length + 1 ? (
                  <>
                    <button
                      onClick={handleReset}
                      className="px-3 py-2.5 md:px-4 md:py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm md:text-base touch-manipulation"
                    >
                      {getLabel('wizard.reset', currentLang)}
                    </button>
                    <button
                      onClick={handleApply}
                      className="px-4 py-2.5 md:px-6 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold flex items-center gap-1.5 md:gap-2 text-sm md:text-base touch-manipulation"
                    >
                      {getLabel('wizard.view_all', currentLang)}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={
                        (currentStep?.type === 'category' && !wizardState.selectedCategory) ||
                        (wizardState.stepIndex > 0 && filteredProducts.length === 0 && currentStep?.type !== 'multi_filter')
                      }
                    className="px-4 py-2.5 md:px-6 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold flex items-center gap-1.5 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base touch-manipulation"
                  >
                    {wizardState.stepIndex === 0
                      ? getLabel('wizard.welcome.start', currentLang)
                      : getLabel('wizard.next', currentLang)}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
