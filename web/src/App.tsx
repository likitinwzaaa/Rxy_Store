import { useEffect, useState } from 'react'
import { useNuiEvent } from './hooks/useNuiEvent'
import { fetchNui, isBrowser } from './lib/nui'
import { applyTheme, type Theme } from './lib/theme'
import { IconButton } from './components/Button'

if (isBrowser) applyTheme({ primary: '#FF7A1A' })

// หน้าหลักของร้าน
export default function App() {
  const [visible, setVisible] = useState(isBrowser)

  useNuiEvent<boolean>('setVisible', setVisible)
  useNuiEvent<Theme>('setTheme', applyTheme)

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
        <IconButton icon="gift" label="กล่องรับของ" />
        <IconButton icon="cart" label="ตะกร้า" />
        <IconButton icon="close" label="ปิดร้าน" onClick={close} />
      </header>
      <main className="shop-body" />
    </div>
  )
}
