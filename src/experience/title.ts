export function getTitleScale(lineWidths: readonly number[], availableWidth: number): number {
  const widestLine = Math.max(1, ...lineWidths)
  return Math.min(1, Math.max(0.1, availableWidth / widestLine))
}
