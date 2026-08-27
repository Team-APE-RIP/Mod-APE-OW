import { parse } from 'smol-toml'
import type { Language } from './language'
import { detectLanguage, persistLanguage } from './language'
import enRaw from './locales/en.toml?raw'
import zhHansRaw from './locales/zh-Hans.toml?raw'
import zhHantRaw from './locales/zh-Hant.toml?raw'
import jaRaw from './locales/ja.toml?raw'
import ruRaw from './locales/ru.toml?raw'

export interface Locale {
  meta: { title: string; description: string }
  opening: { primary: string; secondary: string; loading: string; scroll: string }
  lore: { lines: string[] }
  aftermath: { lines: string[] }
  ruins: { lines: string[] }
  finale: { line_one: string; line_two: string }
  platforms: { github: string; discord: string; qq: string; bilibili: string; x: string }
  accessibility: { scene: string; logo: string; platforms: string }
}

const localeSources: Record<Language, string> = {
  en: enRaw,
  'zh-Hans': zhHansRaw,
  'zh-Hant': zhHantRaw,
  ja: jaRaw,
  ru: ruRaw,
}

export function loadLocale(language: Language): Locale {
  return parse(localeSources[language]) as unknown as Locale
}

export function initializeLocale(): { language: Language; locale: Locale } {
  const language = detectLanguage(document.cookie, navigator.languages)
  persistLanguage(language)
  return { language, locale: loadLocale(language) }
}
