import { useEffect, useState } from 'react'
import type { Category, DiscountCode, Product } from '../types'
import { Icon } from '../components/Icon'
import { DateTimeField } from '../components/DateTimeField'
import { fromLocalInput, toLocalInput } from '../lib/banner'
import type { Run } from './AdminApp'

type Props = {
  code: DiscountCode | null
  taken: string[]
  categories: Category[]
  products: Product[]
  run: Run
  onDone: (msg: string) => void
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
  allowOnSale: boolean
  minTotal: string
  maxOff: string
  onlyCategories: string[]
  onlyProducts: string[]
}

type Errors = Partial<Record<'code' | 'value' | 'limit' | 'end' | 'minTotal' | 'maxOff' | 'only', string>>

const isMoney = (v: string) => /^\d+(\.\d{1,2})?$/.test(v.trim())

function validate(f: Form, taken: string[], old: string | null): Errors {
  const e: Errors = {}
  if (!/^[A-Z0-9_]{3,16}$/.test(f.code)) e.code = 'A-Z, 0-9 หรือ _ ยาว 3 ถึง 16 ตัว'
  else if (f.code !== old && taken.includes(f.code)) e.code = 'มีโค้ดนี้อยู่แล้ว'
  const v = Number(f.value)
  if (!f.value || !(v > 0)) e.value = 'ต้องใส่ส่วนลด'
  else if (f.kind === 'percent' && (v > 90 || !Number.isInteger(v))) e.value = 'ลดได้ 1 ถึง 90%'
  else if (f.kind === 'fixed' && !isMoney(f.value)) e.value = 'ทศนิยมไม่เกิน 2 ตำแหน่ง'
  if (f.minTotal && !isMoney(f.minTotal)) e.minTotal = 'ใส่เป็นจำนวนเงิน'
  if (f.maxOff && !isMoney(f.maxOff)) e.maxOff = 'ใส่เป็นจำนวนเงิน'
  if (f.limit && !(Number(f.limit) > 0)) e.limit = 'ต้องมากกว่า 0'
  const start = fromLocalInput(f.start)
  const end = fromLocalInput(f.end)
  if (start && end && end <= start) e.end = 'เวลาหมดต้องหลังเวลาเริ่ม'
  return e
}

