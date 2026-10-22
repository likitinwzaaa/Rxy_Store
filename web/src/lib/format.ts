const shortDate = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' })

// แปลงตัวเลขเป็นราคา เช่น ฿1,250
export function baht(n: number) {
  return '฿' + n.toLocaleString('en-US')
}

// วันที่แบบสั้น เช่น 31 ต.ค.
export function dateShort(ms: number) {
  return shortDate.format(ms)
}
