export interface PlayableAudio {
  muted: boolean
  play: () => Promise<void>
}

export async function playTheme(audio: PlayableAudio, muted: boolean): Promise<boolean> {
  audio.muted = muted
  try {
    await audio.play()
    return true
  } catch {
    return false
  }
}
