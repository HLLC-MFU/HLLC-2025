// storage/zustard/language.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type LanguageStore = {
  language: 'en' | 'th';
  setLanguage: (lang: 'en' | 'th') => void;
};

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'zustard-language', // key ที่เก็บใน AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
