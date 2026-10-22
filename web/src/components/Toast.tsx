import { useEffect } from 'react'
import { Icon } from './Icon'

export type ToastData = {
  key: number
  title: string
  detail?: string
  tone?: 'ok' | 'warn'
  action?: { label: string; onClick: () => void }
}

type Props = {
  toast: ToastData | null
  onDone: () => void
}

// แจ้งเตือนมุมขวาล่าง หายเองใน 3 วิ
export function Toast({ toast, onDone }: Props) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [toast, onDone])

  if (!toast) return null

  return (
    <div key={toast.key} className={toast.tone === 'warn' ? 'toast warn' : 'toast'} role="status">
      <Icon name={toast.tone === 'warn' ? 'close' : 'check'} size={18} stroke={2.4} />
      <div className="toast-text">
        <b>{toast.title}</b>
        {toast.detail && <span>{toast.detail}</span>}
      </div>
      {toast.action && (
        <button type="button" className="toast-action" onClick={toast.action.onClick}>
          {toast.action.label}
        </button>
      )}
    </div>
  )
}
