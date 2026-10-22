export const categoryIcons = {
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  box: 'M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5zM3.5 7.5 12 12l8.5-4.5M12 12v9',
  car: 'M3 13l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v4H3zM3 13h18M7 17v2M17 17v2',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v10M14.5 9.5h-3.5a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 1 0 3H9.5',
  gift: 'M3.5 8.5h17v4h-17zM5 12.5v8h14v-8M12 8.5v12M12 8.5C10.5 5 7 4.5 7 6.8 7 8.5 12 8.5 12 8.5zM12 8.5c1.5-3.5 5-4 5-1.7 0 1.7-5 1.7-5 1.7z',
  shirt: 'M8 3L3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z',
  blade: 'M4 20l5-5M9 15l11-12-2 8-6 7zM6.5 13.5l4 4',
  home: 'M3 11l9-7 9 7v9H3zM9 20v-6h6v6',
  fire: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1.5 1 2 2 2 3 1-2 1-5 1-7z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.5M18 20a6 6 0 0 0-3-5.2',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
}

export type CategoryIconName = keyof typeof categoryIcons

// ไอคอนของหมวดสินค้า
export function CategoryIcon({ name, size = 18 }: { name: string; size?: number }) {
  const d = categoryIcons[name as CategoryIconName] ?? categoryIcons.box
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
