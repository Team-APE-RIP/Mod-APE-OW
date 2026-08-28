interface AftermathGalleryProps {
  ariaLabel?: string
  className?: string
}

const upperImages = Array.from({ length: 10 }, (_, index) => imageUrl(index + 1))
const lowerImages = Array.from({ length: 10 }, (_, index) => imageUrl(index + 11))

function imageUrl(index: number): string {
  return `/assets/aftermath/aftermath-${String(index).padStart(2, '0')}.webp`
}

function ImageTrack({ images, direction }: { images: string[]; direction: 'rtl' | 'ltr' }) {
  return (
    <div className={`aftermath-gallery__viewport aftermath-gallery__viewport--${direction}`} aria-hidden="true">
      <div className={`aftermath-gallery__track aftermath-gallery__track--${direction}`}>
        {[0, 1].map((copy) => (
          <div className="aftermath-gallery__sequence" key={copy}>
            {images.map((src) => <img className="aftermath-gallery__tile" src={src} alt="" key={`${src}-${copy}`} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AftermathGallery({ ariaLabel = 'Aftermath archive', className = '' }: AftermathGalleryProps) {
  return (
    <section className={`aftermath-gallery ${className}`.trim()} aria-label={ariaLabel}>
      <style>{styles}</style>
      <ImageTrack images={upperImages} direction="rtl" />
      <ImageTrack images={lowerImages} direction="ltr" />
    </section>
  )
}

const styles = `
  .aftermath-gallery {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-rows: 1fr 1fr;
    align-content: space-between;
    gap: clamp(.8rem, 2.2vh, 1.8rem);
    overflow: hidden;
    pointer-events: none;
  }

  .aftermath-gallery__viewport {
    width: 100%;
    overflow: hidden;
  }

  .aftermath-gallery__track {
    display: flex;
    width: max-content;
    height: 100%;
    will-change: transform;
  }

  .aftermath-gallery__sequence {
    --aftermath-gallery-gap: clamp(.5rem, 1vw, 1rem);
    display: flex;
    gap: var(--aftermath-gallery-gap);
    padding-right: var(--aftermath-gallery-gap);
  }

  .aftermath-gallery__tile {
    display: block;
    width: clamp(11rem, 21vw, 25rem);
    height: 100%;
    aspect-ratio: 16 / 9;
    flex: 0 0 auto;
    object-fit: cover;
    filter: grayscale(1) contrast(1.18);
  }

  .aftermath-gallery__track--rtl {
    animation: aftermath-gallery-scroll-rtl 34s linear infinite;
  }

  .aftermath-gallery__track--ltr {
    animation: aftermath-gallery-scroll-ltr 34s linear infinite;
  }

  @keyframes aftermath-gallery-scroll-rtl {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  @keyframes aftermath-gallery-scroll-ltr {
    from { transform: translateX(-50%); }
    to { transform: translateX(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .aftermath-gallery__track { animation: none; }
    .aftermath-gallery__track--ltr { transform: translateX(-25%); }
  }
`
