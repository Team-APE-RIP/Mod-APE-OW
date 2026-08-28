export interface RenderingCapabilities {
  width: number
  reducedMotion: boolean
  saveData: boolean
  deviceMemory?: number
}

/**
 * Returns a non-blocking recommendation for callers that want to offer an
 * image fallback. Capability hints are advisory: they never disable Gaussian
 * splats on their own.
 */
export function getGaussianDowngradeRecommendation(capabilities: RenderingCapabilities): string | null {
  if (capabilities.reducedMotion) return 'Reduced motion is enabled; an image fallback may be preferable.'
  if (capabilities.saveData) return 'Data saving is enabled; an image fallback may use less bandwidth.'
  if (capabilities.width < 768) return 'The display is narrow; an image fallback may use fewer resources.'
  if ((capabilities.deviceMemory ?? 4) <= 4) return 'This device has limited memory; an image fallback may be more reliable.'
  return null
}

export function shouldUseGaussianSplats(capabilities: RenderingCapabilities): boolean {
  void capabilities
  return true
}
