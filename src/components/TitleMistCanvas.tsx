import { useEffect, useRef, type RefObject } from 'react'

interface TitleMistCanvasProps {
  active: boolean
  originRef: RefObject<HTMLElement | null>
}

interface MistParticle {
  x: number
  y: number
  velocityX: number
  velocityY: number
  radius: number
  growth: number
  delay: number
  life: number
  opacity: number
  phase: number
  crimson: boolean
}

function createMistSprite(rgb: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas')
  sprite.width = 96
  sprite.height = 96
  const context = sprite.getContext('2d')
  if (!context) return sprite

  const gradient = context.createRadialGradient(48, 48, 0, 48, 48, 48)
  gradient.addColorStop(0, `rgba(${rgb}, .72)`)
  gradient.addColorStop(0.28, `rgba(${rgb}, .34)`)
  gradient.addColorStop(0.7, `rgba(${rgb}, .08)`)
  gradient.addColorStop(1, `rgba(${rgb}, 0)`)
  context.fillStyle = gradient
  context.fillRect(0, 0, 96, 96)
  return sprite
}

export function TitleMistCanvas({ active, originRef }: TitleMistCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return undefined
    const canvas = canvasRef.current
    const origin = originRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !origin || !context) return undefined

    let frame = 0
    let width = window.innerWidth
    let height = window.innerHeight
    const resize = () => {
      width = Math.max(1, window.innerWidth)
      height = Math.max(1, window.innerHeight)
      const pixelRatio = Math.min(window.devicePixelRatio, 1.5)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }
    resize()

    const bounds = origin.getBoundingClientRect()
    const centerX = bounds.left + bounds.width / 2
    const centerY = bounds.top + bounds.height / 2
    const particleCount = Math.min(190, Math.max(110, Math.round(bounds.width / 6)))
    const particles: MistParticle[] = Array.from({ length: particleCount }, () => {
      const x = bounds.left + (Math.random() * 1.18 - 0.09) * bounds.width
      const y = bounds.top + (Math.random() * 1.5 - 0.25) * bounds.height
      const radialX = (x - centerX) / Math.max(1, bounds.width / 2)
      const radialY = (y - centerY) / Math.max(1, bounds.height / 2)
      return {
        x,
        y,
        velocityX: radialX * (22 + Math.random() * 28) + (Math.random() - 0.5) * 14,
        velocityY: radialY * (8 + Math.random() * 14) - 7 - Math.random() * 13,
        radius: 8 + Math.random() * 18,
        growth: 10 + Math.random() * 18,
        delay: Math.random() * 260,
        life: 1_350 + Math.random() * 950,
        opacity: 0.18 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        crimson: Math.random() < 0.24,
      }
    })
    const paleSprite = createMistSprite('232, 237, 238')
    const crimsonSprite = createMistSprite('185, 32, 72')
    const startedAt = performance.now()
    let previousTime = startedAt

    const render = (now: number) => {
      const elapsed = now - startedAt
      const deltaSeconds = Math.min(1 / 30, Math.max(0, (now - previousTime) / 1000))
      previousTime = now
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'screen'
      let hasLivingParticles = false

      particles.forEach((particle) => {
        const age = elapsed - particle.delay
        if (age < 0) {
          hasLivingParticles = true
          return
        }
        const lifeProgress = age / particle.life
        if (lifeProgress >= 1) return
        hasLivingParticles = true

        particle.velocityX += Math.sin(particle.phase + elapsed * 0.0032) * 6 * deltaSeconds
        particle.velocityY -= 3.8 * deltaSeconds
        particle.x += particle.velocityX * deltaSeconds
        particle.y += particle.velocityY * deltaSeconds
        const radius = particle.radius + particle.growth * (age / 1000)
        const fadeIn = Math.min(1, lifeProgress / 0.14)
        const fadeOut = Math.pow(1 - lifeProgress, 1.45)

        context.globalAlpha = particle.opacity * fadeIn * fadeOut
        context.drawImage(
          particle.crimson ? crimsonSprite : paleSprite,
          particle.x - radius,
          particle.y - radius,
          radius * 2,
          radius * 2,
        )
      })

      context.globalAlpha = 1
      context.globalCompositeOperation = 'source-over'
      if (hasLivingParticles) frame = requestAnimationFrame(render)
      else context.clearRect(0, 0, width, height)
    }

    frame = requestAnimationFrame(render)
    window.addEventListener('resize', resize, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      context.clearRect(0, 0, width, height)
    }
  }, [active, originRef])

  return <canvas ref={canvasRef} className="title-mist-canvas" aria-hidden="true" />
}
