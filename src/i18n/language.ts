export const supportedLanguages = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ru'] as const

export type Language = (typeof supportedLanguages)[number]

const LANGUAGE_COOKIE = 'aperip_language'

export function normalizeLanguage(language: string): Language {
  const normalized = language.toLowerCase()

  if (normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk') || normalized.startsWith('zh-hant')) {
    return 'zh-Hant'
  }

  if (normalized.startsWith('zh')) return 'zh-Hans'
  if (normalized.startsWith('ja')) return 'ja'
  if (normalized.startsWith('ru')) return 'ru'
  if (normalized.startsWith('en')) return 'en'
  return 'en'
}

export function detectLanguage(cookie: string, browserLanguages: readonly string[]): Language {
  const cookieLanguage = cookie
    .split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === LANGUAGE_COOKIE)?.[1]

  if (cookieLanguage && supportedLanguages.includes(cookieLanguage as Language)) {
    return cookieLanguage as Language
  }

  return normalizeLanguage(browserLanguages[0] ?? 'en')
}

export function persistLanguage(language: Language): void {
  document.cookie = `${LANGUAGE_COOKIE}=${language}; Max-Age=31536000; Path=/; SameSite=Lax`
}
