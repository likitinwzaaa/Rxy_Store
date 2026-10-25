import { useState, type KeyboardEvent } from 'react'
import type { Product } from '../types'
import { baht } from '../lib/format'
import { Icon } from './Icon'

type Props = {
  products: Product[]
  categoryName: (id: string) => string
  onPick: (p: Product) => void
  onShowAll: (q: string) => void
}

function split(name: string, needle: string) {
  const at = name.toLowerCase().indexOf(needle)
  return [name.slice(0, at), name.slice(at, at + needle.length), name.slice(at + needle.length)]
}

export function SearchBox({ products, categoryName, onPick, onShowAll }: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const needle = q.trim().toLowerCase()
  const hits = needle ? products.filter((p) => p.name.toLowerCase().includes(needle)) : []

  function pick(p: Product) {
    setOpen(false)
    setQ('')
    onPick(p)
  }

  function showAll() {
    if (!needle) return
    setOpen(false)
    onShowAll(q.trim())
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') showAll()
    if (e.key === 'Escape' && (open || q)) {
      e.stopPropagation()
      setQ('')
      setOpen(false)
    }
  }

  return (
    <div className="search">
      <label className="search-field">
        <Icon name="search" size={15} />
        <input
          type="text"
          value={q}
          placeholder="ค้นหาสินค้า"
          aria-label="ค้นหาสินค้า"
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
        />
      </label>

      {open && needle && (
        <div className="search-drop" role="listbox">
          {hits.slice(0, 3).map((p) => {
            const [pre, hit, post] = split(p.name, needle)
            return (
              <div key={p.id} className="sug" role="option" aria-selected="false" onMouseDown={() => pick(p)}>
                <div className="sug-shot" />
                <span className="sug-name">
                  {pre}
                  <b>{hit}</b>
                  {post}
                </span>
                <span className="sug-cat">{categoryName(p.category)}</span>
                <span className="sug-price mono">{baht(p.price)}</span>
              </div>
            )
          })}

          {hits.length === 0 && <div className="sug-empty">ไม่เจอสินค้าที่มีคำว่า "{q.trim()}"</div>}

          {hits.length > 3 && (
            <div className="sug-more">
              <span>เจอ {hits.length} รายการ</span>
              <button type="button" className="ulink" onMouseDown={showAll}>
                ดูทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
