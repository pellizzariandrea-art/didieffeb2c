'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasVerified, setHasVerified] = useState(false);

  const messages = {
    it: {
      verifying: 'Verifica email in corso...',
      success: 'Email verificata con successo!',
      successDesc: 'Il tuo account è stato attivato. Sarai reindirizzato alla pagina di login tra pochi secondi.',
      error: 'Verifica fallita',
      goToLogin: 'Vai al login',
      tokenExpired: 'Il link di verifica è scaduto',
      tokenInvalid: 'Link di verifica non valido',
      alreadyVerified: 'Email già verificata',
    },
    en: {
      verifying: 'Verifying email...',
      success: 'Email verified successfully!',
      successDesc: 'Your account has been activated. You will be redirected to the login page in a few seconds.',
      error: 'Verification failed',
      goToLogin: 'Go to login',
      tokenExpired: 'The verification link has expired',
      tokenInvalid: 'Invalid verification link',
      alreadyVerified: 'Email already verified',
    },
    de: {
      verifying: 'E-Mail wird verifiziert...',
      success: 'E-Mail erfolgreich verifiziert!',
      successDesc: 'Ihr Konto wurde aktiviert. Sie werden in wenigen Sekunden zur Anmeldeseite weitergeleitet.',
      error: 'Verifizierung fehlgeschlagen',
      goToLogin: 'Zur Anmeldung',
      tokenExpired: 'Der Verifizierungslink ist abgelaufen',
      tokenInvalid: 'Ungültiger Verifizierungslink',
      alreadyVerified: 'E-Mail bereits verifiziert',
    },
    fr: {
      verifying: 'Vérification de l\'e-mail en cours...',
      success: 'E-mail vérifié avec succès !',
      successDesc: 'Votre compte a été activé. Vous serez redirigé vers la page de connexion dans quelques secondes.',
      error: 'Échec de la vérification',
      goToLogin: 'Aller à la connexion',
      tokenExpired: 'Le lien de vérification a expiré',
      tokenInvalid: 'Lien de vérification invalide',
      alreadyVerified: 'E-mail déjà vérifié',
    },
    es: {
      verifying: 'Verificando correo electrónico...',
      success: '¡Correo verificado con éxito!',
      successDesc: 'Tu cuenta ha sido activada. Serás redirigido a la página de inicio de sesión en unos segundos.',
      error: 'Verificación fallida',
      goToLogin: 'Ir al inicio de sesión',
      tokenExpired: 'El enlace de verificación ha caducado',
      tokenInvalid: 'Enlace de verificación inválido',
      alreadyVerified: 'Correo ya verificado',
    },
    pt: {
      verifying: 'Verificando e-mail...',
      success: 'E-mail verificado com sucesso!',
      successDesc: 'Sua conta foi ativada. Você será redirecionado para a página de login em alguns segundos.',
      error: 'Verificação falhou',
      goToLogin: 'Ir para login',
      tokenExpired: 'O link de verificação expirou',
      tokenInvalid: 'Link de verificação inválido',
      alreadyVerified: 'E-mail já verificado',
    },
    hr: {
      verifying: 'Provjera e-pošte u tijeku...',
      success: 'E-pošta uspješno provjerena!',
      successDesc: 'Vaš račun je aktiviran. Bit ćete preusmjereni na stranicu za prijavu za nekoliko sekundi.',
      error: 'Provjera nije uspjela',
      goToLogin: 'Idi na prijavu',
      tokenExpired: 'Poveznica za potvrdu je istekla',
      tokenInvalid: 'Neispravna poveznica za potvrdu',
      alreadyVerified: 'E-pošta već provjerena',
    },
    sl: {
      verifying: 'Preverjanje e-pošte v teku...',
      success: 'E-pošta uspešno preverjena!',
      successDesc: 'Vaš račun je bil aktiviran. V nekaj sekundah boste preusmerjeni na stran za prijavo.',
      error: 'Preverjanje ni uspelo',
      goToLogin: 'Pojdi na prijavo',
      tokenExpired: 'Povezava za preverjanje je potekla',
      tokenInvalid: 'Neveljavna povezava za preverjanje',
      alreadyVerified: 'E-pošta že preverjena',
    },
    el: {
      verifying: 'Επαλήθευση email σε εξέλιξη...',
      success: 'Το email επαληθεύτηκε επιτυχώς!',
      successDesc: 'Ο λογαριασμός σας ενεργοποιήθηκε. Θα ανακατευθυνθείτε στη σελίδα σύνδεσης σε λίγα δευτερόλεπτα.',
      error: 'Η επαλήθευση απέτυχε',
      goToLogin: 'Μετάβαση στη σύνδεση',
      tokenExpired: 'Ο σύνδεσμος επαλήθευσης έχει λήξει',
      tokenInvalid: 'Μη έγκυρος σύνδεσμος επαλήθευσης',
      alreadyVerified: 'Το email έχει ήδη επαληθευτεί',
    },
  };

  const labels = messages[language] || messages.it;

  useEffect(() => {
    // Prevent multiple verification attempts
    if (hasVerified) return;

    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setErrorMessage(labels.tokenInvalid);
        return;
      }

      // Mark as verified attempt to prevent double calls
      setHasVerified(true);

      try {
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/');
          }, 3000);
        } else {
          setStatus('error');
          // Map error messages
          if (data.error?.includes('scaduto') || data.error?.includes('expired')) {
            setErrorMessage(labels.tokenExpired);
          } else if (data.error?.includes('già') || data.error?.includes('already')) {
            setErrorMessage(labels.alreadyVerified);
          } else {
            setErrorMessage(data.error || labels.tokenInvalid);
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setErrorMessage(labels.error);
      }
    };

    verifyEmail();
    // Only depend on searchParams - labels and router cause unnecessary re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{labels.verifying}</h1>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{labels.success}</h1>
            <p className="text-gray-600 mb-6">{labels.successDesc}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {labels.goToLogin}
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{labels.error}</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {labels.goToLogin}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Caricamento...</h1>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
