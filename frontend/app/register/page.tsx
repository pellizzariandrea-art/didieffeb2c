'use client';

// app/register/page.tsx
// Customer Registration Page (B2C & B2B)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { registerB2C, registerB2B, loginWithGoogle } from '@/lib/firebase/auth';
import uiLabels from '@/config/ui-labels.json';
import type { B2CRegistrationData, B2BRegistrationData } from '@/types/auth';
import { toast } from 'sonner';

type CustomerType = 'b2c' | 'b2b';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLang: language } = useLanguage();

  const [customerType, setCustomerType] = useState<CustomerType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labels = uiLabels.auth;

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleGoogleRegister = async (role: 'b2c' | 'b2b') => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle(role);
      toast.success(labels.registration_success[language]);
      router.push('/');
    } catch (err: any) {
      console.error('Google registration error:', err);
      if (err.message.includes('non attivo')) {
        toast.info(labels.account_pending[language]);
        router.push('/');
      } else {
        setError(err.message || 'Errore durante la registrazione con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!customerType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {labels.register[language]}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {labels.have_account[language]}{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {labels.login[language]}
              </Link>
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-center text-sm font-medium text-gray-700">
              {labels.customer_type[language]}
            </p>

            <button
              onClick={() => setCustomerType('b2c')}
              className="w-full flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <svg className="w-12 h-12 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-lg font-semibold text-gray-900">
                {labels.b2c_customer[language]}
              </span>
            </button>

            <button
              onClick={() => setCustomerType('b2b')}
              className="w-full flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <svg className="w-12 h-12 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-lg font-semibold text-gray-900">
                {labels.b2b_customer[language]}
              </span>
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← {language === 'it' ? 'Torna al sito' : language === 'en' ? 'Back to site' : language === 'de' ? 'Zurück zur Seite' : language === 'fr' ? 'Retour au site' : language === 'es' ? 'Volver al sitio' : 'Voltar ao site'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (customerType === 'b2c') {
    return <B2CRegistrationForm
      language={language}
      labels={labels}
      loading={loading}
      error={error}
      setLoading={setLoading}
      setError={setError}
      onBack={() => setCustomerType(null)}
      onGoogleRegister={() => handleGoogleRegister('b2c')}
    />;
  }

  return <B2BRegistrationForm
    language={language}
    labels={labels}
    loading={loading}
    error={error}
    setLoading={setLoading}
    setError={setError}
    onBack={() => setCustomerType(null)}
    onGoogleRegister={() => handleGoogleRegister('b2b')}
  />;
}

// B2C Registration Form Component
function B2CRegistrationForm({ language, labels, loading, error, setLoading, setError, onBack, onGoogleRegister }: any) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nome: '',
    cognome: '',
    codiceFiscale: '',
    partitaIva: '',
    telefono: '',
    via: '',
    citta: '',
    cap: '',
    provincia: '',
    paese: 'Italia',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(labels.error.passwords_dont_match[language]);
      return;
    }

    if (formData.password.length < 6) {
      setError(labels.error.weak_password[language]);
      return;
    }

    setLoading(true);

    try {
      const registrationData: B2CRegistrationData = {
        email: formData.email,
        password: formData.password,
        nome: formData.nome,
        cognome: formData.cognome,
        codiceFiscale: formData.codiceFiscale || undefined,
        partitaIva: formData.partitaIva || undefined,
        indirizzoSpedizione: {
          via: formData.via,
          citta: formData.citta,
          cap: formData.cap,
          provincia: formData.provincia,
          paese: formData.paese,
        },
        telefono: formData.telefono,
      };

      await registerB2C(registrationData, language);

      // Send welcome email via Brevo
      try {
        await fetch('/api/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: `${formData.nome} ${formData.cognome}`,
            type: 'b2c',
            language: language
          })
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't block registration if email fails
      }

      toast.success(labels.registration_success[language]);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      console.error('Registration error:', err);

      if (err.message.includes('email-already-in-use')) {
        setError(labels.error.email_already_exists[language]);
      } else if (err.message.includes('weak-password')) {
        setError(labels.error.weak_password[language]);
      } else if (err.message.includes('invalid-email')) {
        setError(labels.error.invalid_email[language]);
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <button
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-500 flex items-center"
          >
            ← {language === 'it' ? 'Indietro' : language === 'en' ? 'Back' : language === 'de' ? 'Zurück' : language === 'fr' ? 'Retour' : language === 'es' ? 'Atrás' : 'Voltar'}
          </button>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {labels.b2c_customer[language]}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {labels.personal_info[language]}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Account Info */}
          <div className="bg-white shadow px-6 py-6 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{language === 'it' ? 'Credenziali di accesso' : language === 'en' ? 'Login credentials' : language === 'de' ? 'Anmeldedaten' : language === 'fr' ? 'Identifiants de connexion' : language === 'es' ? 'Credenciales de acceso' : 'Credenciais de login'}</h3>

            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={labels.email[language]}
            />

            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={labels.password[language]}
            />

            <input
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={labels.confirm_password[language]}
            />
          </div>

          {/* Personal Info */}
          <div className="bg-white shadow px-6 py-6 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{labels.personal_info[language]}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="nome"
                type="text"
                required
                value={formData.nome}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.first_name[language]}
              />

              <input
                name="cognome"
                type="text"
                required
                value={formData.cognome}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.last_name[language]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="codiceFiscale"
                type="text"
                value={formData.codiceFiscale}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.fiscal_code[language] + ' (' + (language === 'it' ? 'opzionale' : 'optional') + ')'}
              />

              <input
                name="partitaIva"
                type="text"
                value={formData.partitaIva}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.vat_number[language] + ' (' + (language === 'it' ? 'opzionale' : 'optional') + ')'}
              />
            </div>

            <input
              name="telefono"
              type="tel"
              required
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={labels.phone[language]}
            />
          </div>

          {/* Shipping Address */}
          <div className="bg-white shadow px-6 py-6 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{labels.shipping_address[language]}</h3>

            <input
              name="via"
              type="text"
              required
              value={formData.via}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={labels.street[language]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="citta"
                type="text"
                required
                value={formData.citta}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.city[language]}
              />

              <input
                name="cap"
                type="text"
                required
                value={formData.cap}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.zip[language]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="provincia"
                type="text"
                required
                value={formData.provincia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.province[language]}
              />

              <input
                name="paese"
                type="text"
                required
                value={formData.paese}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.country[language]}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? labels.register[language] + '...' : labels.register[language]}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                {language === 'it' ? 'Oppure registrati rapidamente con' : language === 'en' ? 'Or register quickly with' : language === 'de' ? 'Oder schnell registrieren mit' : language === 'fr' ? 'Ou inscrivez-vous rapidement avec' : language === 'es' ? 'O regístrate rápidamente con' : 'Ou registre-se rapidamente com'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoogleRegister}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 hover:border-blue-500 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {language === 'it' ? 'Registrati con Google' : language === 'en' ? 'Register with Google' : language === 'de' ? 'Mit Google registrieren' : language === 'fr' ? 'S\'inscrire avec Google' : language === 'es' ? 'Registrarse con Google' : 'Registrar com Google'}
          </button>
        </form>
      </div>
    </div>
  );
}

