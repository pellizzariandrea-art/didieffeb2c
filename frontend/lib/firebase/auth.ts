// lib/firebase/auth.ts
// Firebase Authentication Utilities

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { getAuthInstance } from './config';
import { createUserProfile, getUserProfile } from './firestore';
import type {
  AdminRegistrationData,
  B2CRegistrationData,
  B2BRegistrationData,
  UserProfile,
} from '@/types/auth';

// Login
export async function login(email: string, password: string) {
  try {
    const auth = getAuthInstance();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await getUserProfile(userCredential.user.uid);

    // Check if user is active
    if (userProfile && userProfile.status !== 'active') {
      await signOut(auth);
      throw new Error('Account non attivo. Contatta l\'amministratore.');
    }

    return { user: userCredential.user, profile: userProfile };
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante il login');
  }
}

// Register Admin
export async function registerAdmin(data: AdminRegistrationData) {
  try {
    const auth = getAuthInstance();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // Update display name
    await updateProfile(userCredential.user, {
      displayName: `${data.nome} ${data.cognome}`,
    });

    // Create Firestore profile
    const profile: UserProfile = {
      email: data.email,
      role: 'admin',
      status: 'active',
      nome: data.nome,
      cognome: data.cognome,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await createUserProfile(userCredential.user.uid, profile);

    return { user: userCredential.user, profile };
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante la registrazione');
  }
}

// Register B2C
export async function registerB2C(data: B2CRegistrationData) {
  try {
    const auth = getAuthInstance();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    await updateProfile(userCredential.user, {
      displayName: `${data.nome} ${data.cognome}`,
    });

    const profile: UserProfile = {
      email: data.email,
      role: 'b2c',
      status: 'pending', // B2C requires approval
      nome: data.nome,
      cognome: data.cognome,
      codiceFiscale: data.codiceFiscale,
      partitaIva: data.partitaIva,
      indirizzoSpedizione: data.indirizzoSpedizione,
      telefono: data.telefono,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await createUserProfile(userCredential.user.uid, profile);

    return { user: userCredential.user, profile };
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante la registrazione');
  }
}

// Register B2B
export async function registerB2B(data: B2BRegistrationData) {
  try {
    const auth = getAuthInstance();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    await updateProfile(userCredential.user, {
      displayName: data.ragioneSociale,
    });

    const profile: UserProfile = {
      email: data.email,
      role: 'b2b',
      status: 'pending', // B2B requires approval
      ragioneSociale: data.ragioneSociale,
      partitaIva: data.partitaIva,
      codiceSDI: data.codiceSDI,
      indirizzoFatturazione: data.indirizzoFatturazione,
      referente: data.referente,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await createUserProfile(userCredential.user.uid, profile);

    return { user: userCredential.user, profile };
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante la registrazione');
  }
}

// Logout
export async function logout() {
  try {
    const auth = getAuthInstance();
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante il logout');
  }
}

// Reset Password
export async function resetPassword(email: string) {
  try {
    const auth = getAuthInstance();
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante il reset password');
  }
}

// Get current Firebase user
export function getCurrentUser(): FirebaseUser | null {
  const auth = getAuthInstance();
  return auth.currentUser;
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const user = getCurrentUser();
  if (!user) return false;

  const profile = await getUserProfile(user.uid);
  return profile?.role === 'admin';
}
