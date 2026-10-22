import { useEffect, useState } from 'react'
import { useNuiEvent } from './hooks/useNuiEvent'
import { fetchNui, isBrowser } from './lib/nui'

// หน้าหลักของร้าน
export default function App() {
  const [visible, setVisible] = useState(isBrowser)

  useNuiEvent<boolean>('setVisible', setVisible)

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  // ปิดร้าน
  function close() {
    setVisible(false)
    fetchNui('close')
  }

  if (!visible) return null

  return (
    <div className="shop">
      <header className="shop-head">
        <span className="shop-name">RXY STORE</span>
        <button className="icon-btn" onClick={close} aria-label="ปิดร้าน">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <main className="shop-body" />
    </div>
  )
}
