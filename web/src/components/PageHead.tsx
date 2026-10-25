import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { IconButton } from './Button'

type Props = {
  title: string
  sub?: string
  onBack: () => void
  onClose: () => void
  children?: ReactNode
}

export function PageHead({ title, sub, onBack, onClose, children }: Props) {
  return (
    <header className="shop-head page-head">
      <button type="button" className="btn btn-outline btn-md back" onClick={onBack}>
        <Icon name="back" size={15} />
        หน้าแรก
      </button>
      <h1>{title}</h1>
      {sub && <span className="page-sub">{sub}</span>}
      <div className="page-tools">{children}</div>
      <IconButton icon="close" label="ปิดร้าน" onClick={onClose} />
    </header>
  )
}
