import { useEffect, useState } from 'react'
import type { Banner } from '../types'
import { safeImage } from '../lib/product'
import { Icon } from './Icon'

type Props = {
  banners: Banner[]
  interval?: number
  onOpen: (b: Banner) => void
}

export function BannerSlider({ banners, interval = 5000, onOpen }: Props) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = banners.length

  useEffect(() => {
    if (paused || count < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), interval)
    return () => clearInterval(t)
  }, [paused, count, interval, index])

  if (count === 0) return null

  const go = (step: number) => setIndex((i) => (i + step + count) % count)

  return (
    <section
      className="banner"
      aria-label="แบนเนอร์โปรโมชัน"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((b, i) => {
        const img = safeImage(b.image)
        return (
          <button
            key={b.id}
            type="button"
            className={i === index ? 'slide on' : 'slide'}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            style={{ cursor: b.link.kind === 'none' ? 'default' : 'pointer' }}
            onClick={() => onOpen(b)}
          >
            {img ? <img src={img} alt={b.label} draggable={false} /> : <span className="slide-ph">{b.label}</span>}
          </button>
        )
      })}

      {count > 1 && (
        <>
          <button type="button" className="slide-nav prev" aria-label="แบนเนอร์ก่อนหน้า" onClick={() => go(-1)}>
            <Icon name="back" size={14} stroke={2.2} />
          </button>
          <button type="button" className="slide-nav next" aria-label="แบนเนอร์ถัดไป" onClick={() => go(1)}>
            <Icon name="next" size={14} stroke={2.2} />
          </button>
          <div className="dots">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                className={i === index ? 'dot on' : 'dot'}
                aria-label={`แบนเนอร์ที่ ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
