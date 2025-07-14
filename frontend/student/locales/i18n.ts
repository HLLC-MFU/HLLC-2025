import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// ✅ Import the translation files
import en from '@/locales/en/translation.json';
import th from '@/locales/th/translation.json';

const fallbackLng = 'en';
const deviceLang = Localization.getLocales()[0]?.languageCode || fallbackLng;
const defaultLang = deviceLang === 'th' ? 'th' : fallbackLng;

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      th: { translation: th },
    },
    lng: defaultLang,
    fallbackLng,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
