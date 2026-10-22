import { useEffect, type ReactNode } from 'react'

type Props = {
  title: ReactNode
  desc?: ReactNode
  confirmLabel: string
  danger?: boolean
  disabled?: boolean
  children?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

// หน้าต่างยืนยันก่อนทำอะไรที่ย้อนไม่ได้
export function ConfirmDialog({ title, desc, confirmLabel, danger, disabled, children, onConfirm, onCancel }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      onCancel()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onCancel])

  return (
    <div className="veil" onMouseDown={onCancel}>
      <div className="modal confirm" role="alertdialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="confirm-head">
          {danger && (
            <span className="confirm-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l9.5 17h-19z" />
                <path d="M12 10v4M12 17.5h.01" />
              </svg>
            </span>
          )}
          <div>
            <h1>{title}</h1>
            {desc && <p>{desc}</p>}
          </div>
        </div>
        {children}
        <div className="confirm-foot">
          <button type="button" className="ulink muted" onClick={onCancel}>
            ยกเลิก
          </button>
          <button
            type="button"
            className={danger ? 'btn btn-danger btn-md' : 'btn btn-solid btn-md'}
            disabled={disabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
