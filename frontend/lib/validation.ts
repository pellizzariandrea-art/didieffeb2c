// Validation utilities for Italian forms

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate CAP / Postal Code
 * For Italy: must be exactly 5 digits
 * For other countries: at least 3 characters
 */
export function validateCAP(cap: string, country: string = 'Italia'): ValidationResult {
  if (!cap) {
    return { valid: false, error: 'CAP/Postal Code richiesto' };
  }

  // Italian postal code validation
  if (country === 'Italia') {
    const capRegex = /^\d{5}$/;
    if (!capRegex.test(cap)) {
      return { valid: false, error: 'CAP deve essere di 5 cifre' };
    }
  } else {
    // Generic postal code validation for other countries
    if (cap.trim().length < 3) {
      return { valid: false, error: 'Postal code troppo corto (minimo 3 caratteri)' };
    }
    if (cap.trim().length > 10) {
      return { valid: false, error: 'Postal code troppo lungo (massimo 10 caratteri)' };
    }
  }

  return { valid: true };
}

/**
 * Validate Italian Codice Fiscale
 * Must be 16 alphanumeric characters
 */
export function validateCodiceFiscale(cf: string): ValidationResult {
  if (!cf) {
    return { valid: false, error: 'Codice Fiscale richiesto' };
  }

  const cfUpper = cf.toUpperCase().trim();
  const cfRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;

  if (cfUpper.length !== 16) {
    return { valid: false, error: 'Codice Fiscale deve essere di 16 caratteri' };
  }

  if (!cfRegex.test(cfUpper)) {
    return { valid: false, error: 'Codice Fiscale non valido' };
  }

  return { valid: true };
}

/**
 * Validate Italian Partita IVA
 * Must be exactly 11 digits
 */
export function validatePartitaIVA(piva: string): ValidationResult {
  if (!piva) {
    return { valid: false, error: 'Partita IVA richiesta' };
  }

  const pivaRegex = /^\d{11}$/;
  if (!pivaRegex.test(piva)) {
    return { valid: false, error: 'Partita IVA deve essere di 11 cifre' };
  }

  // Basic checksum validation
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    let digit = parseInt(piva[i]);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      let doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: 'Partita IVA non valida (checksum errato)' };
  }

  return { valid: true };
}

/**
 * Validate Province / State code
 * For Italy: must be valid 2-letter province code
 * For other countries: generic validation (2-50 characters)
 */
export function validateProvincia(provincia: string, country: string = 'Italia'): ValidationResult {
  if (!provincia) {
    return { valid: false, error: 'Provincia/State richiesta' };
  }

  // Italian province validation
  if (country === 'Italia') {
    const provUpper = provincia.toUpperCase().trim();
    const provRegex = /^[A-Z]{2}$/;

    if (!provRegex.test(provUpper)) {
      return { valid: false, error: 'Provincia deve essere di 2 lettere (es. VI, PD)' };
    }

    // List of valid Italian province codes
    const validProvinces = [
      'AG', 'AL', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AT', 'AV', 'BA', 'BG', 'BI', 'BL', 'BN', 'BO',
      'BR', 'BS', 'BT', 'BZ', 'CA', 'CB', 'CE', 'CH', 'CI', 'CL', 'CN', 'CO', 'CR', 'CS', 'CT',
      'CZ', 'EN', 'FC', 'FE', 'FG', 'FI', 'FM', 'FR', 'GE', 'GO', 'GR', 'IM', 'IS', 'KR', 'LC',
      'LE', 'LI', 'LO', 'LT', 'LU', 'MB', 'MC', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NA', 'NO',
      'NU', 'OR', 'PA', 'PC', 'PD', 'PE', 'PG', 'PI', 'PN', 'PO', 'PR', 'PT', 'PU', 'PV', 'PZ',
      'RA', 'RC', 'RE', 'RG', 'RI', 'RM', 'RN', 'RO', 'SA', 'SI', 'SO', 'SP', 'SR', 'SS', 'SU',
      'SV', 'TA', 'TE', 'TN', 'TO', 'TP', 'TR', 'TS', 'TV', 'UD', 'VA', 'VB', 'VC', 'VE', 'VI',
      'VR', 'VS', 'VT', 'VV'
    ];

    if (!validProvinces.includes(provUpper)) {
      return { valid: false, error: 'Codice provincia non valido' };
    }
  } else {
    // Generic state/province validation for other countries
    if (provincia.trim().length < 2) {
      return { valid: false, error: 'Provincia/State troppo corta (minimo 2 caratteri)' };
    }
    if (provincia.trim().length > 50) {
      return { valid: false, error: 'Provincia/State troppo lunga (massimo 50 caratteri)' };
    }
  }

  return { valid: true };
}

/**
 * Validate city/località
 */
export function validateLocalita(localita: string): ValidationResult {
  if (!localita || localita.trim().length < 2) {
    return { valid: false, error: 'Località richiesta (minimo 2 caratteri)' };
  }

  if (localita.trim().length > 100) {
    return { valid: false, error: 'Località troppo lunga (massimo 100 caratteri)' };
  }

  return { valid: true };
}

/**
 * Validate address
 */
export function validateIndirizzo(indirizzo: string): ValidationResult {
  if (!indirizzo || indirizzo.trim().length < 5) {
    return { valid: false, error: 'Indirizzo richiesto (minimo 5 caratteri)' };
  }

  if (indirizzo.trim().length > 200) {
    return { valid: false, error: 'Indirizzo troppo lungo (massimo 200 caratteri)' };
  }

  return { valid: true };
}
