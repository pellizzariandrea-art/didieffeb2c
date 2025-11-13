'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAuth, confirmPasswordReset, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase/config';
import { validatePassword, getPasswordStrengthInfo } from '@/lib/password-validation';
import Image from 'next/image';

function SetupPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [tokenData, setTokenData] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Didieffe B2B');

  // Load logo and company info
  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogo(data.settings.logo?.base64 || null);
          setCompanyName(data.settings.company?.name || 'Didieffe B2B');
        }
      })
      .catch(err => console.error('Error loading settings:', err));
  }, []);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('Token mancante');
      setValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch('/api/auth/validate-setup-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success) {
        setTokenData(result.data);
      } else {
        setError(result.error || 'Token non valido o scaduto');
      }
    } catch (err: any) {
      setError('Errore durante la validazione del token');
      console.error(err);
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setLoading(true);

    try {
      // Call API to set password
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(result.error || 'Errore durante l\'impostazione della password');
      }
    } catch (err: any) {
      setError('Errore durante l\'impostazione della password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validazione token...</p>
        </div>
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            {logo && (
              <div className="mb-6 flex justify-center">
                <Image src={logo} alt={companyName} width={120} height={60} className="object-contain" />
              </div>
            )}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Link non valido</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <p className="mt-4 text-sm text-gray-500">
              Il link potrebbe essere scaduto (validità 24 ore) o già utilizzato.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="mt-6 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Vai al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            {logo && (
              <div className="mb-6 flex justify-center">
                <Image src={logo} alt={companyName} width={120} height={60} className="object-contain" />
              </div>
            )}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Password impostata!</h2>
            <p className="mt-2 text-gray-600">
              La tua password è stata impostata con successo.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Verrai reindirizzato alla pagina di login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const passwordValidation = validatePassword(password);
  const strengthInfo = getPasswordStrengthInfo(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          {logo && (
            <div className="mb-6 flex justify-center">
              <Image src={logo} alt={companyName} width={150} height={75} className="object-contain" />
            </div>
          )}
          <h2 className="text-3xl font-bold text-gray-900">Imposta la tua password</h2>
          <p className="mt-2 text-gray-600">
            Benvenuto <strong>{tokenData?.email}</strong>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Scegli una password sicura per il tuo account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Nuova Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Minimo 8 caratteri"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Conferma Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ripeti la password"
              required
              minLength={8}
            />
          </div>

          {/* Password strength indicator */}
          {password && (
            <div className={`border rounded-md p-3 ${strengthInfo.bgColor}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Forza password:</span>
                <span className={`text-sm font-bold ${strengthInfo.color}`}>{strengthInfo.label}</span>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Requisiti password:</h4>
            <ul className="text-xs space-y-2">
              <li className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordValidation.checks.minLength ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {passwordValidation.checks.minLength && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={passwordValidation.checks.minLength ? 'text-green-700 font-medium' : 'text-gray-600'}>
                  Almeno 8 caratteri
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordValidation.checks.hasUpperCase ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {passwordValidation.checks.hasUpperCase && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={passwordValidation.checks.hasUpperCase ? 'text-green-700 font-medium' : 'text-gray-600'}>
                  Una lettera maiuscola
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordValidation.checks.hasLowerCase ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {passwordValidation.checks.hasLowerCase && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={passwordValidation.checks.hasLowerCase ? 'text-green-700 font-medium' : 'text-gray-600'}>
                  Una lettera minuscola
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordValidation.checks.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {passwordValidation.checks.hasNumber && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={passwordValidation.checks.hasNumber ? 'text-green-700 font-medium' : 'text-gray-600'}>
                  Un numero
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordValidation.checks.hasSpecialChar ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {passwordValidation.checks.hasSpecialChar && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={passwordValidation.checks.hasSpecialChar ? 'text-green-700 font-medium' : 'text-gray-400'}>
                  Un carattere speciale (opzionale)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${password === confirmPassword && password.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {password === confirmPassword && password.length > 0 && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={password === confirmPassword && password.length > 0 ? 'text-green-700 font-medium' : 'text-gray-600'}>
                  Le password coincidono
                </span>
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Impostazione in corso...' : 'Imposta Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    }>
      <SetupPasswordForm />
    </Suspense>
  );
}
