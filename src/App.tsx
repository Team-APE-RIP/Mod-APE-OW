import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AftermathGallery } from './components/AftermathGallery'
import { SceneBackdrop } from './components/SceneBackdrop'
import { SceneFallbackDialog } from './components/SceneFallbackDialog'
import { OpeningTitle } from './components/OpeningTitle'
import { StoryText } from './components/StoryText'
import { getRuntimePlatformUrls } from './config/runtime'
import { playTheme } from './experience/audio'
import { firstInteractionEvents, isExperienceStartClick } from './experience/input'
import {
  acceptSceneFallback,
  createSceneFallbackState,
  dismissSceneFallback,
  requestSceneFallback,
  shouldRestartSceneLoad,
  type SceneFallbackPrompt,
} from './experience/sceneFallback'
import { initializeLocale } from './i18n'
import { getActiveLine } from './story/sequence'
import { getStoryState } from './story/progress'
import './styles.css'

const audioUrl = '/assets/audio/main-theme.ogg'
const bootFadeDurationMs = 1_450
const platformLinks = [
  { key: 'github', icon: '/assets/platforms/github.svg', color: '#181717' },
  { key: 'discord', icon: '/assets/platforms/discord.svg', color: '#5865f2' },
  { key: 'qq', icon: '/assets/platforms/qq.svg', color: '#1ebafc' },
  { key: 'bilibili', icon: '/assets/platforms/bilibili.svg', color: '#00a1d6' },
  { key: 'x', icon: '/assets/platforms/x.svg', color: '#000000' },
] as const

function App() {
  const { language, locale } = useMemo(() => initializeLocale(), [])
  const platformUrls = useMemo(() => getRuntimePlatformUrls(), [])
  const [progress, setProgress] = useState(0)
  const [started, setStarted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [entryReady, setEntryReady] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [sceneAttempt, setSceneAttempt] = useState(0)
  const [fallbackState, setFallbackState] = useState(createSceneFallbackState)
  const handleSceneReady = useCallback(() => setSceneReady(true), [])
  const handleFallbackSuggested = useCallback((reason: SceneFallbackPrompt) => {
    setFallbackState((current) => requestSceneFallback(current, reason))
  }, [])
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
      if (!entryReady || !isExperienceStartClick(event)) return
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
  const footerOnLight = state.explosion > 0.01 || state.aftermathOpacity > 0.01
  const fallbackPrompt = fallbackState.prompt
  const fallbackMessage = fallbackPrompt ? locale.scene_fallback[fallbackPrompt] : ''
  const continueGaussianLoad = () => {
    if (shouldRestartSceneLoad(fallbackPrompt)) {
      setSceneReady(false)
      setEntryReady(false)
      setLoadProgress(0)
      setSceneAttempt((attempt) => attempt + 1)
    }
    setFallbackState(dismissSceneFallback)
  }
  const useImageFallback = () => {
    setSceneReady(false)
    setEntryReady(false)
    setLoadProgress(0)
    setFallbackState(acceptSceneFallback)
  }

  return (
    <main className={`story-shell ${started ? 'is-started' : ''} ${sceneReady ? 'is-ready' : ''} ${state.explosion > 0 ? 'is-impact' : ''} ${footerOnLight ? 'is-footer-on-light' : ''}`}>
      <div className="story-stage">
        <SceneBackdrop
          key={sceneAttempt}
          progress={progress}
          activeScene={scene}
          ariaLabel={locale.accessibility.scene}
          renderMode={fallbackState.mode}
          onLoadProgress={setLoadProgress}
          onReady={handleSceneReady}
          onFallbackSuggested={handleFallbackSuggested}
        />
        <div className="boot-mask" aria-hidden={sceneReady}>
          <div className="boot-meter" style={{ '--load-progress': loadProgress } as React.CSSProperties}><span /></div>
        </div>
        <div className="stage-vignette" />
        <div className="explosion-wash" style={{ opacity: state.explosion }} />
        <div className="afterimage" style={{ opacity: state.aftermathOpacity }} aria-hidden={!aftermathVisible}>
          <AftermathGallery progress={state.aftermathProgress} />
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
                href={platformUrls[platform.key]}
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
        <footer className="site-footer">{locale.footer.copyright}</footer>
        {fallbackPrompt && (
          <SceneFallbackDialog
            copy={{
              title: locale.scene_fallback.title,
              message: fallbackMessage,
              continueLabel: locale.scene_fallback.continue_waiting,
              fallbackLabel: locale.scene_fallback.use_images,
            }}
            onContinue={continueGaussianLoad}
            onFallback={useImageFallback}
          />
        )}
      </div>
      <div className="scroll-spacer" />
    </main>
  )
}

export default App
