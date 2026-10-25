import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

type Props = {
  id?: string
  value: string
  onChange: (v: string) => void
  invalid?: boolean
  align?: 'left' | 'right'
  defaultTime?: string
}

const months = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]
const weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const pad = (n: number) => String(n).padStart(2, '0')

function parse(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v)
  if (!m) return null
  return { y: +m[1], mo: +m[2] - 1, d: +m[3], h: +m[4], mi: +m[5] }
}

function build(y: number, mo: number, d: number, h: number, mi: number) {
  return `${y}-${pad(mo + 1)}-${pad(d)}T${pad(h)}:${pad(mi)}`
}

export function DateTimeField({ id, value, onChange, invalid, align = 'left', defaultTime = '00:00' }: Props) {
  const v = parse(value)
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const [view, setView] = useState({ y: v?.y ?? today.getFullYear(), mo: v?.mo ?? today.getMonth() })
  const [hh, setHh] = useState(pad(v?.h ?? +defaultTime.slice(0, 2)))
  const [mm, setMm] = useState(pad(v?.mi ?? +defaultTime.slice(3, 5)))
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    const field = box.current?.getBoundingClientRect()
    const shop = box.current?.closest('.shop')?.getBoundingClientRect()
    if (field && shop) setUp(shop.bottom - field.bottom < (shop.height * 300) / 720 && field.top - shop.top > shop.bottom - field.bottom)
    if (v) setView({ y: v.y, mo: v.mo })
    setOpen(true)
  }

  function pick(d: number) {
    onChange(build(view.y, view.mo, d, Math.min(23, +hh || 0), Math.min(59, +mm || 0)))
  }

  function setTime(h: string, mi: string) {
    setHh(h)
    setMm(mi)
    if (v && h.length === 2 && mi.length === 2 && +h < 24 && +mi < 60) onChange(build(v.y, v.mo, v.d, +h, +mi))
  }

  function shift(step: number) {
    const mo = view.mo + step
    setView({ y: view.y + Math.floor(mo / 12), mo: ((mo % 12) + 12) % 12 })
  }

  const first = new Date(view.y, view.mo, 1).getDay()
  const days = new Date(view.y, view.mo + 1, 0).getDate()
  const cells = [...Array(first).fill(0), ...Array.from({ length: days }, (_, i) => i + 1)]
  const isToday = (d: number) =>
    d === today.getDate() && view.mo === today.getMonth() && view.y === today.getFullYear()
  const isPicked = (d: number) => !!v && d === v.d && view.mo === v.mo && view.y === v.y

  return (
    <div className="dtp" ref={box}>
      <button
        id={id}
        type="button"
        className={'input dtp-field' + (invalid ? ' bad' : '') + (open ? ' focus' : '')}
        onClick={toggle}
      >
        <span className={v ? 'mono' : 'dtp-empty'}>
          {v ? `${pad(v.d)}/${pad(v.mo + 1)}/${v.y + 543} ${pad(v.h)}:${pad(v.mi)}` : 'ไม่กำหนด'}
        </span>
        <Icon name="clock" size={14} />
      </button>

      {open && (
        <div className={'dtp-pop ' + align + (up ? ' up' : '')} role="dialog" aria-label="เลือกวันเวลา">
          <div className="dtp-head">
            <button type="button" aria-label="เดือนก่อน" onClick={() => shift(-1)}>
              <Icon name="back" size={14} stroke={2.2} />
            </button>
            <b>
              {months[view.mo]} {view.y + 543}
            </b>
            <button type="button" aria-label="เดือนถัดไป" onClick={() => shift(1)}>
              <Icon name="next" size={14} stroke={2.2} />
            </button>
          </div>
          <div className="dtp-grid">
            {weekdays.map((w) => (
              <span key={w} className="dtp-wd">
                {w}
              </span>
            ))}
            {cells.map((d, i) =>
              d ? (
                <button
                  key={i}
                  type="button"
                  className={'dtp-day' + (isPicked(d) ? ' on' : '') + (isToday(d) ? ' today' : '')}
                  onClick={() => pick(d)}
                >
                  {d}
                </button>
              ) : (
                <span key={i} />
              ),
            )}
          </div>
          <div className="dtp-foot">
            <span className="dtp-time">
              เวลา
              <input
                className="input mono tiny"
                inputMode="numeric"
                value={hh}
                aria-label="ชั่วโมง"
                onChange={(e) => setTime(e.target.value.replace(/\D/g, '').slice(0, 2), mm)}
                onBlur={() => setTime(pad(Math.min(23, +hh || 0)), mm)}
              />
              :
              <input
                className="input mono tiny"
                inputMode="numeric"
                value={mm}
                aria-label="นาที"
                onChange={(e) => setTime(hh, e.target.value.replace(/\D/g, '').slice(0, 2))}
                onBlur={() => setTime(hh, pad(Math.min(59, +mm || 0)))}
              />
            </span>
            <button
              type="button"
              className="ulink small"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              ไม่กำหนด
            </button>
            <button type="button" className="btn btn-solid btn-sm" onClick={() => setOpen(false)}>
              เสร็จ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
