// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './en/translation.json';
import th from './th/translation.json';

const fallbackLng = 'en';
const defaultLang = Localization.getLocales()[0].languageCode === 'th' ? 'th' : fallbackLng;

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
