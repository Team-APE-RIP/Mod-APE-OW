import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { getTitleScale } from '../experience/title'
import { TitleMistCanvas } from './TitleMistCanvas'

interface OpeningTitleProps {
  primary: string
  secondary: string
  opacity: number
  dissolving: boolean
}

export function OpeningTitle({ primary, secondary, opacity, dissolving }: OpeningTitleProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLSpanElement>(null)
  const secondaryRef = useRef<HTMLElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const root = rootRef.current
    const primaryLine = primaryRef.current
    const secondaryLine = secondaryRef.current
    if (!root || !primaryLine || !secondaryLine) return undefined

    const measure = () => {
      const availableWidth = Math.max(1, window.innerWidth * 0.92)
      setScale(getTitleScale([primaryLine.scrollWidth, secondaryLine.scrollWidth], availableWidth))
    }

    measure()
    void document.fonts?.ready.then(measure)
    const observer = new ResizeObserver(measure)
    observer.observe(document.documentElement)
    return () => observer.disconnect()
  }, [primary, secondary])

  return (
    <div className="title-presentation">
      <TitleMistCanvas active={dissolving} originRef={rootRef} />
      <div ref={rootRef} className="title-lockup" style={{ opacity, '--title-scale': scale } as CSSProperties}>
        <div className="title-lockup__inner">
          <span ref={primaryRef}>{primary}</span>
          <em ref={secondaryRef}>{secondary}</em>
        </div>
      </div>
    </div>
  )
}
