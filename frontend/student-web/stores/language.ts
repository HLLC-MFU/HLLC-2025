import { create } from 'zustand';

type LanguageState = {
  language: 'en' | 'th';
  setLanguage: (lang: 'en' | 'th') => void;
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
})); 