// ขยายหน้าร้านตามขนาดจอ จอ 1920x1080 ร้านจะกว้าง 1400
export function fitScreen() {
  const set = () => {
    const zoom = Math.min(window.innerWidth / 1536, window.innerHeight / 864)
    document.documentElement.style.setProperty('--zoom', zoom.toFixed(3))
  }
  set()
  window.addEventListener('resize', set)
}
