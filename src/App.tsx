import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { SceneBackdrop } from './components/SceneBackdrop'
import { OpeningTitle } from './components/OpeningTitle'
import { StoryText } from './components/StoryText'
import { playTheme } from './experience/audio'
import { firstInteractionEvents, isPrimaryMouseClick } from './experience/input'
import { initializeLocale } from './i18n'
import { getActiveLine } from './story/sequence'
import { getStoryState } from './story/progress'
import './styles.css'

const audioUrl = '/assets/audio/main-theme.ogg'
const bootFadeDurationMs = 1_450
const platformLinks = [
  { key: 'github', href: 'https://github.com/Team-APE-RIP/APE', icon: '/assets/platforms/github.svg', color: '#181717' },
  { key: 'discord', href: 'https://discord.gg/TaNYDC6kfJ', icon: '/assets/platforms/discord.svg', color: '#5865f2' },
  { key: 'qq', href: 'https://pd.qq.com/s/clcwlblcm?b=5', icon: '/assets/platforms/qq.svg', color: '#1ebafc' },
  { key: 'bilibili', href: 'https://space.bilibili.com/1220845388', icon: '/assets/platforms/bilibili.svg', color: '#00a1d6' },
  { key: 'x', href: 'https://x.com/TeamAPEOfficial', icon: '/assets/platforms/x.svg', color: '#000000' },
] as const

function App() {
  const { language, locale } = useMemo(() => initializeLocale(), [])
  const [progress, setProgress] = useState(0)
  const [started, setStarted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [entryReady, setEntryReady] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const handleSceneReady = useCallback(() => setSceneReady(true), [])
  const state = getStoryState(progress)

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    setProgress(0)

    return () => {
      window.history.scrollRestoration = previousRestoration
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.title = locale.meta.title
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!description) {
      description = document.createElement('meta')
      description.name = 'description'
      document.head.appendChild(description)
    }
    description.content = locale.meta.description
  }, [language, locale])

  useEffect(() => {
    if (!sceneReady) return undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => setEntryReady(true), reducedMotion ? 0 : bootFadeDurationMs)
    return () => window.clearTimeout(timer)
  }, [sceneReady])

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      setProgress(window.scrollY / max)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('experience-locked', !started)

    return () => {
      root.classList.remove('experience-locked')
    }
  }, [started])

  const start = useCallback(() => {
    setStarted(true)
    const audio = audioRef.current
    if (audio?.paused) {
      void playTheme(audio, false)
    }
  }, [])

  useEffect(() => {
    if (started) return undefined
    const onFirstInteraction = (event: Event) => {
      if (!entryReady || !isPrimaryMouseClick(event)) return
      start()
    }
    const preventScroll = (event: Event) => {
      if (event instanceof KeyboardEvent && ![' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
    }
    firstInteractionEvents.forEach((eventName) => window.addEventListener(eventName, onFirstInteraction, { passive: true }))
    window.addEventListener('wheel', preventScroll, { passive: false })
    window.addEventListener('touchmove', preventScroll, { passive: false })
    window.addEventListener('keydown', preventScroll, { passive: false })
    return () => {
      firstInteractionEvents.forEach((eventName) => window.removeEventListener(eventName, onFirstInteraction))
      window.removeEventListener('wheel', preventScroll)
      window.removeEventListener('touchmove', preventScroll)
      window.removeEventListener('keydown', preventScroll)
    }
  }, [entryReady, start, started])

  const scene = progress >= 0.66 ? 'ruins' : 'opening'
  const aftermathLine = getActiveLine(locale.aftermath.lines, state.aftermathProgress)
  const aftermathVisible = state.aftermathOpacity > 0.015
  const finaleVisible = state.finaleOpacity > 0.015

  return (
    <main className={`story-shell ${started ? 'is-started' : ''} ${sceneReady ? 'is-ready' : ''} ${state.explosion > 0 ? 'is-impact' : ''}`}>
      <div className="story-stage">
        <SceneBackdrop progress={progress} activeScene={scene} ariaLabel={locale.accessibility.scene} onLoadProgress={setLoadProgress} onReady={handleSceneReady} />
        <div className="boot-mask" aria-hidden={sceneReady}>
          <div className="boot-meter" style={{ '--load-progress': loadProgress } as React.CSSProperties}><span /></div>
        </div>
        <div className="stage-vignette" />
        <div className="explosion-wash" style={{ opacity: state.explosion }} />
        <div className="afterimage" style={{ opacity: state.aftermathOpacity }} aria-hidden={!aftermathVisible}>
          <div className="afterimage-strip afterimage-strip--top" />
          <div className="afterimage-strip afterimage-strip--bottom" />
          {aftermathLine && <p key={aftermathLine}>{aftermathLine}</p>}
        </div>
        <OpeningTitle primary={locale.opening.primary} secondary={locale.opening.secondary} opacity={started ? state.titleOpacity : 1} dissolving={started} />
        <StoryText locale={locale} loreProgress={state.loreProgress} loreOpacity={state.loreOpacity} ruinsProgress={state.ruinsProgress} ruinsOpacity={state.ruinsTextOpacity} />
        <div className={`finale ${finaleVisible ? 'is-visible' : ''}`} style={{ opacity: state.finaleOpacity }} aria-hidden={!finaleVisible}>
          <img className="finale-emblem" src="/assets/branding/mod-emblem.webp" alt={locale.accessibility.logo} />
          <p className="finale-heading">{locale.finale.line_one}</p>
          <nav className="platform-links" aria-label={locale.accessibility.platforms}>
            {platformLinks.map((platform) => (
              <a
                className="platform-link"
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={locale.platforms[platform.key]}
                tabIndex={finaleVisible ? 0 : -1}
                key={platform.key}
              >
                <span
                  className="platform-icon"
                  aria-hidden="true"
                  style={{ '--platform-color': platform.color, '--platform-icon': `url("${platform.icon}")` } as React.CSSProperties}
                />
              </a>
            ))}
          </nav>
          <p className="finale-next">{locale.finale.line_two}</p>
        </div>
        <audio ref={audioRef} src={audioUrl} preload="auto" loop />
      </div>
      <div className="scroll-spacer" />
    </main>
  )
}

export default App
