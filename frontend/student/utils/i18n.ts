import en from '@/locales/en';
import th from '@/locales/th';

const locales = { en, th };

type LocaleKey = keyof typeof en;

export function t(key: LocaleKey, language: 'en' | 'th') {
  return locales[language][key] || key;
}

// สำหรับข้อความ dynamic ที่มาจาก backend เช่น { th: '...', en: '...' }
export function getLocalizedField(obj: any, language: 'en' | 'th') {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[language] || obj['en'] || obj['th'] || '';
} 