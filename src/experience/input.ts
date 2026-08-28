export const firstInteractionEvents = ['mousedown'] as const

export function isPrimaryMouseClick(event: Event): event is MouseEvent {
  return event instanceof MouseEvent && event.button === 0
}

export function isExperienceStartClick(event: Event): event is MouseEvent {
  if (!isPrimaryMouseClick(event)) return false
  const target = event.target
  return !(target instanceof Element && target.closest('button, a, input, select, textarea, [role="button"], [role="dialog"]'))
}

const ignoredKeys = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock'])

export function isExperienceKey(key: string): boolean {
  return !ignoredKeys.has(key)
}
