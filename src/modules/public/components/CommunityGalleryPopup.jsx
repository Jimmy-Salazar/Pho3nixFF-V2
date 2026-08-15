import { useEffect, useRef, useState } from "react"

import "../../../styles/communityGallery.css"

const COMMUNITY_IMAGES = [
  "/images/community/community-01.webp",
  "/images/community/community-02.webp",
  "/images/community/community-03.webp",
  "/images/community/community-04.webp",
  "/images/community/community-05.webp",
]

export default function CommunityGalleryPopup({
  locale = "es",
  title,
  onClose,
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const total = COMMUNITY_IMAGES.length

  const labels =
    locale === "en"
      ? {
          title: title || "PHO3NIX Community",
          close: "Close community gallery",
          previous: "Previous photo",
          next: "Next photo",
          photo: "PHO3NIX community photo",
          counter: "Photo",
        }
      : {
          title: title || "Comunidad PHO3NIX",
          close: "Cerrar galería de comunidad",
          previous: "Foto anterior",
          next: "Foto siguiente",
          photo: "Foto de la comunidad PHO3NIX",
          counter: "Foto",
        }

  const goTo = (index) => {
    const normalized = (index + total) % total
    setActiveIndex(normalized)
  }

  const goPrevious = () => goTo(activeIndex - 1)
  const goNext = () => goTo(activeIndex + 1)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.()
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current - 1 + total) % total)
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % total)
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [onClose, total])

  useEffect(() => {
    if (paused || total <= 1) return undefined

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % total)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [paused, total])

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0]
    if (!touch) return

    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    setPaused(true)
  }

  const handleTouchEnd = (event) => {
    const touch = event.changedTouches?.[0]

    if (
      !touch ||
      touchStartX.current === null ||
      touchStartY.current === null
    ) {
      setPaused(false)
      return
    }

    const deltaX = touch.clientX - touchStartX.current
    const deltaY = touch.clientY - touchStartY.current

    touchStartX.current = null
    touchStartY.current = null

    // Only treat the gesture as a carousel swipe when horizontal movement wins.
    if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        setActiveIndex((current) => (current + 1) % total)
      } else {
        setActiveIndex((current) => (current - 1 + total) % total)
      }
    }

    window.setTimeout(() => setPaused(false), 900)
  }

  return (
    <div
      className="community-gallery-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <section
        className="community-gallery-panel"
        role="dialog"
        aria-modal="true"
        aria-label={labels.title}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <header className="community-gallery-header">
          <div>
            <span>PHO3NIX</span>
            <h2>{labels.title}</h2>
          </div>

          <button
            type="button"
            className="community-gallery-close"
            onClick={onClose}
            aria-label={labels.close}
          >
            ×
          </button>
        </header>

        <div
          className="community-gallery-viewport"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="community-gallery-track"
            style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
          >
            {COMMUNITY_IMAGES.map((src, index) => (
              <figure
                key={src}
                className="community-gallery-slide"
                aria-hidden={activeIndex !== index}
              >
                <img
                  src={src}
                  alt={`${labels.photo} ${index + 1}`}
                  draggable="false"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </figure>
            ))}
          </div>

          <button
            type="button"
            className="community-gallery-arrow community-gallery-arrow-left"
            onClick={goPrevious}
            aria-label={labels.previous}
          >
            ‹
          </button>

          <button
            type="button"
            className="community-gallery-arrow community-gallery-arrow-right"
            onClick={goNext}
            aria-label={labels.next}
          >
            ›
          </button>
        </div>

        <footer className="community-gallery-footer">
          <div
            className="community-gallery-dots"
            aria-label={`${labels.counter} ${activeIndex + 1} / ${total}`}
          >
            {COMMUNITY_IMAGES.map((src, index) => (
              <button
                key={src}
                type="button"
                className={index === activeIndex ? "is-active" : ""}
                onClick={() => goTo(index)}
                aria-label={`${labels.counter} ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>

          <span className="community-gallery-counter">
            {activeIndex + 1} / {total}
          </span>
        </footer>
      </section>
    </div>
  )
}
