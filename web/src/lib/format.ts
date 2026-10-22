const shortDate = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' })
const dateTime = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const dateNum = new Intl.DateTimeFormat('th-TH', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

// แปลงตัวเลขเป็นราคา เช่น ฿1,250
export function baht(n: number) {
  return '฿' + n.toLocaleString('en-US')
}

// วันที่แบบสั้น เช่น 31 ต.ค.
export function dateShort(ms: number) {
  return shortDate.format(ms)
}

// วันที่กับเวลา เช่น 31 ต.ค. 10:00
export function dateTimeShort(ms: number) {
  return dateTime.format(ms)
}

// วันที่แบบตัวเลข เช่น 22/10/69 11:24
export function dateNumber(ms: number) {
  return dateNum.format(ms)
}

// ราคามีทศนิยม เช่น ฿695.00
export function bahtFull(n: number) {
  return '฿' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// นับถอยหลังเป็น mm:ss
export function mmss(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0')
}

// นับถอยหลังเป็น hh:mm:ss
export function countdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}
