import { useMemo } from 'react'
import { safeImage } from '../lib/product'
import { bahtFull } from '../lib/format'

type Props = {
  shopName: string
  orderId: string
  total: number
  qr?: string | null
  expired?: boolean
}

// รูป QR จาก server ต้องเป็น https หรือ data:image เท่านั้น
function qrSource(src?: string | null) {
  if (!src) return null
  if (/^data:image\/(png|svg\+xml);base64,[a-z0-9+/=]+$/i.test(src)) return src
  return safeImage(src)
}

// ลาย QR ปลอมไว้โชว์ตอนยังไม่ได้ต่อ server
function fakeQr(seed: string) {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const cells: [number, number][] = []
  for (let y = 0; y < 25; y++) {
    for (let x = 0; x < 25; x++) {
      const finder = (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16)
      if (finder) continue
      h = (h * 1103515245 + 12345) >>> 0
      if (h & 0x10000) cells.push([x, y])
    }
  }
  return cells
}

// การ์ด QR แบบตั๋ว
export function QrCard({ shopName, orderId, total, qr, expired }: Props) {
  const src = qrSource(qr)
  const cells = useMemo(() => (src ? [] : fakeQr(orderId)), [src, orderId])
  const finders = [
    [0, 0],
    [18, 0],
    [0, 18],
  ]

  return (
    <div className={expired ? 'qr-card expired' : 'qr-card'}>
      <div className="qr-top">
        <span>{shopName}</span>
        <span className="qr-pill">PROMPTPAY</span>
      </div>

      <div className="qr-box">
        <div className="qr-img">
          {src ? (
            <img src={src} alt="QR PromptPay" draggable={false} />
          ) : (
            <svg viewBox="0 0 25 25" shapeRendering="crispEdges" aria-label="QR ตัวอย่าง">
              {cells.map(([x, y]) => (
                <rect key={x + '-' + y} x={x} y={y} width="1" height="1" />
              ))}
              {finders.map(([x, y]) => (
                <g key={x + '-' + y}>
                  <rect x={x} y={y} width="7" height="7" />
                  <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
                  <rect x={x + 2} y={y + 2} width="3" height="3" />
                </g>
              ))}
            </svg>
          )}
          <span className="qr-logo">{shopName.charAt(0)}</span>
        </div>

        {!expired && (
          <>
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            <span className="scan" />
          </>
        )}

        {expired && (
          <div className="qr-veil">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <b>QR นี้หมดเวลาแล้ว</b>
            <span>ห้ามสแกนจ่าย</span>
          </div>
        )}
      </div>

      <div className="qr-ticket">
        <span className="notch left" />
        <span className="notch right" />
        <div>
          <span className="qr-label">ยอดชำระ</span>
          <span className="qr-total mono">{bahtFull(total)}</span>
        </div>
        <span className="qr-id mono">{orderId}</span>
      </div>
    </div>
  )
}
