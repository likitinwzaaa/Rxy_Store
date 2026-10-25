import { Button } from './Button'

type Props = {
  slow?: boolean
  error?: string | null
  onRetry: () => void
  onClose: () => void
}

export function Waiting({ slow, error, onRetry, onClose }: Props) {
  if (!slow && !error) {
    return (
      <div className="waiting" role="status">
        <p>
          กรุณารอสักครู่<span className="wait-dots" />
        </p>
      </div>
    )
  }

  return (
    <div className="waiting" role="alert">
      <p>{error ?? 'เซิร์ฟตอบช้า ลองใหม่อีกครั้ง'}</p>
      <div className="waiting-actions">
        <button type="button" className="ulink muted" onClick={onClose}>
          ปิด
        </button>
        <Button variant="solid" onClick={onRetry}>
          ลองใหม่
        </Button>
      </div>
    </div>
  )
}
