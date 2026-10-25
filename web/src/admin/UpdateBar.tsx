import { useState } from 'react'
import type { UpdateInfo } from '../types'
import { Icon } from '../components/Icon'

type Props = {
  info: UpdateInfo
  onSkip: () => void
  onHide: () => void
}

export function UpdateBar({ info, onSkip, onHide }: Props) {
  const [open, setOpen] = useState(info.security)

  return (
    <div className={info.security ? 'update-bar danger' : 'update-bar'} role="status">
      <div className="update-line">
        <i className={info.security ? 'pulse-dot' : undefined} />
        <span>
          {info.security ? 'อัปเดตแก้ช่องโหว่ ' : 'มีเวอร์ชันใหม่ '}
          <b className="mono">v{info.latest}</b>
          <span className="update-now mono"> · ตอนนี้ v{info.current}</span>
        </span>
        <button type="button" className="ulink small" onClick={() => setOpen(!open)}>
          {open ? 'ซ่อน' : 'มีอะไรใหม่'}
        </button>
        {!info.security && (
          <>
            <button type="button" className="ulink small" onClick={onSkip}>
              ข้ามเวอร์ชันนี้
            </button>
            <button type="button" className="update-x" aria-label="ปิดแถบนี้" onClick={onHide}>
              <Icon name="close" size={14} />
            </button>
          </>
        )}
      </div>
      {open && (
        <div className="update-body drop-in">
          <ul>
            {info.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <span>
            โหลด zip จากหน้า Releases ของ GitHub แล้ววางทับโฟลเดอร์เดิม ไม่ต้องทับ config.lua
            {info.security && ' ข้ามไม่ได้ ควรอัปเดตให้เร็วที่สุด'}
          </span>
        </div>
      )}
    </div>
  )
}
