// คัดลอกข้อความ
export function copyText(text: string) {
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    el.remove()
    if (ok) return
  } catch {}
  navigator.clipboard?.writeText(text).catch(() => {})
}
