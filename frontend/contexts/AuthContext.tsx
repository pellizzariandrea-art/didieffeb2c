'use client';

// contexts/AuthContext.tsx
// Global Authentication Context

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase/config';
import { getUserProfile, updateLastLogin } from '@/lib/firebase/firestore';
import type { UserProfile, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: true,
    error: null,
  });

  // Monitor auth state changes
  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      setState({
        user: null,
        firebaseUser: null,
        loading: false,
        error: null,
      });
      return;
    }

    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is logged in
          const profile = await getUserProfile(firebaseUser.uid);

          if (profile) {
            // Update last login
            await updateLastLogin(firebaseUser.uid);

            setState({
              user: profile,
              firebaseUser,
              loading: false,
              error: null,
            });
          } else {
            // Profile not found - logout
            setState({
              user: null,
              firebaseUser: null,
              loading: false,
              error: 'Profilo utente non trovato',
            });
          }
        } else {
          // User is logged out
          setState({
            user: null,
            firebaseUser: null,
            loading: false,
            error: null,
          });
        }
      } catch (error: any) {
        console.error('Auth state change error:', error);
        setState({
          user: null,
          firebaseUser: null,
          loading: false,
          error: error.message,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { login: loginFn } = await import('@/lib/firebase/auth');
      const { user: firebaseUser, profile } = await loginFn(email, password);

      setState({
        user: profile,
        firebaseUser,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const { logout: logoutFn } = await import('@/lib/firebase/auth');
      await logoutFn();

      setState({
        user: null,
        firebaseUser: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (!state.firebaseUser) return;

    try {
      const profile = await getUserProfile(state.firebaseUser.uid);
      setState((prev) => ({ ...prev, user: profile }));
    } catch (error: any) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to require authentication
export function useRequireAuth(redirectTo = '/') {
  const { user, loading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShouldRedirect(true);
    }
  }, [user, loading]);

  return { user, loading, shouldRedirect, redirectTo };
}

// Hook to require admin
export function useRequireAdmin(redirectTo = '/') {
  const { user, loading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      setShouldRedirect(true);
    }
  }, [user, loading]);

  return { user, loading, shouldRedirect, redirectTo };
}
