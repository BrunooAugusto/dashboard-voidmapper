import { createContext, useContext, useState } from 'react'
import translations from '../i18n/translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('pt-BR')

  function t(key, vars = {}) {
    const map  = translations[lang] ?? translations['pt-BR']
    let   text = map[key] ?? translations['pt-BR'][key] ?? key
    return Object.entries(vars).reduce(
      (s, [k, v]) => s.replaceAll('{' + k + '}', v),
      text,
    )
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}