export function CodeDialog({ code, taken, categories, products, run, onDone, onCancel }: Props) {
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
    allowOnSale: code?.allowOnSale ?? true,
    minTotal: code?.minTotal ? String(code.minTotal) : '',
    maxOff: code?.maxOff ? String(code.maxOff) : '',
    onlyCategories: code?.onlyCategories ?? [],
    onlyProducts: code?.onlyProducts ?? [],
  })
  const [errors, setErrors] = useState<Errors>({})
  const [sure, setSure] = useState(false)
  const [more, setMore] = useState(
    !!code && (code.allowOnSale === false || !!code.minTotal || !!code.maxOff || !!code.onlyCategories?.length || !!code.onlyProducts?.length),
  )
  const [saving, setSaving] = useState(false)
  const renameLocked = !!code && code.used > 0

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

  function toggleIn(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
  }

  async function save() {
    if (saving) return
    const e = validate(form, taken, old)
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    const d = await run('admin:code:save', {
      old,
      rev: code?.rev,
      code: form.code,
      kind: form.kind,
      value: Number(form.value),
      limit: form.limit ? Number(form.limit) : null,
      perPlayer: form.perPlayer,
      startsAt: fromLocalInput(form.start),
      endsAt: fromLocalInput(form.end),
      enabled: form.enabled,
      allowOnSale: form.allowOnSale,
      minTotal: form.minTotal ? Number(form.minTotal) : null,
      maxOff: form.maxOff ? Number(form.maxOff) : null,
      onlyCategories: form.onlyCategories,
      onlyProducts: form.onlyProducts,
    })
    setSaving(false)
    if (!d) return
    if (d.errors) {
      setErrors(d.errors as Errors)
      return
    }
    onDone(old ? `บันทึกโค้ด ${form.code} แล้ว` : `เพิ่มโค้ด ${form.code} แล้ว`)
  }

  async function remove() {
    if (!code) return
    const d = await run('admin:code:delete', { code: code.code, rev: code.rev })
    if (d) onDone(`ลบโค้ด ${code.code} แล้ว`)
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
              autoFocus={!code}
              disabled={renameLocked}
              onChange={(e) => update({ code: e.target.value.toUpperCase().replace(/\s/g, '') })}
            />
            {errors.code ? (
              <span className="field-err">{errors.code}</span>
            ) : (
              renameLocked && <span className="box-note">มีคนใช้แล้ว เปลี่ยนชื่อไม่ได้</span>
            )}
          </div>
          <div className="field-group">
            <label htmlFor="k-value">
              ลด <span className="req">*</span>
            </label>
            <div className="code-value">
              <input
                id="k-value"
                className={bad('value') + ' mono center'}
                inputMode="decimal"
                value={form.value}
                onChange={(e) => update({ value: e.target.value.replace(/[^\d.]/g, '').slice(0, 9) })}
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

        <button type="button" className="ulink small more-toggle" onClick={() => setMore(!more)}>
          {more ? 'ซ่อนเงื่อนไขเพิ่ม' : 'เงื่อนไขเพิ่ม'}
        </button>

        {more && (
          <div className="code-more drop-in">
            <div className="two">
              <div className="field-group">
                <label htmlFor="k-min">
                  ยอดขั้นต่ำ (บาท) <span className="opt">ไม่บังคับ</span>
                </label>
                <input
                  id="k-min"
                  className={bad('minTotal') + ' mono'}
                  inputMode="decimal"
                  value={form.minTotal}
                  onChange={(e) => update({ minTotal: e.target.value.replace(/[^\d.]/g, '') })}
                />
                {errors.minTotal && <span className="field-err">{errors.minTotal}</span>}
              </div>
              <div className="field-group">
                <label htmlFor="k-max">
                  ลดสูงสุด (บาท) <span className="opt">ไม่บังคับ</span>
                </label>
                <input
                  id="k-max"
                  className={bad('maxOff') + ' mono'}
                  inputMode="decimal"
                  value={form.maxOff}
                  onChange={(e) => update({ maxOff: e.target.value.replace(/[^\d.]/g, '') })}
                />
                {errors.maxOff && <span className="field-err">{errors.maxOff}</span>}
              </div>
            </div>

            <label className="check">
              <input type="checkbox" checked={form.allowOnSale} onChange={(e) => update({ allowOnSale: e.target.checked })} />
              ใช้กับสินค้าที่ลดราคาอยู่แล้วได้
            </label>

            <div className="field-group">
              <span className="set-label">ใช้ได้เฉพาะหมวด (ไม่เลือก = ทุกหมวด)</span>
              <div className="chips wrap">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={form.onlyCategories.includes(c.id) ? 'chip on' : 'chip'}
                    onClick={() => update({ onlyCategories: toggleIn(form.onlyCategories, c.id) })}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <span className="set-label">ใช้ได้เฉพาะสินค้า (ไม่เลือก = ทุกชิ้น)</span>
              <div className="chips wrap pick-list">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={form.onlyProducts.includes(p.id) ? 'chip on' : 'chip'}
                    onClick={() => update({ onlyProducts: toggleIn(form.onlyProducts, p.id) })}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            {errors.only && <span className="field-err">{errors.only}</span>}
          </div>
        )}

        <div className="confirm-foot">
          {old &&
            (sure ? (
              <button type="button" className="ulink danger-link code-del" onClick={remove}>
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
          <button type="button" className="btn btn-solid btn-md" disabled={saving} onClick={save}>
            {saving ? 'กำลังบันทึก' : 'บันทึกโค้ด'}
          </button>
        </div>
      </div>
    </div>
  )
}
