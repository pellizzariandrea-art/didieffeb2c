// Password validation utilities

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  checks: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Validate password against security rules
 */
export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const errors: string[] = [];

  if (!checks.minLength) {
    errors.push('La password deve contenere almeno 8 caratteri');
  }
  if (!checks.hasUpperCase) {
    errors.push('La password deve contenere almeno una lettera maiuscola');
  }
  if (!checks.hasLowerCase) {
    errors.push('La password deve contenere almeno una lettera minuscola');
  }
  if (!checks.hasNumber) {
    errors.push('La password deve contenere almeno un numero');
  }
  // Special char is optional - not added to errors

  const valid = checks.minLength && checks.hasUpperCase && checks.hasLowerCase && checks.hasNumber;

  return { valid, errors, checks };
}

/**
 * Get password strength (0-4)
 * 0 = Very weak, 1 = Weak, 2 = Fair, 3 = Good, 4 = Strong
 */
export function getPasswordStrength(password: string): number {
  const { checks } = validatePassword(password);

  let strength = 0;
  if (checks.minLength) strength++;
  if (checks.hasUpperCase) strength++;
  if (checks.hasLowerCase) strength++;
  if (checks.hasNumber) strength++;
  if (checks.hasSpecialChar) strength++;

  return Math.min(strength, 4);
}

/**
 * Get password strength label and color
 */
export function getPasswordStrengthInfo(password: string): {
  label: string;
  color: string;
  bgColor: string;
} {
  const strength = getPasswordStrength(password);

  switch (strength) {
    case 0:
    case 1:
      return { label: 'Molto debole', color: 'text-red-700', bgColor: 'bg-red-100' };
    case 2:
      return { label: 'Debole', color: 'text-orange-700', bgColor: 'bg-orange-100' };
    case 3:
      return { label: 'Buona', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
    case 4:
      return { label: 'Forte', color: 'text-green-700', bgColor: 'bg-green-100' };
    default:
      return { label: 'Molto debole', color: 'text-red-700', bgColor: 'bg-red-100' };
  }
}
