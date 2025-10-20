'use client';

import { useBrand } from '@/contexts/BrandContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Briefcase, Send, Upload } from 'lucide-react';
import { useState } from 'react';

export default function CareersPage() {
  const { brandConfig } = useBrand();
  const { currentLang } = useLanguage();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefono: '',
    messaggio: '',
    curriculum: null as File | null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementare invio form
    console.log('Form submitted:', formData);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section
        className="py-32 px-4"
        style={{
          background: `linear-gradient(135deg, ${brandConfig.primaryColor}15, ${brandConfig.secondaryColor}15)`
        }}
      >
        <div className="container mx-auto text-center max-w-4xl">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{
              backgroundColor: `${brandConfig.primaryColor}20`,
              color: brandConfig.primaryColor
            }}
          >
            <Briefcase className="w-10 h-10" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            {currentLang === 'it' && 'Lavora con Noi'}
            {currentLang === 'en' && 'Careers'}
            {currentLang === 'de' && 'Karriere'}
            {currentLang === 'fr' && 'Carrières'}
            {currentLang === 'es' && 'Empleo'}
            {currentLang === 'pt' && 'Carreiras'}
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {currentLang === 'it' && 'Didieffe è sempre alla ricerca di collaborazioni nazionali e internazionali'}
            {currentLang === 'en' && 'Didieffe is always looking for national and international collaborations'}
            {currentLang === 'de' && 'Didieffe sucht immer nach nationalen und internationalen Kooperationen'}
            {currentLang === 'fr' && 'Didieffe recherche toujours des collaborations nationales et internationales'}
            {currentLang === 'es' && 'Didieffe busca siempre colaboraciones nacionales e internacionales'}
            {currentLang === 'pt' && 'Didieffe está sempre procurando colaborações nacionais e internacionais'}
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {currentLang === 'it' && 'Invia la tua candidatura'}
              {currentLang === 'en' && 'Send your application'}
              {currentLang === 'de' && 'Senden Sie Ihre Bewerbung'}
              {currentLang === 'fr' && 'Envoyez votre candidature'}
              {currentLang === 'es' && 'Envía tu candidatura'}
              {currentLang === 'pt' && 'Envie sua candidatura'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentLang === 'it' && 'Nome e Cognome'}
                  {currentLang === 'en' && 'Full Name'}
                  {currentLang === 'de' && 'Vollständiger Name'}
                  {currentLang === 'fr' && 'Nom complet'}
                  {currentLang === 'es' && 'Nombre completo'}
                  {currentLang === 'pt' && 'Nome completo'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentLang === 'it' && 'Telefono'}
                  {currentLang === 'en' && 'Phone'}
                  {currentLang === 'de' && 'Telefon'}
                  {currentLang === 'fr' && 'Téléphone'}
                  {currentLang === 'es' && 'Teléfono'}
                  {currentLang === 'pt' && 'Telefone'}
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentLang === 'it' && 'Messaggio'}
                  {currentLang === 'en' && 'Message'}
                  {currentLang === 'de' && 'Nachricht'}
                  {currentLang === 'fr' && 'Message'}
                  {currentLang === 'es' && 'Mensaje'}
                  {currentLang === 'pt' && 'Mensagem'}
                </label>
                <textarea
                  rows={6}
                  required
                  value={formData.messaggio}
                  onChange={(e) => setFormData({ ...formData, messaggio: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none transition-colors"
                  placeholder={
                    currentLang === 'it' ? 'Raccontaci di te e delle tue competenze...' :
                    currentLang === 'en' ? 'Tell us about yourself and your skills...' :
                    currentLang === 'de' ? 'Erzählen Sie uns von sich und Ihren Fähigkeiten...' :
                    currentLang === 'fr' ? 'Parlez-nous de vous et de vos compétences...' :
                    currentLang === 'es' ? 'Cuéntanos sobre ti y tus habilidades...' :
                    'Conte-nos sobre você e suas habilidades...'
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {currentLang === 'it' && 'Curriculum Vitae'}
                  {currentLang === 'en' && 'Resume/CV'}
                  {currentLang === 'de' && 'Lebenslauf'}
                  {currentLang === 'fr' && 'CV'}
                  {currentLang === 'es' && 'Currículum'}
                  {currentLang === 'pt' && 'Currículo'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFormData({ ...formData, curriculum: e.target.files?.[0] || null })}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer">
                    <span className="text-gray-600">
                      {formData.curriculum ? formData.curriculum.name : (
                        currentLang === 'it' ? 'Carica il tuo CV (PDF, DOC, DOCX)' :
                        currentLang === 'en' ? 'Upload your CV (PDF, DOC, DOCX)' :
                        currentLang === 'de' ? 'Laden Sie Ihren Lebenslauf hoch (PDF, DOC, DOCX)' :
                        currentLang === 'fr' ? 'Téléchargez votre CV (PDF, DOC, DOCX)' :
                        currentLang === 'es' ? 'Sube tu CV (PDF, DOC, DOCX)' :
                        'Carregue seu CV (PDF, DOC, DOCX)'
                      )}
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-3"
                style={{
                  backgroundColor: brandConfig.primaryColor
                }}
              >
                <Send className="w-5 h-5" />
                {currentLang === 'it' && 'Invia Candidatura'}
                {currentLang === 'en' && 'Submit Application'}
                {currentLang === 'de' && 'Bewerbung senden'}
                {currentLang === 'fr' && 'Envoyer la candidature'}
                {currentLang === 'es' && 'Enviar candidatura'}
                {currentLang === 'pt' && 'Enviar candidatura'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {currentLang === 'it' && 'Unisciti al nostro team'}
            {currentLang === 'en' && 'Join our team'}
            {currentLang === 'de' && 'Werden Sie Teil unseres Teams'}
            {currentLang === 'fr' && 'Rejoignez notre équipe'}
            {currentLang === 'es' && 'Únete a nuestro equipo'}
            {currentLang === 'pt' && 'Junte-se à nossa equipe'}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {currentLang === 'it' && 'Siamo sempre alla ricerca di talenti motivati che condividano la nostra passione per l\'eccellenza artigianale e l\'innovazione'}
            {currentLang === 'en' && 'We are always looking for motivated talents who share our passion for craftsmanship excellence and innovation'}
            {currentLang === 'de' && 'Wir suchen immer nach motivierten Talenten, die unsere Leidenschaft für handwerkliche Exzellenz und Innovation teilen'}
            {currentLang === 'fr' && 'Nous recherchons toujours des talents motivés qui partagent notre passion pour l\'excellence artisanale et l\'innovation'}
            {currentLang === 'es' && 'Siempre estamos buscando talentos motivados que compartan nuestra pasión por la excelencia artesanal y la innovación'}
            {currentLang === 'pt' && 'Estamos sempre procurando talentos motivados que compartilhem nossa paixão pela excelência artesanal e inovação'}
          </p>
        </div>
      </section>
    </main>
  );
}
