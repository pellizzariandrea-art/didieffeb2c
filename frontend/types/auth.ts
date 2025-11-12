// types/auth.ts
// Authentication and User Types

export type UserRole = 'user' | 'b2c' | 'b2b' | 'admin';

export type UserStatus = 'active' | 'pending' | 'disabled';

export type AccountType = 'private' | 'company';

// Base User Profile (common to all types)
export interface BaseUserProfile {
  email: string;
  role: UserRole;
  status: UserStatus;
  accountType?: AccountType;  // Type chosen during registration (private/company)
  clientCode?: string;  // Codice cliente nel gestionale MySQL (opzionale, usato per B2B/B2C)
  preferredLanguage?: 'it' | 'en' | 'de' | 'fr' | 'es' | 'pt' | 'hr' | 'sl' | 'el';  // Preferred language for emails
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  profileComplete?: boolean;  // Track if user completed their profile (for Google signup)
}

// Admin Profile
export interface AdminProfile extends BaseUserProfile {
  role: 'admin';
  nome: string;
  cognome: string;
}

// B2C Customer Profile
export interface B2CProfile extends BaseUserProfile {
  role: 'b2c';
  nome: string;
  cognome: string;
  codiceFiscale?: string;
  partitaIva?: string;
  indirizzoSpedizione: {
    via: string;
    citta: string;
    cap: string;
    provincia: string;
    paese: string;
  };
  telefono: string;
}

// B2B Customer Profile
export interface B2BProfile extends BaseUserProfile {
  role: 'b2b';
  ragioneSociale: string;
  partitaIva: string;
  codiceSDI: string;
  indirizzoFatturazione: {
    via: string;
    citta: string;
    cap: string;
    provincia: string;
    paese: string;
  };
  referente: {
    nome: string;
    email: string;
    telefono: string;
  };
}

// Union type for all user profiles
export type UserProfile = AdminProfile | B2CProfile | B2BProfile;

// Auth Context State
export interface AuthState {
  user: UserProfile | null;
  firebaseUser: any | null; // Firebase User object
  loading: boolean;
  error: string | null;
}

// Registration Data Types
export interface AdminRegistrationData {
  email: string;
  password: string;
  nome: string;
  cognome: string;
}

export interface B2CRegistrationData {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  codiceFiscale?: string;
  partitaIva?: string;
  indirizzoSpedizione: {
    via: string;
    citta: string;
    cap: string;
    provincia: string;
    paese: string;
  };
  telefono: string;
  preferredLanguage?: 'it' | 'en' | 'de' | 'fr' | 'es' | 'pt' | 'hr' | 'sl' | 'el';
}

export interface B2BRegistrationData {
  email: string;
  password: string;
  ragioneSociale: string;
  partitaIva: string;
  codiceSDI: string;
  indirizzoFatturazione: {
    via: string;
    citta: string;
    cap: string;
    provincia: string;
    paese: string;
  };
  referente: {
    nome: string;
    email: string;
    telefono: string;
  };
  preferredLanguage?: 'it' | 'en' | 'de' | 'fr' | 'es' | 'pt' | 'hr' | 'sl' | 'el';
}

export type RegistrationData =
  | AdminRegistrationData
  | B2CRegistrationData
  | B2BRegistrationData;
