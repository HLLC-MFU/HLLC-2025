// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-react-native-language-detector';

i18n
  .use(LanguageDetector) // ตรวจจับ locale ภาษา
  .use(initReactI18next) // ให้ใช้กับ React ได้
  .init({
    fallbackLng: 'en', // ถ้าไม่เจอภาษาที่รองรับ ให้ใช้ 'th'
    // compatibilityJSON: 'v4', // รองรับ React Native JSON
    resources: {
      th: {
        translation: {
          greeting: 'สวัสดี',
          welcome: 'ยินดีต้อนรับ',
          activities: {
            title: 'กิจกรรมทั้งหมด',
            noActivity: 'ไม่มีกิจกรรมขณะนี้',
          },
        },
      },
      en: {
        translation: {
          greeting: 'Hello',
          welcome: 'Welcome',
          activities: {
            title: 'All Activities',
            noActivity: 'No activities right now',
          },
        },
      },
    },
    interpolation: {
      escapeValue: false, // ไม่ต้อง escape string ใน React Native
    },
  });

export default i18n;
