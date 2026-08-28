interface AftermathGalleryProps {
  progress: number
}

const upperImages = Array.from({ length: 10 }, (_, index) => imageUrl(index + 1))
const lowerImages = Array.from({ length: 10 }, (_, index) => imageUrl(index + 11))

function imageUrl(index: number): string {
  return `/assets/aftermath/aftermath-${String(index).padStart(2, '0')}.webp`
}

// eslint-disable-next-line react-refresh/only-export-components
export function getAftermathTrackTravel(progress: number): { upper: string; lower: string } {
  const clampedProgress = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0
  const viewportShare = Number(((1 - clampedProgress) * 100).toFixed(4))
  const trackShare = Number((clampedProgress * 100).toFixed(4))

  return {
    upper: `calc(${viewportShare}vw - ${trackShare}%)`,
    lower: `calc(${trackShare}vw - ${viewportShare}%)`,
  }
}

function ImageTrack({ images, direction, travel }: { images: string[]; direction: 'rtl' | 'ltr'; travel: string }) {
  return (
    <div className={`aftermath-gallery__viewport aftermath-gallery__viewport--${direction}`} aria-hidden="true">
      <div
        className={`aftermath-gallery__track aftermath-gallery__track--${direction}`}
        style={{ transform: `translate3d(${travel}, 0, 0)` }}
      >
        <div className="aftermath-gallery__sequence">
          {images.map((src) => (
            <img className="aftermath-gallery__tile" src={src} alt="" loading="lazy" decoding="async" key={src} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function AftermathGallery({ progress }: AftermathGalleryProps) {
  const travel = getAftermathTrackTravel(progress)

  return (
    <div className="aftermath-gallery" aria-hidden="true">
      <ImageTrack images={upperImages} direction="rtl" travel={travel.upper} />
      <ImageTrack images={lowerImages} direction="ltr" travel={travel.lower} />
    </div>
  )
}
