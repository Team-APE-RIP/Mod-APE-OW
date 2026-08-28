export type SceneFallbackPrompt = 'capability' | 'slow' | 'error'

export interface SceneFallbackState {
  mode: 'gaussian' | 'fallback'
  prompt: SceneFallbackPrompt | null
}

export function createSceneFallbackState(): SceneFallbackState {
  return { mode: 'gaussian', prompt: null }
}

export function requestSceneFallback(
  state: SceneFallbackState,
  prompt: SceneFallbackPrompt,
): SceneFallbackState {
  if (state.mode === 'fallback') return state
  return { ...state, prompt }
}

export function dismissSceneFallback(state: SceneFallbackState): SceneFallbackState {
  if (state.prompt === null) return state
  return { ...state, prompt: null }
}

export function acceptSceneFallback(state: SceneFallbackState): SceneFallbackState {
  if (state.mode === 'fallback' && state.prompt === null) return state
  return { mode: 'fallback', prompt: null }
}

export function shouldRestartSceneLoad(prompt: SceneFallbackPrompt | null): boolean {
  return prompt === 'error'
}