// B2B Registration Form Component
function B2BRegistrationForm({ language, labels, loading, error, setLoading, setError, onBack, onGoogleRegister }: any) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    ragioneSociale: '',
    partitaIva: '',
    codiceSDI: '',
    via: '',
    citta: '',
    cap: '',
    provincia: '',
    paese: 'Italia',
    referenteNome: '',
    referenteEmail: '',
    referenteTelefono: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(labels.error.passwords_dont_match[language]);
      return;
    }

    if (formData.password.length < 6) {
      setError(labels.error.weak_password[language]);
      return;
    }

    setLoading(true);

    try {
      const registrationData: B2BRegistrationData = {
        email: formData.email,
        password: formData.password,
        ragioneSociale: formData.ragioneSociale,
        partitaIva: formData.partitaIva,
        codiceSDI: formData.codiceSDI,
        indirizzoFatturazione: {
          via: formData.via,
          citta: formData.citta,
          cap: formData.cap,
          provincia: formData.provincia,
          paese: formData.paese,
        },
        referente: {
          nome: formData.referenteNome,
          email: formData.referenteEmail,
          telefono: formData.referenteTelefono,
        },
      };

      await registerB2B(registrationData, language);

      // Send B2B registration confirmation email via Brevo
      try {
        await fetch('/api/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.ragioneSociale,
            type: 'b2b',
            language: language
          })
        });
      } catch (emailError) {
        console.error('Failed to send B2B confirmation email:', emailError);
        // Don't block registration if email fails
      }

      toast.success(labels.registration_success[language]);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      console.error('Registration error:', err);

      if (err.message.includes('email-already-in-use')) {
        setError(labels.error.email_already_exists[language]);
      } else if (err.message.includes('weak-password')) {
        setError(labels.error.weak_password[language]);
      } else if (err.message.includes('invalid-email')) {
        setError(labels.error.invalid_email[language]);
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <button
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-500 flex items-center"
          >
            ← {language === 'it' ? 'Indietro' : language === 'en' ? 'Back' : language === 'de' ? 'Zurück' : language === 'fr' ? 'Retour' : language === 'es' ? 'Atrás' : 'Voltar'}
          </button>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {labels.b2b_customer[language]}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {labels.company_info[language]}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Account Info */}
          <div className="bg-white shadow px-6 py-6 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{language === 'it' ? 'Credenziali di accesso' : language === 'en' ? 'Login credentials' : language === 'de' ? 'Anmeldedaten' : language === 'fr' ? 'Identifiants de connexion' : language === 'es' ? 'Credenciales de acceso' : 'Credenciais de login'}</h3>

            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={labels.email[language]}
            />

            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={labels.password[language]}
            />

            <input
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={labels.confirm_password[language]}
            />
          </div>

          {/* Company Info */}
          <div className="bg-white shadow px-6 py-6 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{labels.company_info[language]}</h3>

            <input
              name="ragioneSociale"
              type="text"
              required
              value={formData.ragioneSociale}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={labels.company_name[language]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="partitaIva"
                type="text"
                required
                value={formData.partitaIva}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.vat_number[language]}
              />

              <input
                name="codiceSDI"
                type="text"
                required
                value={formData.codiceSDI}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.sdi_code[language]}
              />
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white shadow px-6 py-6 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{labels.billing_address[language]}</h3>

            <input
              name="via"
              type="text"
              required
              value={formData.via}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={labels.street[language]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="citta"
                type="text"
                required
                value={formData.citta}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.city[language]}
              />

              <input
                name="cap"
                type="text"
                required
                value={formData.cap}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.zip[language]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="provincia"
                type="text"
                required
                value={formData.provincia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.province[language]}
              />

              <input
                name="paese"
                type="text"
                required
                value={formData.paese}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.country[language]}
              />
            </div>
          </div>

          {/* Reference Person */}
          <div className="bg-white shadow px-6 py-6 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{labels.reference_person[language]}</h3>

            <input
              name="referenteNome"
              type="text"
              required
              value={formData.referenteNome}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={labels.first_name[language]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="referenteEmail"
                type="email"
                required
                value={formData.referenteEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.email[language]}
              />

              <input
                name="referenteTelefono"
                type="tel"
                required
                value={formData.referenteTelefono}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={labels.phone[language]}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? labels.register[language] + '...' : labels.register[language]}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                {language === 'it' ? 'Oppure registrati rapidamente con' : language === 'en' ? 'Or register quickly with' : language === 'de' ? 'Oder schnell registrieren mit' : language === 'fr' ? 'Ou inscrivez-vous rapidement avec' : language === 'es' ? 'O regístrate rápidamente con' : 'Ou registre-se rapidamente com'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoogleRegister}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 hover:border-blue-500 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {language === 'it' ? 'Registrati con Google' : language === 'en' ? 'Register with Google' : language === 'de' ? 'Mit Google registrieren' : language === 'fr' ? 'S\'inscrire avec Google' : language === 'es' ? 'Registrarse con Google' : 'Registrar com Google'}
          </button>
        </form>
      </div>
    </div>
  );
}
