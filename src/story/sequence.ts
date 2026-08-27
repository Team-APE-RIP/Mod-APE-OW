export function getActiveLine<T>(items: readonly T[], progress: number): T | undefined {
  if (items.length === 0 || progress <= 0) return undefined
  const normalized = Math.min(1, progress)
  const index = Math.min(items.length - 1, Math.floor(normalized * items.length))
  return items[index]
}
