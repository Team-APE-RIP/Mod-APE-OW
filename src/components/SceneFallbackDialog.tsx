import { Check, X } from 'lucide-react'

interface SceneFallbackDialogProps {
  copy: {
    title: string
    message: string
    continueLabel: string
    fallbackLabel: string
  }
  onContinue: () => void
  onFallback: () => void
}

export function SceneFallbackDialog({ copy, onContinue, onFallback }: SceneFallbackDialogProps) {
  return (
    <aside
      className="scene-fallback-dialog"
      role="dialog"
      aria-modal="false"
      aria-labelledby="scene-fallback-title"
      aria-describedby="scene-fallback-message"
      aria-live="polite"
      aria-atomic="true"
    >
      <h2 id="scene-fallback-title">{copy.title}</h2>
      <p id="scene-fallback-message">{copy.message}</p>
      <div className="scene-fallback-dialog__actions">
        <button
          type="button"
          className="scene-fallback-dialog__choice scene-fallback-dialog__choice--decline"
          aria-label={copy.continueLabel}
          title={copy.continueLabel}
          onClick={onContinue}
        >
          <X aria-hidden="true" />
        </button>
        <button
          type="button"
          className="scene-fallback-dialog__choice scene-fallback-dialog__choice--accept"
          aria-label={copy.fallbackLabel}
          title={copy.fallbackLabel}
          onClick={onFallback}
        >
          <Check aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
