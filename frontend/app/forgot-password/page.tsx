'use client';

// app/forgot-password/page.tsx
// Password Reset Request Page

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { resetPassword } from '@/lib/firebase/auth';
import uiLabels from '@/config/ui-labels.json';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const { currentLang: language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const labels = uiLabels.auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(labels.error.required_field[language]);
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      toast.success(
        language === 'it'
          ? 'Email di reset password inviata!'
          : language === 'en'
          ? 'Password reset email sent!'
          : language === 'de'
          ? 'Passwort-Reset-E-Mail gesendet!'
          : language === 'fr'
          ? 'Email de réinitialisation du mot de passe envoyé!'
          : language === 'es'
          ? '¡Correo de restablecimiento de contraseña enviado!'
          : 'Email de redefinição de senha enviado!'
      );
    } catch (err: any) {
      console.error('Reset password error:', err);

      if (err.message.includes('user-not-found')) {
        setError(labels.error.user_not_found[language]);
      } else if (err.message.includes('invalid-email')) {
        setError(labels.error.invalid_email[language]);
      } else {
        setError(
          language === 'it'
            ? 'Errore durante l\'invio dell\'email'
            : language === 'en'
            ? 'Error sending email'
            : language === 'de'
            ? 'Fehler beim Senden der E-Mail'
            : language === 'fr'
            ? 'Erreur lors de l\'envoi de l\'email'
            : language === 'es'
            ? 'Error al enviar el correo'
            : 'Erro ao enviar o email'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <svg className="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {language === 'it' ? 'Email inviata!' : language === 'en' ? 'Email sent!' : language === 'de' ? 'E-Mail gesendet!' : language === 'fr' ? 'Email envoyé!' : language === 'es' ? '¡Correo enviado!' : 'Email enviado!'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {language === 'it'
                ? 'Controlla la tua email per il link di reset della password.'
                : language === 'en'
                ? 'Check your email for the password reset link.'
                : language === 'de'
                ? 'Überprüfen Sie Ihre E-Mail für den Link zum Zurücksetzen des Passworts.'
                : language === 'fr'
                ? 'Vérifiez votre email pour le lien de réinitialisation du mot de passe.'
                : language === 'es'
                ? 'Revisa tu correo para el enlace de restablecimiento de contraseña.'
                : 'Verifique seu email para o link de redefinição de senha.'}
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {labels.login[language]}
            </Link>

            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {language === 'it' ? 'Invia di nuovo' : language === 'en' ? 'Send again' : language === 'de' ? 'Erneut senden' : language === 'fr' ? 'Renvoyer' : language === 'es' ? 'Enviar de nuevo' : 'Enviar novamente'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {labels.reset_password[language]}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {language === 'it'
              ? 'Inserisci la tua email per ricevere il link di reset della password.'
              : language === 'en'
              ? 'Enter your email to receive a password reset link.'
              : language === 'de'
              ? 'Geben Sie Ihre E-Mail ein, um einen Link zum Zurücksetzen des Passworts zu erhalten.'
              : language === 'fr'
              ? 'Entrez votre email pour recevoir un lien de réinitialisation du mot de passe.'
              : language === 'es'
              ? 'Ingresa tu correo para recibir un enlace de restablecimiento de contraseña.'
              : 'Insira seu email para receber um link de redefinição de senha.'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              {labels.email[language]}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder={labels.email[language]}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {language === 'it' ? 'Invio...' : language === 'en' ? 'Sending...' : language === 'de' ? 'Senden...' : language === 'fr' ? 'Envoi...' : language === 'es' ? 'Enviando...' : 'Enviando...'}
                </span>
              ) : (
                language === 'it'
                  ? 'Invia link'
                  : language === 'en'
                  ? 'Send link'
                  : language === 'de'
                  ? 'Link senden'
                  : language === 'fr'
                  ? 'Envoyer le lien'
                  : language === 'es'
                  ? 'Enviar enlace'
                  : 'Enviar link'
              )}
            </button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-500 block"
          >
            ← {language === 'it' ? 'Torna al login' : language === 'en' ? 'Back to login' : language === 'de' ? 'Zurück zum Login' : language === 'fr' ? 'Retour à la connexion' : language === 'es' ? 'Volver al inicio de sesión' : 'Voltar ao login'}
          </Link>
        </div>
      </div>
    </div>
  );
}
