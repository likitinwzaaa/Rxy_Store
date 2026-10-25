export function fitScreen() {
  const set = () => {
    const zoom = Math.min(window.innerWidth / 1536, window.innerHeight / 864)
    document.documentElement.style.setProperty('--zoom', zoom.toFixed(3))
  }
  set()
  window.addEventListener('resize', set)
}
