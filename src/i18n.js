import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import translationEN from './locals/en/translation.json';
import translationDE from './locals/de/translation.json';
import translationIT from './locals/it/translation.json';

const resources = {
    en: { translation: translationEN },
    de: { translation: translationDE },
    it: { translation: translationIT },
};

// Remove old key set by LanguageDetector (auto-detected browser language)
// so it no longer overrides our default English setting
localStorage.removeItem('i18nextLng');

// Read user's explicit language choice (set by the language switcher)
const savedLang = localStorage.getItem('tributtoo_lang');
const defaultLang = (savedLang && ['en', 'de', 'it'].includes(savedLang)) ? savedLang : 'en';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: defaultLang,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
