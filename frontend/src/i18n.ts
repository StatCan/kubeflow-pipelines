import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import XHR from 'i18next-http-backend';

const options = {
  order: ['navigator'],
  detectLngFromPath: 0,
};
i18n
  .use(XHR)
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    ns: ['common', 'home', 'artifacts','executions','experiments','pipelines'],
    defaultNS: 'common',
    fallbackLng: ['en','fr'],
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    detection: options,
  });

export default i18n;