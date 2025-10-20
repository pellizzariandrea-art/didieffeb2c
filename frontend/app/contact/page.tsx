'use client';

import { useBrand } from '@/contexts/BrandContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, MapPin, Mail } from 'lucide-react';

export default function ContactPage() {
  const { currentBrand, brandConfig } = useBrand();
  const { currentLang } = useLanguage();

  // Contact information per brand
  const contactInfo: Record<string, any> = {
    group: {
      phone: '+39 0439 438244',
      address: 'Zona Artigianale Pradenich, 2/A\n32030 Cesiomaggiore (BL) ITALY',
      email: 'info@didieffe.com',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2767.444720710!2d11.982488516348!3d46.082112179113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4778fdaf9a930703%3A0x9c651233f25d9b5d!2sDidieffe!5e0!3m2!1sit!2sit!4v1526563510290'
    },
    didieffe: {
      phone: '+39 0439 438244',
      address: 'Zona Artigianale Pradenich, 2/A\n32030 Cesiomaggiore (BL) ITALY',
      email: 'info@didieffe.com',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2767.444720710!2d11.982488516348!3d46.082112179113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4778fdaf9a930703%3A0x9c651233f25d9b5d!2sDidieffe!5e0!3m2!1sit!2sit!4v1526563510290'
    },
    antologia: {
      phone: '+39 0439 438244',
      address: 'Zona Artigianale Pradenich, 2/A\n32030 Cesiomaggiore (BL) ITALY',
      email: 'info@didieffe.com',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2767.444720710!2d11.982488516348!3d46.082112179113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4778fdaf9a930703%3A0x9c651233f25d9b5d!2sDidieffe!5e0!3m2!1sit!2sit!4v1526563510290'
    },
    hnox: {
      phone: '+39 0439 438244',
      address: 'Zona Artigianale Pradenich, 2/A\n32030 Cesiomaggiore (BL) ITALY',
      email: 'info@didieffe.com',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2767.444720710!2d11.982488516348!3d46.082112179113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4778fdaf9a930703%3A0x9c651233f25d9b5d!2sDidieffe!5e0!3m2!1sit!2sit!4v1526563510290'
    },
    xtrend: {
      phone: '+39 0439 438244',
      address: 'Zona Artigianale Pradenich, 2/A\n32030 Cesiomaggiore (BL) ITALY',
      email: 'info@didieffe.com',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2767.444720710!2d11.982488516348!3d46.082112179113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4778fdaf9a930703%3A0x9c651233f25d9b5d!2sDidieffe!5e0!3m2!1sit!2sit!4v1526563510290'
    }
  };

  const info = contactInfo[currentBrand];

  return (
    <main className="min-h-screen">
      {/* Google Map */}
      <section className="w-full h-[600px] bg-gray-200">
        <iframe
          src={info.mapUrl}
          width="100%"
          height="600"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>

      {/* Contact Info Cards */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Phone */}
            <div className="bg-gray-900 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: brandConfig.primaryColor }}
              >
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-4 uppercase tracking-wider">
                {currentLang === 'it' && 'Telefono'}
                {currentLang === 'en' && 'Contact No.'}
                {currentLang === 'de' && 'Telefon'}
                {currentLang === 'fr' && 'Téléphone'}
                {currentLang === 'es' && 'Teléfono'}
                {currentLang === 'pt' && 'Telefone'}
              </h3>
              <a
                href={`tel:${info.phone.replace(/\s/g, '')}`}
                className="text-gray-200 hover:text-white text-lg"
              >
                {info.phone}
              </a>
            </div>

            {/* Address */}
            <div className="bg-gray-900 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: brandConfig.primaryColor }}
              >
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-4 uppercase tracking-wider">
                {currentLang === 'it' && 'Indirizzo'}
                {currentLang === 'en' && 'Office Address'}
                {currentLang === 'de' && 'Adresse'}
                {currentLang === 'fr' && 'Adresse'}
                {currentLang === 'es' && 'Dirección'}
                {currentLang === 'pt' && 'Endereço'}
              </h3>
              <p className="text-gray-200 whitespace-pre-line">
                {info.address}
              </p>
            </div>

            {/* Email */}
            <div className="bg-gray-900 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: brandConfig.primaryColor }}
              >
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-4 uppercase tracking-wider">
                Email
              </h3>
              <a
                href={`mailto:${info.email}`}
                className="text-gray-200 hover:text-white text-lg break-all"
              >
                {info.email}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            {currentLang === 'it' && 'Inviaci un Messaggio'}
            {currentLang === 'en' && 'Send us a Message'}
            {currentLang === 'de' && 'Senden Sie uns eine Nachricht'}
            {currentLang === 'fr' && 'Envoyez-nous un Message'}
            {currentLang === 'es' && 'Envíanos un Mensaje'}
            {currentLang === 'pt' && 'Envie-nos uma Mensagem'}
          </h2>
          <p className="text-gray-600 text-center mb-12">
            {currentLang === 'it' && 'Compila il modulo e ti risponderemo il prima possibile'}
            {currentLang === 'en' && 'Fill out the form and we will get back to you as soon as possible'}
            {currentLang === 'de' && 'Füllen Sie das Formular aus und wir werden uns so schnell wie möglich bei Ihnen melden'}
            {currentLang === 'fr' && 'Remplissez le formulaire et nous vous répondrons dès que possible'}
            {currentLang === 'es' && 'Complete el formulario y le responderemos lo antes posible'}
            {currentLang === 'pt' && 'Preencha o formulário e entraremos em contato o mais breve possível'}
          </p>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {currentLang === 'it' && 'Nome'}
                  {currentLang === 'en' && 'Name'}
                  {currentLang === 'de' && 'Name'}
                  {currentLang === 'fr' && 'Nom'}
                  {currentLang === 'es' && 'Nombre'}
                  {currentLang === 'pt' && 'Nome'}
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                {currentLang === 'it' && 'Oggetto'}
                {currentLang === 'en' && 'Subject'}
                {currentLang === 'de' && 'Betreff'}
                {currentLang === 'fr' && 'Sujet'}
                {currentLang === 'es' && 'Asunto'}
                {currentLang === 'pt' && 'Assunto'}
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                {currentLang === 'it' && 'Messaggio'}
                {currentLang === 'en' && 'Message'}
                {currentLang === 'de' && 'Nachricht'}
                {currentLang === 'fr' && 'Message'}
                {currentLang === 'es' && 'Mensaje'}
                {currentLang === 'pt' && 'Mensagem'}
              </label>
              <textarea
                rows={6}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full text-white px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-[1.02] shadow-xl"
              style={{
                backgroundColor: brandConfig.primaryColor
              }}
            >
              {currentLang === 'it' && 'Invia Messaggio'}
              {currentLang === 'en' && 'Send Message'}
              {currentLang === 'de' && 'Nachricht senden'}
              {currentLang === 'fr' && 'Envoyer le Message'}
              {currentLang === 'es' && 'Enviar Mensaje'}
              {currentLang === 'pt' && 'Enviar Mensagem'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
