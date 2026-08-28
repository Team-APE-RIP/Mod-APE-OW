export interface SplatWarmupPose {
  position: readonly [number, number, number]
  target: readonly [number, number, number]
}

interface SplatSortWaitDependencies {
  waitForFrame: () => Promise<void>
  isSortRunning: () => boolean
  isDisposed: () => boolean
}

export async function waitForSplatSortIdle({
  waitForFrame,
  isSortRunning,
  isDisposed,
}: SplatSortWaitDependencies): Promise<boolean> {
  let consecutiveIdleFrames = 0

  while (consecutiveIdleFrames < 2) {
    await waitForFrame()
    if (isDisposed()) return false
    consecutiveIdleFrames = isSortRunning() ? 0 : consecutiveIdleFrames + 1
  }

  return true
}

export const SPLAT_WARMUP_POSES: Record<'opening' | 'ruins', readonly SplatWarmupPose[]> = {
  opening: [
    { position: [0, 0, 0], target: [0, 0, 1] },
    { position: [0.12, 0.045, 0.09], target: [0.035, 0.02, 1] },
  ],
  ruins: [
    { position: [0, 0, 0], target: [0, 0, 1] },
    { position: [0.12, -0.015, 0.16], target: [0.035, 0.02, 1] },
  ],
}
