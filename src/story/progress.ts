export interface StoryState {
  titleOpacity: number
  sphereY: number
  sphereZ: number
  sphereScale: number
  sphereTilt: number
  loreProgress: number
  loreOpacity: number
  impactProgress: number
  explosion: number
  aftermathOpacity: number
  aftermathProgress: number
  ruinsOpacity: number
  ruinsProgress: number
  ruinsTextOpacity: number
  finaleOpacity: number
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const range = (value: number, start: number, end: number) => clamp((value - start) / (end - start))
const smooth = (value: number) => value * value * (3 - 2 * value)

export function getStoryState(rawProgress: number): StoryState {
  const progress = clamp(rawProgress)
  const ascent = smooth(range(progress, 0.04, 0.38))
  const impact = smooth(range(progress, 0.42, 0.54))
  const aftermathProgress = smooth(range(progress, 0.56, 0.8))

  return {
    titleOpacity: 1 - smooth(range(progress, 0.01, 0.1)),
    sphereY: ascent * 2.65 - impact * 2.65,
    sphereZ: -ascent * 4.5 + impact * 7.2,
    sphereScale: 1 - ascent * 0.58 + impact * 5.4,
    sphereTilt: smooth(range(progress, 0.18, 0.42)) * -0.52,
    loreProgress: range(progress, 0.1, 0.42),
    loreOpacity: 1 - smooth(range(progress, 0.4, 0.52)),
    impactProgress: impact,
    explosion: smooth(range(progress, 0.5, 0.585)) * (1 - smooth(range(progress, 0.66, 0.74))),
    aftermathOpacity: smooth(range(progress, 0.57, 0.65)) * (1 - smooth(range(progress, 0.73, 0.82))),
    aftermathProgress,
    ruinsOpacity: smooth(range(progress, 0.7, 0.8)),
    ruinsProgress: range(progress, 0.76, 0.94),
    ruinsTextOpacity: 1 - smooth(range(progress, 0.94, 1)),
    finaleOpacity: smooth(range(progress, 0.9, 0.98)),
  }
}
