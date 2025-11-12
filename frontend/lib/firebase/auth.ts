// lib/firebase/auth.ts
// Firebase Authentication Utilities

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { getAuthInstance } from './config';
import { createUserProfile, getUserProfile, updateUserProfile } from './firestore';
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
    let userProfile = await getUserProfile(userCredential.user.uid);

    if (!userProfile) {
      await signOut(auth);
      throw new Error('Profilo utente non trovato.');
    }

    // Email verification is now handled by our custom system via Firestore status
    // No need to check Firebase emailVerified

    // Check if user is active
    if (userProfile.status !== 'active') {
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
    console.log('🔥 [registerAdmin] Starting registration for:', data.email);

    const auth = getAuthInstance();
    console.log('✅ [registerAdmin] Auth instance obtained');

    console.log('🔐 [registerAdmin] Creating user with email/password...');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    console.log('✅ [registerAdmin] User created:', userCredential.user.uid);

    // Update display name
    console.log('👤 [registerAdmin] Updating display name...');
    await updateProfile(userCredential.user, {
      displayName: `${data.nome} ${data.cognome}`,
    });
    console.log('✅ [registerAdmin] Display name updated');

    // Create Firestore profile
    console.log('📝 [registerAdmin] Creating Firestore profile...');
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
    console.log('✅ [registerAdmin] Firestore profile created');

    return { user: userCredential.user, profile };
  } catch (error: any) {
    console.error('❌ [registerAdmin] Error:', error);
    console.error('❌ [registerAdmin] Error code:', error.code);
    console.error('❌ [registerAdmin] Error message:', error.message);
    throw new Error(error.message || 'Errore durante la registrazione');
  }
}

// Register B2C
export async function registerB2C(data: B2CRegistrationData, language?: string) {
  const auth = getAuthInstance();
  let userCredential;

  try {
    // Set Firebase auth language if provided
    if (language) {
      auth.languageCode = language;
    }

    userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    await updateProfile(userCredential.user, {
      displayName: `${data.nome} ${data.cognome}`,
    });

    // Email verification will be sent by API route after profile creation

    const profile: UserProfile = {
      email: data.email,
      role: 'b2c',
      status: 'pending', // Pending until email is verified
      accountType: 'private',
      profileComplete: true,
      nome: data.nome,
      cognome: data.cognome,
      ...(data.codiceFiscale && { codiceFiscale: data.codiceFiscale }),
      ...(data.partitaIva && { partitaIva: data.partitaIva }),
      indirizzoSpedizione: data.indirizzoSpedizione,
      telefono: data.telefono,
      preferredLanguage: data.preferredLanguage || language || 'it',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await createUserProfile(userCredential.user.uid, profile);

    return { user: userCredential.user, profile };
  } catch (error: any) {
    // Rollback: delete Firebase Auth user if profile creation failed
    if (userCredential?.user) {
      try {
        await userCredential.user.delete();
        console.log('🔄 [registerB2C] Rolled back user creation due to error');
      } catch (deleteError) {
        console.error('❌ [registerB2C] Failed to rollback user:', deleteError);
      }
    }
    throw new Error(error.message || 'Errore durante la registrazione');
  }
}

// Register B2B
export async function registerB2B(data: B2BRegistrationData, language?: string) {
  const auth = getAuthInstance();
  let userCredential;

  try {
    // Set Firebase auth language if provided
    if (language) {
      auth.languageCode = language;
    }

    userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    await updateProfile(userCredential.user, {
      displayName: data.ragioneSociale,
    });

    // Email verification will be sent by API route after profile creation

    const profile: UserProfile = {
      email: data.email,
      role: 'b2c', // Start as b2c, admin can upgrade to b2b later
      status: 'pending', // Pending until email is verified
      accountType: 'company',
      profileComplete: true,
      ragioneSociale: data.ragioneSociale,
      partitaIva: data.partitaIva,
      codiceSDI: data.codiceSDI,
      indirizzoFatturazione: data.indirizzoFatturazione,
      referente: data.referente,
      preferredLanguage: data.preferredLanguage || language || 'it',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await createUserProfile(userCredential.user.uid, profile);

    return { user: userCredential.user, profile };
  } catch (error: any) {
    // Rollback: delete Firebase Auth user if profile creation failed
    if (userCredential?.user) {
      try {
        await userCredential.user.delete();
        console.log('🔄 [registerB2B] Rolled back user creation due to error');
      } catch (deleteError) {
        console.error('❌ [registerB2B] Failed to rollback user:', deleteError);
      }
    }
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

// Login with Google
export async function loginWithGoogle(requiredRole?: 'admin' | 'b2c' | 'b2b') {
  try {
    console.log('🔥 [loginWithGoogle] Starting Google login...');

    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();

    // Force account selection
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    console.log('🔐 [loginWithGoogle] Opening Google popup...');
    const result = await signInWithPopup(auth, provider);
    console.log('✅ [loginWithGoogle] User signed in:', result.user.uid);

    // Check if user profile exists
    let userProfile = await getUserProfile(result.user.uid);

    if (!userProfile) {
      console.log('⚠️ [loginWithGoogle] No profile found, creating minimal profile...');

      // For first-time Google login, create a minimal profile
      // User will need to complete their profile later
      const [firstName, ...lastNameParts] = (result.user.displayName || '').split(' ');
      const lastName = lastNameParts.join(' ');

      const newProfile: UserProfile = {
        email: result.user.email!,
        role: 'b2c', // Everyone starts as b2c
        status: 'active', // Google email is already verified
        profileComplete: false, // Mark as incomplete
        nome: firstName,
        cognome: lastName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await createUserProfile(result.user.uid, newProfile);
      userProfile = newProfile;
      console.log('✅ [loginWithGoogle] Minimal profile created, needs completion');
    }

    // Auto-activate if email is verified and status is pending
    if (userProfile.status === 'pending' && result.user.emailVerified) {
      console.log('✅ [loginWithGoogle] Email verified, activating user...');
      await updateUserProfile(result.user.uid, { status: 'active' });
      userProfile = { ...userProfile, status: 'active' };
    }

    // Check if user role matches required role (only for admin login)
    if (requiredRole === 'admin' && userProfile.role !== 'admin') {
      await signOut(auth);
      throw new Error(`Accesso negato. Questo account non ha i permessi di amministratore.`);
    }

    // Check if user is active
    if (userProfile.status !== 'active') {
      await signOut(auth);
      throw new Error('Account non attivo. Contatta l\'amministratore.');
    }

    console.log('✅ [loginWithGoogle] Login successful');
    return { user: result.user, profile: userProfile };
  } catch (error: any) {
    console.error('❌ [loginWithGoogle] Error:', error);

    // Handle popup closed
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Accesso annullato');
    }

    throw new Error(error.message || 'Errore durante l\'accesso con Google');
  }
}
