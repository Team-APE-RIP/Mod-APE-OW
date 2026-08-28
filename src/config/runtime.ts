export const defaultPlatformUrls = {
  github: 'https://github.com/Team-APE-RIP/APE',
  discord: 'https://discord.gg/TaNYDC6kfJ',
  qq: 'https://pd.qq.com/s/clcwlblcm?b=5',
  bilibili: 'https://space.bilibili.com/1220845388',
  x: 'https://x.com/TeamAPEOfficial',
} as const

export type PlatformKey = keyof typeof defaultPlatformUrls
export type PlatformUrls = Record<PlatformKey, string>

interface RuntimeConfig {
  platformUrls?: Partial<PlatformUrls>
}

declare global {
  interface Window {
    __APE_RUNTIME_CONFIG__?: RuntimeConfig
  }
}

function isAbsoluteHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function getRuntimePlatformUrls(): PlatformUrls {
  const configuredUrls = window.__APE_RUNTIME_CONFIG__?.platformUrls

  return Object.fromEntries(
    Object.entries(defaultPlatformUrls).map(([key, fallback]) => {
      const configured = configuredUrls?.[key as PlatformKey]
      return [key, isAbsoluteHttpUrl(configured) ? configured : fallback]
    }),
  ) as PlatformUrls
}
