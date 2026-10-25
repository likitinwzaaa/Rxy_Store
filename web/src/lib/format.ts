const shortDate = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' })
const dateTime = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const dateNum = new Intl.DateTimeFormat('th-TH', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export function baht(n: number) {
  return '฿' + n.toLocaleString('en-US')
}

export function dateShort(ms: number) {
  return shortDate.format(ms)
}

export function dateTimeShort(ms: number) {
  return dateTime.format(ms)
}

export function dateNumber(ms: number) {
  return dateNum.format(ms)
}

export function bahtFull(n: number) {
  return '฿' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function mmss(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0')
}

export function countdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}
