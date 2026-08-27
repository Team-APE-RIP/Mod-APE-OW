import type { Locale } from '../i18n'

interface StoryTextProps {
  locale: Locale
  loreProgress: number
  loreOpacity: number
  ruinsProgress: number
  ruinsOpacity: number
}

function visibleLines(lines: string[], progress: number, windowSize: number): string[] {
  if (progress <= 0) return []
  const count = Math.min(lines.length, Math.ceil(progress * (lines.length + windowSize)))
  return lines.slice(0, count)
}

export function StoryText({ locale, loreProgress, loreOpacity, ruinsProgress, ruinsOpacity }: StoryTextProps) {
  const loreLines = visibleLines(locale.lore.lines, loreProgress, 0.4)
  const ruinsLines = visibleLines(locale.ruins.lines, ruinsProgress, 0.25)

  return (
    <div className="story-copy">
      <section className={`copy-layer copy-layer--lore ${loreLines.length ? 'is-visible' : ''}`} style={{ opacity: loreOpacity }} aria-hidden={loreOpacity < 0.02}>
        {loreLines.map((line, index) => <p className={index % 2 === 0 ? 'copy-line--left' : 'copy-line--right'} key={`${index}-${line}`}>{line}</p>)}
      </section>
      <section className={`copy-layer copy-layer--ruins ${ruinsLines.length ? 'is-visible' : ''}`} style={{ opacity: ruinsOpacity }} aria-hidden={ruinsOpacity < 0.02}>
        {ruinsLines.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}
      </section>
    </div>
  )
}
