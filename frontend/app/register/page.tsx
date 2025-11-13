'use client';

// app/register/page.tsx
// Customer Registration Page (B2C & B2B)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { registerB2C, registerB2B } from '@/lib/firebase/auth';
import uiLabels from '@/config/ui-labels.json';
import type { B2CRegistrationData, B2BRegistrationData } from '@/types/auth';
import { SUPPORTED_LANGUAGES } from '@/types/settings';
import { toast } from 'sonner';
import { useFormValidation } from '@/hooks/useFormValidation';
import ValidatedInput from '@/components/ValidatedInput';

type CustomerType = 'private' | 'business';

// Common countries list
const COMMON_COUNTRIES = [
  'Italia',
  'Germany',
  'France',
  'Spain',
  'Portugal',
  'Croatia',
  'Slovenia',
  'Greece',
  'Austria',
  'Switzerland',
  'Netherlands',
  'Belgium',
  'United Kingdom',
  'Poland',
  'Czech Republic',
  'Hungary',
  'Romania',
  'Bulgaria',
  'United States',
  'Canada',
  'Other'
];

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLang: language, setLanguage } = useLanguage();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <UnifiedRegistrationForm language={language} setLanguage={setLanguage} />;
}

// Unified Registration Form Component
function UnifiedRegistrationForm({ language, setLanguage }: any) {
  const router = useRouter();
  const { errors, validateField, setFieldError, clearFieldError } = useFormValidation();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [customerType, setCustomerType] = useState<CustomerType>('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labels = uiLabels.auth;
  const regLabels = labels.register_form;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    // Fields for both
    telefono: '',
    via: '',
    citta: '',
    cap: '',
    provincia: '',
    paese: 'Italia',
    preferredLanguage: language,
    // Private person fields
    nome: '',
    cognome: '',
    codiceFiscale: '',
    // Business fields
    ragioneSociale: '',
    partitaIva: '',
    codiceSDI: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Validate field if it's been touched
    if (touched[name]) {
      const result = validateField(name, value, newFormData.paese);
      if (!result.valid) {
        setFieldError(name, result.error);
      } else {
        clearFieldError(name);
      }
    }
  };

  const handleBlur = (name: string) => {
    setTouched({ ...touched, [name]: true });
    const value = formData[name as keyof typeof formData] as string;
    const result = validateField(name, value, formData.paese);
    if (!result.valid) {
      setFieldError(name, result.error);
    }
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
      if (customerType === 'private') {
        // B2C Registration
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
          preferredLanguage: formData.preferredLanguage,
        };

        const { user } = await registerB2C(registrationData, language);

        // Send verification email
        try {
          await fetch('/api/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              email: formData.email,
              name: `${formData.nome} ${formData.cognome}`,
              language: formData.preferredLanguage
            })
          });
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
        }
      } else {
        // B2B Registration
        const registrationData: B2BRegistrationData = {
          email: formData.email,
          password: formData.password,
          ragioneSociale: formData.ragioneSociale,
          partitaIva: formData.partitaIva,
          codiceSDI: formData.paese === 'Italia' ? formData.codiceSDI : '',
          indirizzoFatturazione: {
            via: formData.via,
            citta: formData.citta,
            cap: formData.cap,
            provincia: formData.provincia,
            paese: formData.paese,
          },
          referente: {
            nome: formData.nome || formData.ragioneSociale,
            email: formData.email,
            telefono: formData.telefono,
          },
          preferredLanguage: formData.preferredLanguage,
        };

        const { user } = await registerB2B(registrationData, language);

        // Send verification email
        try {
          await fetch('/api/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.uid,
              email: formData.email,
              name: formData.ragioneSociale,
              language: formData.preferredLanguage
            })
          });
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
        }
      }

      const verificationMessage = language === 'it'
        ? 'Registrazione completata! Controlla la tua email per verificare l\'account.'
        : language === 'en'
        ? 'Registration completed! Check your email to verify your account.'
        : language === 'de'
        ? 'Registrierung abgeschlossen! Überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen.'
        : language === 'fr'
        ? 'Inscription terminée ! Vérifiez votre e-mail pour confirmer votre compte.'
        : language === 'es'
        ? '¡Registro completado! Revisa tu correo para verificar tu cuenta.'
        : language === 'pt'
        ? 'Registro concluído! Verifique seu e-mail para confirmar sua conta.'
        : language === 'hr'
        ? 'Registracija dovršena! Provjerite svoju e-poštu da potvrdite račun.'
        : language === 'sl'
        ? 'Registracija končana! Preverite svojo e-pošto za potrditev računa.'
        : 'Εγγραφή ολοκληρώθηκε! Ελέγξτε το email σας για επαλήθευση του λογαριασμού σας.';

      toast.success(verificationMessage);
      setTimeout(() => router.push('/'), 3000);
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
        {/* Header with Language Selector */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              {regLabels.title[language]}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {labels.have_account[language]}{' '}
              <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                {labels.login[language]}
              </Link>
            </p>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Customer Type Toggle */}
          <div className="bg-white shadow px-6 py-6 rounded-lg">
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={() => setCustomerType('private')}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                  customerType === 'private'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{regLabels.private_customer[language]}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('business')}
                className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                  customerType === 'business'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{regLabels.business_customer[language]}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Account Credentials */}
          <div className="bg-white shadow px-6 py-6 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {language === 'it' ? 'Credenziali di accesso' : language === 'en' ? 'Login credentials' : language === 'de' ? 'Anmeldedaten' : language === 'fr' ? 'Identifiants de connexion' : language === 'es' ? 'Credenciales de acceso' : 'Credenciais de login'}
            </h3>

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

            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'it' ? 'Lingua preferita per le email' : language === 'en' ? 'Preferred language for emails' : language === 'de' ? 'Bevorzugte Sprache für E-Mails' : language === 'fr' ? 'Langue préférée pour les e-mails' : language === 'es' ? 'Idioma preferido para correos' : 'Idioma preferido para e-mails'}
              </label>
              <select
                name="preferredLanguage"
                id="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Personal/Business Info */}
          <div className="bg-white shadow px-6 py-6 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {customerType === 'private' ? labels.personal_info[language] : labels.company_info[language]}
            </h3>

            {customerType === 'private' ? (
              <>
                {/* Private Person Fields */}
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
                  <ValidatedInput
                    name="codiceFiscale"
                    type="text"
                    value={formData.codiceFiscale}
                    onChange={handleChange}
                    onBlur={() => handleBlur('codiceFiscale')}
                    error={errors.codiceFiscale}
                    touched={touched.codiceFiscale}
                    placeholder={labels.fiscal_code[language] + ' (' + (language === 'it' ? 'opzionale' : 'optional') + ')'}
                  />
                  <ValidatedInput
                    name="partitaIva"
                    type="text"
                    value={formData.partitaIva}
                    onChange={handleChange}
                    onBlur={() => handleBlur('partitaIva')}
                    error={errors.partitaIva}
                    touched={touched.partitaIva}
                    placeholder={labels.vat_number[language] + ' (' + (language === 'it' ? 'opzionale' : 'optional') + ')'}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Business Fields */}
                <input
                  name="ragioneSociale"
                  type="text"
                  required
                  value={formData.ragioneSociale}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={labels.company_name[language]}
                />

                <ValidatedInput
                  name="partitaIva"
                  type="text"
                  required
                  value={formData.partitaIva}
                  onChange={handleChange}
                  onBlur={() => handleBlur('partitaIva')}
                  error={errors.partitaIva}
                  touched={touched.partitaIva}
                  placeholder={labels.vat_number[language]}
                />

                {formData.paese === 'Italia' && (
                  <input
                    name="codiceSDI"
                    type="text"
                    required
                    value={formData.codiceSDI}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={labels.sdi_code[language]}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    name="nome"
                    type="text"
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      labels.first_name[language] +
                      ' (' +
                      (language === 'it' ? 'referente, opzionale' :
                       language === 'en' ? 'contact, optional' :
                       language === 'de' ? 'Ansprechpartner, optional' :
                       language === 'fr' ? 'contact, optionnel' :
                       language === 'es' ? 'contacto, opcional' :
                       language === 'pt' ? 'contato, opcional' :
                       language === 'hr' ? 'kontakt, neobavezno' :
                       language === 'sl' ? 'kontakt, neobvezno' :
                       'επικοινωνία, προαιρετικό') +
                      ')'
                    }
                  />
                  <input
                    name="cognome"
                    type="text"
                    value={formData.cognome}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      labels.last_name[language] +
                      ' (' +
                      (language === 'it' ? 'referente, opzionale' :
                       language === 'en' ? 'contact, optional' :
                       language === 'de' ? 'Ansprechpartner, optional' :
                       language === 'fr' ? 'contact, optionnel' :
                       language === 'es' ? 'contacto, opcional' :
                       language === 'pt' ? 'contato, opcional' :
                       language === 'hr' ? 'kontakt, neobavezno' :
                       language === 'sl' ? 'kontakt, neobvezno' :
                       'επικοινωνία, προαιρετικό') +
                      ')'
                    }
                  />
                </div>
              </>
            )}

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

          {/* Address */}
          <div className="bg-white shadow px-6 py-6 rounded-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              {customerType === 'private' ? labels.shipping_address[language] : labels.billing_address[language]}
            </h3>

            <ValidatedInput
              name="via"
              type="text"
              required
              value={formData.via}
              onChange={handleChange}
              onBlur={() => handleBlur('via')}
              error={errors.via}
              touched={touched.via}
              placeholder={labels.street[language]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                name="citta"
                type="text"
                required
                value={formData.citta}
                onChange={handleChange}
                onBlur={() => handleBlur('citta')}
                error={errors.citta}
                touched={touched.citta}
                placeholder={labels.city[language]}
              />
              <ValidatedInput
                name="cap"
                type="text"
                required
                value={formData.cap}
                onChange={handleChange}
                onBlur={() => handleBlur('cap')}
                error={errors.cap}
                touched={touched.cap}
                placeholder={labels.zip[language]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                name="provincia"
                type="text"
                required
                value={formData.provincia}
                onChange={handleChange}
                onBlur={() => handleBlur('provincia')}
                error={errors.provincia}
                touched={touched.provincia}
                placeholder={labels.province[language]}
              />
              <select
                name="paese"
                required
                value={formData.paese}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {COMMON_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
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

          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-500">
              ← {language === 'it' ? 'Torna al sito' : language === 'en' ? 'Back to site' : language === 'de' ? 'Zurück zur Seite' : language === 'fr' ? 'Retour au site' : language === 'es' ? 'Volver al sitio' : language === 'pt' ? 'Voltar ao site' : language === 'hr' ? 'Natrag na stranicu' : language === 'sl' ? 'Nazaj na stran' : 'Επιστροφή στον ιστότοπο'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// B2C Registration Form Component (DEPRECATED - keeping for reference)
function B2CRegistrationForm({ language, labels, loading, error, setLoading, setError, onBack }: any) {
  const router = useRouter();
  const { errors, validateField, setFieldError, clearFieldError, validateForm } = useFormValidation();
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
    preferredLanguage: language,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Validate field if it's been touched
    if (touched[name]) {
      const result = validateField(name, value, newFormData.paese);
      if (!result.valid) {
        setFieldError(name, result.error);
      } else {
        clearFieldError(name);
      }
    }
  };

  const handleBlur = (name: string) => {
    setTouched({ ...touched, [name]: true });
    const value = formData[name as keyof typeof formData] as string;
    const result = validateField(name, value, formData.paese);
    if (!result.valid) {
      setFieldError(name, result.error);
    }
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
        preferredLanguage: formData.preferredLanguage,
      };

      const { user } = await registerB2C(registrationData, language);

      // Send verification email via Brevo
      try {
        await fetch('/api/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            email: formData.email,
            name: `${formData.nome} ${formData.cognome}`,
            language: formData.preferredLanguage
          })
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't block registration if email fails
      }

      const verificationMessage = language === 'it'
        ? 'Registrazione completata! Controlla la tua email per verificare l\'account.'
        : language === 'en'
        ? 'Registration completed! Check your email to verify your account.'
        : language === 'de'
        ? 'Registrierung abgeschlossen! Überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen.'
        : language === 'fr'
        ? 'Inscription terminée ! Vérifiez votre e-mail pour confirmer votre compte.'
        : language === 'es'
        ? '¡Registro completado! Revisa tu correo para verificar tu cuenta.'
        : language === 'pt'
        ? 'Registro concluído! Verifique seu e-mail para confirmar sua conta.'
        : language === 'hr'
        ? 'Registracija dovršena! Provjerite svoju e-poštu da potvrdite račun.'
        : language === 'sl'
        ? 'Registracija končana! Preverite svojo e-pošto za potrditev računa.'
        : 'Εγγραφή ολοκληρώθηκε! Ελέγξτε το email σας για επαλήθευση του λογαριασμού σας.';

      toast.success(verificationMessage);
      setTimeout(() => router.push('/'), 3000);
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

            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'it' ? 'Lingua preferita per le email' : language === 'en' ? 'Preferred language for emails' : language === 'de' ? 'Bevorzugte Sprache für E-Mails' : language === 'fr' ? 'Langue préférée pour les e-mails' : language === 'es' ? 'Idioma preferido para correos' : 'Idioma preferido para e-mails'}
              </label>
              <select
                name="preferredLanguage"
                id="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
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
              <ValidatedInput
                name="codiceFiscale"
                type="text"
                value={formData.codiceFiscale}
                onChange={handleChange}
                onBlur={() => handleBlur('codiceFiscale')}
                error={errors.codiceFiscale}
                touched={touched.codiceFiscale}
                placeholder={labels.fiscal_code[language] + ' (' + (language === 'it' ? 'opzionale' : 'optional') + ')'}
              />

              <ValidatedInput
                name="partitaIva"
                type="text"
                value={formData.partitaIva}
                onChange={handleChange}
                onBlur={() => handleBlur('partitaIva')}
                error={errors.partitaIva}
                touched={touched.partitaIva}
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

            <ValidatedInput
              name="via"
              type="text"
              required
              value={formData.via}
              onChange={handleChange}
              onBlur={() => handleBlur('via')}
              error={errors.via}
              touched={touched.via}
              placeholder={labels.street[language]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                name="citta"
                type="text"
                required
                value={formData.citta}
                onChange={handleChange}
                onBlur={() => handleBlur('citta')}
                error={errors.citta}
                touched={touched.citta}
                placeholder={labels.city[language]}
              />

              <ValidatedInput
                name="cap"
                type="text"
                required
                value={formData.cap}
                onChange={handleChange}
                onBlur={() => handleBlur('cap')}
                error={errors.cap}
                touched={touched.cap}
                placeholder={labels.zip[language]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                name="provincia"
                type="text"
                required
                value={formData.provincia}
                onChange={handleChange}
                onBlur={() => handleBlur('provincia')}
                error={errors.provincia}
                touched={touched.provincia}
                placeholder={labels.province[language]}
              />

              <select
                name="paese"
                required
                value={formData.paese}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {COMMON_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
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
        </form>
      </div>
    </div>
  );
}

// B2B Registration Form Component
function B2BRegistrationForm({ language, labels, loading, error, setLoading, setError, onBack }: any) {
  const router = useRouter();
  const { errors, validateField, setFieldError, clearFieldError, validateForm } = useFormValidation();
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
    preferredLanguage: language,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Validate field if it's been touched
    if (touched[name]) {
      const result = validateField(name, value, newFormData.paese);
      if (!result.valid) {
        setFieldError(name, result.error);
      } else {
        clearFieldError(name);
      }
    }
  };

  const handleBlur = (name: string) => {
    setTouched({ ...touched, [name]: true });
    const value = formData[name as keyof typeof formData] as string;
    const result = validateField(name, value, formData.paese);
    if (!result.valid) {
      setFieldError(name, result.error);
    }
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
        preferredLanguage: formData.preferredLanguage,
      };

      const { user } = await registerB2B(registrationData, language);

      // Send verification email via Brevo
      try {
        await fetch('/api/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            email: formData.email,
            name: formData.ragioneSociale,
            language: formData.preferredLanguage
          })
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't block registration if email fails
      }

      const verificationMessage = language === 'it'
        ? 'Registrazione completata! Controlla la tua email per verificare l\'account.'
        : language === 'en'
        ? 'Registration completed! Check your email to verify your account.'
        : language === 'de'
        ? 'Registrierung abgeschlossen! Überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen.'
        : language === 'fr'
        ? 'Inscription terminée ! Vérifiez votre e-mail pour confirmer votre compte.'
        : language === 'es'
        ? '¡Registro completado! Revisa tu correo para verificar tu cuenta.'
        : language === 'pt'
        ? 'Registro concluído! Verifique seu e-mail para confirmar sua conta.'
        : language === 'hr'
        ? 'Registracija dovršena! Provjerite svoju e-poštu da potvrdite račun.'
        : language === 'sl'
        ? 'Registracija končana! Preverite svojo e-pošto za potrditev računa.'
        : 'Εγγραφή ολοκληρώθηκε! Ελέγξτε το email σας για επαλήθευση του λογαριασμού σας.';

      toast.success(verificationMessage);
      setTimeout(() => router.push('/'), 3000);
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

            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'it' ? 'Lingua preferita per le email' : language === 'en' ? 'Preferred language for emails' : language === 'de' ? 'Bevorzugte Sprache für E-Mails' : language === 'fr' ? 'Langue préférée pour les e-mails' : language === 'es' ? 'Idioma preferido para correos' : 'Idioma preferido para e-mails'}
              </label>
              <select
                name="preferredLanguage"
                id="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
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
              <ValidatedInput
                name="partitaIva"
                type="text"
                required
                value={formData.partitaIva}
                onChange={handleChange}
                onBlur={() => handleBlur('partitaIva')}
                error={errors.partitaIva}
                touched={touched.partitaIva}
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

            <ValidatedInput
              name="via"
              type="text"
              required
              value={formData.via}
              onChange={handleChange}
              onBlur={() => handleBlur('via')}
              error={errors.via}
              touched={touched.via}
              placeholder={labels.street[language]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                name="citta"
                type="text"
                required
                value={formData.citta}
                onChange={handleChange}
                onBlur={() => handleBlur('citta')}
                error={errors.citta}
                touched={touched.citta}
                placeholder={labels.city[language]}
              />

              <ValidatedInput
                name="cap"
                type="text"
                required
                value={formData.cap}
                onChange={handleChange}
                onBlur={() => handleBlur('cap')}
                error={errors.cap}
                touched={touched.cap}
                placeholder={labels.zip[language]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedInput
                name="provincia"
                type="text"
                required
                value={formData.provincia}
                onChange={handleChange}
                onBlur={() => handleBlur('provincia')}
                error={errors.provincia}
                touched={touched.provincia}
                placeholder={labels.province[language]}
              />

              <select
                name="paese"
                required
                value={formData.paese}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {COMMON_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
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
        </form>
      </div>
    </div>
  );
}
