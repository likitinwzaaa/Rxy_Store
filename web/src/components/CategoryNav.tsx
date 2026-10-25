export type NavItem = {
  id: string
  name: string
  count: number
}

type Props = {
  items: NavItem[]
  active: string
  onSelect: (id: string) => void
}

// รายการหมวดด้านซ้าย
export function CategoryNav({ items, active, onSelect }: Props) {
  return (
    <nav className="cats" aria-label="หมวดสินค้า">
      {items.map((c) => (
        <button
          key={c.id}
          type="button"
          className={c.id === active ? 'cat on' : 'cat'}
          aria-current={c.id === active ? 'page' : undefined}
          onClick={() => onSelect(c.id)}
        >
          <span className="cat-name">{c.name}</span>
          <span className="mono">{c.count}</span>
        </button>
      ))}
    </nav>
  )
}
