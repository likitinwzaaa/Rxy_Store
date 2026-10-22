import { useEffect } from 'react'
import type { Notice } from '../types'

type Props = {
  notice: Notice
  shopName: string
  openKey: string
  onDone: () => void
}

const SHOW_MS = 8000

// แจ้งเตือนมุมขวาบนของจอ โชว์ตอนร้านปิดอยู่
export function GameToast({ notice, shopName, openKey, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, SHOW_MS + 450)
    return () => clearTimeout(t)
  }, [notice.key, onDone])

  return (
    <div key={notice.key} className="game-toast" role="status">
      <div className="gt-body">
        <div className="gt-head">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M7.5 12.5l3 3 6-6.5" />
          </svg>
          <b>{notice.title}</b>
          <span>{shopName}</span>
        </div>
        {notice.lines.length > 0 && (
          <div className="gt-lines">
            {notice.lines.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        )}
        {notice.footer && (
          <div className="gt-foot">
            <span>{notice.footer}</span>
            <kbd className="mono">{openKey}</kbd>
          </div>
        )}
      </div>
      <div className="gt-track">
        <div style={{ animationDuration: SHOW_MS + 'ms' }} />
      </div>
    </div>
  )
}
