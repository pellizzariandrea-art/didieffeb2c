// Custom hook for form validation
import { useState, useCallback } from 'react';
import {
  validateCAP,
  validateCodiceFiscale,
  validatePartitaIVA,
  validateProvincia,
  validateLocalita,
  validateIndirizzo,
  ValidationResult
} from '@/lib/validation';

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export function useFormValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback((name: string, value: string, country: string = 'Italia'): ValidationResult => {
    switch (name) {
      case 'cap':
        return validateCAP(value, country);
      case 'codiceFiscale':
        // Only validate Italian fiscal codes for Italy
        if (country === 'Italia') {
          return value ? validateCodiceFiscale(value) : { valid: true };
        }
        return { valid: true };
      case 'partitaIva':
        // Only validate Italian VAT numbers for Italy
        if (country === 'Italia') {
          return value ? validatePartitaIVA(value) : { valid: true };
        }
        return { valid: true };
      case 'provincia':
        return validateProvincia(value, country);
      case 'citta':
      case 'localita':
        return validateLocalita(value);
      case 'via':
      case 'indirizzo':
        return validateIndirizzo(value);
      default:
        return { valid: true };
    }
  }, []);

  const setFieldError = useCallback((name: string, error: string | undefined) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const validateForm = useCallback((formData: Record<string, any>, country: string = 'Italia'): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Validate each field
    Object.entries(formData).forEach(([name, value]) => {
      const result = validateField(name, value as string, country);
      if (!result.valid) {
        newErrors[name] = result.error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField]);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateField,
    setFieldError,
    clearFieldError,
    validateForm,
    clearAllErrors
  };
}
