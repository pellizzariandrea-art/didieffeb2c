// add-register-translations.js
// Add registration form translations to ui-labels.json

const fs = require('fs');
const path = require('path');

const labelsPath = path.join(__dirname, 'config', 'ui-labels.json');
const labels = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

// Registration-specific translations
const registerLabels = {
  title: {
    it: "Crea il tuo account",
    en: "Create your account",
    de: "Erstellen Sie Ihr Konto",
    fr: "Créez votre compte",
    es: "Crea tu cuenta",
    pt: "Crie sua conta",
    hr: "Kreirajte svoj račun",
    sl: "Ustvarite svoj račun",
    el: "Δημιουργήστε το λογαριασμό σας"
  },
  account_type: {
    it: "Tipo di account",
    en: "Account type",
    de: "Kontotyp",
    fr: "Type de compte",
    es: "Tipo de cuenta",
    pt: "Tipo de conta",
    hr: "Vrsta računa",
    sl: "Vrsta računa",
    el: "Τύπος λογαριασμού"
  },
  private_customer: {
    it: "Cliente privato (B2C)",
    en: "Private customer (B2C)",
    de: "Privatkunde (B2C)",
    fr: "Client privé (B2C)",
    es: "Cliente privado (B2C)",
    pt: "Cliente privado (B2C)",
    hr: "Privatni kupac (B2C)",
    sl: "Zasebni kupec (B2C)",
    el: "Ιδιώτης πελάτης (B2C)"
  },
  business_customer: {
    it: "Azienda (B2B)",
    en: "Business (B2B)",
    de: "Unternehmen (B2B)",
    fr: "Entreprise (B2B)",
    es: "Empresa (B2B)",
    pt: "Empresa (B2B)",
    hr: "Tvrtka (B2B)",
    sl: "Podjetje (B2B)",
    el: "Επιχείρηση (B2B)"
  },
  personal_info: {
    it: "Informazioni personali",
    en: "Personal information",
    de: "Persönliche Informationen",
    fr: "Informations personnelles",
    es: "Información personal",
    pt: "Informações pessoais",
    hr: "Osobni podaci",
    sl: "Osebni podatki",
    el: "Προσωπικές πληροφορίες"
  },
  first_name: {
    it: "Nome",
    en: "First name",
    de: "Vorname",
    fr: "Prénom",
    es: "Nombre",
    pt: "Nome",
    hr: "Ime",
    sl: "Ime",
    el: "Όνομα"
  },
  last_name: {
    it: "Cognome",
    en: "Last name",
    de: "Nachname",
    fr: "Nom de famille",
    es: "Apellido",
    pt: "Sobrenome",
    hr: "Prezime",
    sl: "Priimek",
    el: "Επώνυμο"
  },
  tax_code: {
    it: "Codice fiscale (opzionale)",
    en: "Tax code (optional)",
    de: "Steuernummer (optional)",
    fr: "Code fiscal (optionnel)",
    es: "Código fiscal (opcional)",
    pt: "Código fiscal (opcional)",
    hr: "Porezni broj (opcionalno)",
    sl: "Davčna številka (neobvezno)",
    el: "Αριθμός φορολογίας (προαιρετικό)"
  },
  vat_number: {
    it: "Partita IVA (opzionale)",
    en: "VAT number (optional)",
    de: "USt-IdNr. (optional)",
    fr: "Numéro de TVA (optionnel)",
    es: "Número de IVA (opcional)",
    pt: "Número de IVA (opcional)",
    hr: "PDV broj (opcionalno)",
    sl: "DDV številka (neobvezno)",
    el: "ΑΦΜ (προαιρετικό)"
  },
  shipping_address: {
    it: "Indirizzo di spedizione",
    en: "Shipping address",
    de: "Lieferadresse",
    fr: "Adresse de livraison",
    es: "Dirección de envío",
    pt: "Endereço de entrega",
    hr: "Adresa dostave",
    sl: "Naslov dostave",
    el: "Διεύθυνση αποστολής"
  },
  street: {
    it: "Via e numero civico",
    en: "Street and number",
    de: "Straße und Hausnummer",
    fr: "Rue et numéro",
    es: "Calle y número",
    pt: "Rua e número",
    hr: "Ulica i broj",
    sl: "Ulica in hišna številka",
    el: "Οδός και αριθμός"
  },
  city: {
    it: "Città",
    en: "City",
    de: "Stadt",
    fr: "Ville",
    es: "Ciudad",
    pt: "Cidade",
    hr: "Grad",
    sl: "Mesto",
    el: "Πόλη"
  },
  postal_code: {
    it: "CAP",
    en: "Postal code",
    de: "Postleitzahl",
    fr: "Code postal",
    es: "Código postal",
    pt: "Código postal",
    hr: "Poštanski broj",
    sl: "Poštna številka",
    el: "Ταχυδρομικός κώδικας"
  },
  province: {
    it: "Provincia",
    en: "Province",
    de: "Provinz",
    fr: "Province",
    es: "Provincia",
    pt: "Província",
    hr: "Županija",
    sl: "Pokrajina",
    el: "Νομός"
  },
  country: {
    it: "Paese",
    en: "Country",
    de: "Land",
    fr: "Pays",
    es: "País",
    pt: "País",
    hr: "Zemlja",
    sl: "Država",
    el: "Χώρα"
  },
  phone: {
    it: "Telefono",
    en: "Phone",
    de: "Telefon",
    fr: "Téléphone",
    es: "Teléfono",
    pt: "Telefone",
    hr: "Telefon",
    sl: "Telefon",
    el: "Τηλέφωνο"
  },
  company_name: {
    it: "Ragione sociale",
    en: "Company name",
    de: "Firmenname",
    fr: "Raison sociale",
    es: "Razón social",
    pt: "Razão social",
    hr: "Naziv tvrtke",
    sl: "Naziv podjetja",
    el: "Επωνυμία εταιρείας"
  },
  vat_number_required: {
    it: "Partita IVA",
    en: "VAT number",
    de: "USt-IdNr.",
    fr: "Numéro de TVA",
    es: "Número de IVA",
    pt: "Número de IVA",
    hr: "PDV broj",
    sl: "DDV številka",
    el: "ΑΦΜ"
  },
  sdi_code: {
    it: "Codice SDI",
    en: "SDI code",
    de: "SDI-Code",
    fr: "Code SDI",
    es: "Código SDI",
    pt: "Código SDI",
    hr: "SDI kod",
    sl: "SDI koda",
    el: "Κωδικός SDI"
  },
  billing_address: {
    it: "Indirizzo di fatturazione",
    en: "Billing address",
    de: "Rechnungsadresse",
    fr: "Adresse de facturation",
    es: "Dirección de facturación",
    pt: "Endereço de faturação",
    hr: "Adresa za naplatu",
    sl: "Naslov za obračun",
    el: "Διεύθυνση χρέωσης"
  },
  contact_person: {
    it: "Persona di riferimento",
    en: "Contact person",
    de: "Kontaktperson",
    fr: "Personne de contact",
    es: "Persona de contacto",
    pt: "Pessoa de contato",
    hr: "Kontakt osoba",
    sl: "Kontaktna oseba",
    el: "Υπεύθυνος επικοινωνίας"
  },
  contact_name: {
    it: "Nome del referente",
    en: "Contact name",
    de: "Name des Ansprechpartners",
    fr: "Nom du contact",
    es: "Nombre del contacto",
    pt: "Nome do contato",
    hr: "Ime kontakta",
    sl: "Ime stika",
    el: "Όνομα επαφής"
  },
  contact_email: {
    it: "Email del referente",
    en: "Contact email",
    de: "E-Mail des Ansprechpartners",
    fr: "Email du contact",
    es: "Email del contacto",
    pt: "Email do contato",
    hr: "Email kontakta",
    sl: "E-pošta stika",
    el: "Email επαφής"
  },
  contact_phone: {
    it: "Telefono del referente",
    en: "Contact phone",
    de: "Telefon des Ansprechpartners",
    fr: "Téléphone du contact",
    es: "Teléfono del contacto",
    pt: "Telefone do contato",
    hr: "Telefon kontakta",
    sl: "Telefon stika",
    el: "Τηλέφωνο επαφής"
  },
  preferred_language: {
    it: "Lingua preferita per le email",
    en: "Preferred language for emails",
    de: "Bevorzugte Sprache für E-Mails",
    fr: "Langue préférée pour les emails",
    es: "Idioma preferido para los correos",
    pt: "Idioma preferido para emails",
    hr: "Preferirani jezik za e-poštu",
    sl: "Prednostni jezik za e-pošto",
    el: "Προτιμώμενη γλώσσα για email"
  },
  create_account: {
    it: "Crea account",
    en: "Create account",
    de: "Konto erstellen",
    fr: "Créer un compte",
    es: "Crear cuenta",
    pt: "Criar conta",
    hr: "Kreiraj račun",
    sl: "Ustvari račun",
    el: "Δημιουργία λογαριασμού"
  },
  already_have_account: {
    it: "Hai già un account?",
    en: "Already have an account?",
    de: "Haben Sie bereits ein Konto?",
    fr: "Vous avez déjà un compte?",
    es: "¿Ya tienes una cuenta?",
    pt: "Já tem uma conta?",
    hr: "Već imate račun?",
    sl: "Že imate račun?",
    el: "Έχετε ήδη λογαριασμό;"
  },
  login_here: {
    it: "Accedi qui",
    en: "Log in here",
    de: "Hier anmelden",
    fr: "Connectez-vous ici",
    es: "Inicia sesión aquí",
    pt: "Entre aqui",
    hr: "Prijavite se ovdje",
    sl: "Prijavite se tukaj",
    el: "Συνδεθείτε εδώ"
  }
};

// Add to auth section
if (!labels.auth.register_form) {
  labels.auth.register_form = registerLabels;
}

// Save
fs.writeFileSync(labelsPath, JSON.stringify(labels, null, 2), 'utf8');
console.log('✅ Registration translations added to ui-labels.json');
