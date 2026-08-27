export interface RenderingCapabilities {
  width: number
  reducedMotion: boolean
  saveData: boolean
  deviceMemory?: number
}

export function shouldUseGaussianSplats(capabilities: RenderingCapabilities): boolean {
  if (capabilities.reducedMotion || capabilities.saveData) return false
  return capabilities.width >= 768 || (capabilities.deviceMemory ?? 4) > 4
}
