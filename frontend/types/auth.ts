// types/auth.ts
// Authentication and User Types

export type UserRole = 'admin' | 'b2c' | 'b2b';

export type UserStatus = 'active' | 'pending' | 'disabled';

// Base User Profile (common to all types)
export interface BaseUserProfile {
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
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
}

export type RegistrationData =
  | AdminRegistrationData
  | B2CRegistrationData
  | B2BRegistrationData;
