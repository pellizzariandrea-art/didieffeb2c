'use client';

// app/admin/register/page.tsx
// Admin Registration Page (TEMPORARY - Use only for first admin setup)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerAdmin } from '@/lib/firebase/auth';
import type { AdminRegistrationData } from '@/types/auth';
import { toast } from 'sonner';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nome: '',
    cognome: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password || !formData.nome || !formData.cognome) {
      toast.error('Tutti i campi sono obbligatori');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La password deve essere di almeno 6 caratteri');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Le password non corrispondono');
      return;
    }

    setLoading(true);

    try {
      const registrationData: AdminRegistrationData = {
        email: formData.email,
        password: formData.password,
        nome: formData.nome,
        cognome: formData.cognome,
      };

      await registerAdmin(registrationData);

      toast.success('Amministratore registrato con successo!');

      // Redirect to admin login
      setTimeout(() => {
        router.push('/admin/login');
      }, 1500);
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.message.includes('email-already-in-use')) {
        toast.error('Questa email è già registrata');
      } else {
        toast.error(error.message || 'Errore durante la registrazione');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Warning Banner */}
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-300">
                <strong>ATTENZIONE:</strong> Questa pagina è temporanea e serve solo per creare il primo amministratore.
                Dopo aver creato l'account, considera di disabilitare o proteggere questa pagina.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-center">
            <img
              src="/logo_ddf.png"
              alt="Logo DDF"
              className="h-20 w-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Registrazione Amministratore
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Crea il primo account amministratore
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1">
                  Nome *
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Mario"
                />
              </div>
              <div>
                <label htmlFor="cognome" className="block text-sm font-medium text-gray-300 mb-1">
                  Cognome *
                </label>
                <input
                  id="cognome"
                  name="cognome"
                  type="text"
                  required
                  value={formData.cognome}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Rossi"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password * (minimo 6 caratteri)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Conferma Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrazione in corso...
                </span>
              ) : (
                'Crea Account Amministratore'
              )}
            </button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <Link
            href="/admin/login"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ← Torna al login amministratore
          </Link>
        </div>
      </div>
    </div>
  );
}
