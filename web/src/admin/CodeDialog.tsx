import { useEffect, useState } from 'react'
import type { DiscountCode } from '../types'
import { Icon } from '../components/Icon'
import { DateTimeField } from '../components/DateTimeField'
import { fromLocalInput, toLocalInput } from '../lib/banner'

type Props = {
  code: DiscountCode | null
  taken: string[]
  onSave: (c: DiscountCode, old: string | null) => void
  onDelete: (code: string) => void
  onCancel: () => void
}

type Form = {
  code: string
  kind: DiscountCode['kind']
  value: string
  limit: string
  perPlayer: boolean
  start: string
  end: string
  enabled: boolean
}

type Errors = Partial<Record<'code' | 'value' | 'limit' | 'end', string>>

function validate(f: Form, taken: string[], old: string | null): Errors {
  const e: Errors = {}
  if (!/^[A-Z0-9_]{3,16}$/.test(f.code)) e.code = 'A-Z, 0-9 หรือ _ ยาว 3 ถึง 16 ตัว'
  else if (f.code !== old && taken.includes(f.code)) e.code = 'มีโค้ดนี้อยู่แล้ว'
  const v = Number(f.value)
  if (!f.value || !(v > 0)) e.value = 'ต้องใส่ส่วนลด'
  else if (f.kind === 'percent' && v > 90) e.value = 'ลดได้สูงสุด 90%'
  if (f.limit && !(Number(f.limit) > 0)) e.limit = 'ต้องมากกว่า 0'
  const start = fromLocalInput(f.start)
  const end = fromLocalInput(f.end)
  if (start && end && end <= start) e.end = 'เวลาหมดต้องหลังเวลาเริ่ม'
  return e
}

export function CodeDialog({ code, taken, onSave, onDelete, onCancel }: Props) {
  const old = code?.code ?? null
  const [form, setForm] = useState<Form>({
    code: code?.code ?? '',
    kind: code?.kind ?? 'percent',
    value: code ? String(code.value) : '',
    limit: code?.limit ? String(code.limit) : '',
    perPlayer: code?.perPlayer ?? false,
    start: toLocalInput(code?.startsAt),
    end: toLocalInput(code?.endsAt),
    enabled: code?.enabled !== false,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [sure, setSure] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('.dtp-pop')) return
      e.stopImmediatePropagation()
      onCancel()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onCancel])

  function update(patch: Partial<Form>) {
    const next = { ...form, ...patch }
    setForm(next)
    if (Object.keys(errors).length) setErrors(validate(next, taken, old))
  }

  function save() {
    const e = validate(form, taken, old)
    setErrors(e)
    if (Object.keys(e).length) return
    onSave(
      {
        code: form.code,
        kind: form.kind,
        value: Number(form.value),
        limit: form.limit ? Number(form.limit) : null,
        perPlayer: form.perPlayer,
        used: code?.used ?? 0,
        startsAt: fromLocalInput(form.start),
        endsAt: fromLocalInput(form.end),
        enabled: form.enabled,
      },
      old,
    )
  }

  const bad = (k: keyof Errors) => (errors[k] ? 'input bad' : 'input')

  return (
    <div className="veil" onMouseDown={onCancel}>
      <div className="modal confirm code-dialog" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="confirm-head">
          <div>
            <h1>{old ? `แก้โค้ด ${old}` : 'เพิ่มโค้ดส่วนลด'}</h1>
            {code && code.used > 0 && <p>ใช้ไปแล้ว {code.used} ครั้ง</p>}
          </div>
        </div>

        <div className="two">
          <div className="field-group">
            <label htmlFor="k-code">
              โค้ด <span className="req">*</span>
            </label>
            <input
              id="k-code"
              className={bad('code') + ' mono'}
              value={form.code}
              maxLength={16}
              autoFocus
              onChange={(e) => update({ code: e.target.value.toUpperCase().replace(/\s/g, '') })}
            />
            {errors.code && <span className="field-err">{errors.code}</span>}
          </div>
          <div className="field-group">
            <label htmlFor="k-value">
              ลด <span className="req">*</span>
            </label>
            <div className="code-value">
              <input
                id="k-value"
                className={bad('value') + ' mono center'}
                inputMode="numeric"
                value={form.value}
                onChange={(e) => update({ value: e.target.value.replace(/\D/g, '').slice(0, 5) })}
              />
              <div className="seg">
                <button type="button" className={form.kind === 'percent' ? 'on' : ''} onClick={() => update({ kind: 'percent' })}>
                  %
                </button>
                <button type="button" className={form.kind === 'fixed' ? 'on' : ''} onClick={() => update({ kind: 'fixed' })}>
                  ฿
                </button>
              </div>
            </div>
            {errors.value && <span className="field-err">{errors.value}</span>}
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="k-limit">
            ใช้ได้ทั้งหมด <span className="opt">เว้นว่าง = ไม่จำกัด</span>
          </label>
          <input
            id="k-limit"
            className={bad('limit') + ' mono'}
            inputMode="numeric"
            value={form.limit}
            placeholder="ไม่จำกัด"
            onChange={(e) => update({ limit: e.target.value.replace(/\D/g, '').slice(0, 6) })}
          />
          {errors.limit && <span className="field-err">{errors.limit}</span>}
        </div>

        <label className="check">
          <input type="checkbox" checked={form.perPlayer} onChange={(e) => update({ perPlayer: e.target.checked })} />
          คนละครั้ง
        </label>

        <div className="two">
          <div className="field-group">
            <label htmlFor="k-start">
              เริ่ม <span className="opt">ไม่บังคับ</span>
            </label>
            <DateTimeField id="k-start" value={form.start} onChange={(v) => update({ start: v })} />
          </div>
          <div className="field-group">
            <label htmlFor="k-end">
              หมด <span className="opt">ไม่บังคับ</span>
            </label>
            <DateTimeField
              id="k-end"
              value={form.end}
              invalid={!!errors.end}
              align="right"
              defaultTime="23:59"
              onChange={(v) => update({ end: v })}
            />
          </div>
        </div>
        {errors.end && <span className="field-err">{errors.end}</span>}

        <label className="check">
          <input type="checkbox" checked={form.enabled} onChange={(e) => update({ enabled: e.target.checked })} />
          เปิดใช้โค้ดนี้
        </label>

        <div className="confirm-foot">
          {old &&
            (sure ? (
              <button type="button" className="ulink danger-link code-del" onClick={() => onDelete(old)}>
                กดอีกครั้งเพื่อลบ
              </button>
            ) : (
              <button type="button" className="trash big code-del" aria-label="ลบโค้ดนี้" onClick={() => setSure(true)}>
                <Icon name="trash" size={17} stroke={1.9} />
              </button>
            ))}
          <button type="button" className="ulink muted" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="button" className="btn btn-solid btn-md" onClick={save}>
            บันทึกโค้ด
          </button>
        </div>
      </div>
    </div>
  )
}
