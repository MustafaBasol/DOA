// i18n translations for panel
const panelTranslations = {
  tr: {
    'login.title': 'Giriş Yap',
    'login.subtitle': 'WhatsApp Chatbot Yönetim Paneli',
    'login.email': 'E-posta',
    'login.password': 'Şifre',
    'login.submit': 'Giriş Yap',
    'login.back': '← Ana Sayfaya Dön',
    'login.error.invalid': 'E-posta veya şifre hatalı',
    'login.error.network': 'Bağlantı hatası. Lütfen tekrar deneyin.',
    'login.error.inactive': 'Hesabınız aktif değil. Lütfen yöneticinizle iletişime geçin.',
    'admin.dashboard': 'Yönetim Paneli',
    'admin.users': 'Müşteriler',
    'admin.payments': 'Ödemeler',
    'admin.stats': 'İstatistikler',
    'client.dashboard': 'Kontrol Paneli',
    'client.messages': 'Mesajlar',
    'client.profile': 'Profil',
    'client.payments': 'Ödemeler',
    'nav.logout': 'Çıkış Yap',
  },
  en: {
    'login.title': 'Login',
    'login.subtitle': 'WhatsApp Chatbot Management Panel',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submit': 'Login',
    'login.back': '← Back to Home',
    'login.error.invalid': 'Invalid email or password',
    'login.error.network': 'Connection error. Please try again.',
    'login.error.inactive': 'Your account is inactive. Please contact your administrator.',
    'admin.dashboard': 'Admin Panel',
    'admin.users': 'Clients',
    'admin.payments': 'Payments',
    'admin.stats': 'Statistics',
    'client.dashboard': 'Dashboard',
    'client.messages': 'Messages',
    'client.profile': 'Profile',
    'client.payments': 'Payments',
    'nav.logout': 'Logout',
  },
  fr: {
    'login.title': 'Connexion',
    'login.subtitle': 'Panneau de Gestion Chatbot WhatsApp',
    'login.email': 'E-mail',
    'login.password': 'Mot de passe',
    'login.submit': 'Connexion',
    'login.back': '← Retour à l\'accueil',
    'login.error.invalid': 'E-mail ou mot de passe invalide',
    'login.error.network': 'Erreur de connexion. Veuillez réessayer.',
    'login.error.inactive': 'Votre compte est inactif. Veuillez contacter votre administrateur.',
    'admin.dashboard': 'Panneau Admin',
    'admin.users': 'Clients',
    'admin.payments': 'Paiements',
    'admin.stats': 'Statistiques',
    'client.dashboard': 'Tableau de bord',
    'client.messages': 'Messages',
    'client.profile': 'Profil',
    'client.payments': 'Paiements',
    'nav.logout': 'Déconnexion',
  },
};

// Get current language from localStorage or default
let activeLang = localStorage.getItem('language') || 'tr';

// Translation function
function translate(key) {
  return panelTranslations[activeLang]?.[key] || panelTranslations.tr[key] || key;
}

// Apply translations to page
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const translation = translate(key);
    
    const attr = el.dataset.i18nAttr;
    if (attr) {
      el.setAttribute(attr, translation);
    } else {
      el.textContent = translation;
    }
  });

  // Update active language button
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === activeLang);
  });

  // Update HTML lang attribute
  document.documentElement.lang = activeLang;
}

// Language switcher
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeLang = btn.dataset.lang;
      localStorage.setItem('language', activeLang);
      applyTranslations();
    });
  });
});

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.translate = translate;
  window.applyTranslations = applyTranslations;
}
