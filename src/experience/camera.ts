export function fitCameraDistance(radius: number, verticalFovDegrees: number, aspect: number, padding = 1.12): number {
  const verticalHalfFov = (verticalFovDegrees * Math.PI) / 360
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * Math.max(aspect, 0.01))
  const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov)
  return (radius * padding) / Math.tan(limitingHalfFov)
}
