import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './en/translation.json';
import thTranslation from './th/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  th: {
    translation: thTranslation,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 