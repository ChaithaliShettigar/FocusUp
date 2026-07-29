import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      tagline: 'Stay focused, learn smarter, and playfully keep yourself on track.',
      cta: 'Start Learning with FocusUp',
      dashboard: 'Dashboard',
      learn: 'Learn',
      groups: 'Groups',
      analytics: 'Analytics',
      profile: 'Profile',
      settings: 'Settings',
      login: 'Login',
      register: 'Register',
      startSession: 'Start session',
      uploadPdf: 'Upload PDF',
      addYoutube: 'Add YouTube Link',
      timerTarget: 'Set your target study time',
      focusScore: 'Focus score',
      streak: 'Streak',
      language: 'Language',
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
