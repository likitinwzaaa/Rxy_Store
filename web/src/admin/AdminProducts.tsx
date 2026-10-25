import { useState, type DragEvent } from 'react'
import type { Category, Product } from '../types'
import { baht } from '../lib/format'
import { fetchNui, isBrowser } from '../lib/nui'
import { safeImage } from '../lib/product'
import { toProduct } from '../lib/catalog'
import { Toggle } from '../components/Toggle'
import { Icon } from '../components/Icon'
import { DateTimeField } from '../components/DateTimeField'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  accounts,
  canExpire,
  emptyForm,
  emptyRow,
  hasFixedPlate,
  periods,
  plateModes,
  rewardKinds,
  toForm,
  toPayload,
  validate,
  type FormErrors,
  type ProductForm,
  type RewardRow,
} from './productForm'
import type { Run } from './AdminApp'

type Props = {
  products: Product[]
  categories: Category[]
  roles: { id: string; name: string }[]
  run: Run
  onToast: (msg: string, tone?: 'warn') => void
}

export function AdminProducts({ products, categories, roles, run, onToast }: Props) {
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(products[0]?.id ?? null)
  const [form, setForm] = useState<ProductForm>(() => (products[0] ? toForm(products[0]) : emptyForm(categories[0]?.id ?? '')))
  const [errors, setErrors] = useState<FormErrors>({})
  const [tried, setTried] = useState(false)
  const [shake, setShake] = useState(0)
  const [dragId, setDragId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '-'
  const list = cat === 'all' ? products : products.filter((p) => p.category === cat)
  const needle = q.trim().toLowerCase()
  const hits = needle ? products.filter((p) => p.name.toLowerCase().includes(needle)) : []
  const errCount = Object.keys(errors).length
  const fixed = hasFixedPlate(form)

  function pick(p: Product) {
    setSelected(p.id)
    setForm(toForm(p))
    setErrors({})
    setTried(false)
  }

  function addNew() {
    setSelected(null)
    setForm(emptyForm(cat !== 'all' ? cat : (categories[0]?.id ?? '')))
    setErrors({})
    setTried(false)
  }

  function update(patch: Partial<ProductForm>) {
    const next = { ...form, ...patch }
    setForm(next)
    if (tried) setErrors(validate(next))
  }

  function updateRow(i: number, patch: Partial<RewardRow>) {
    update({ rewards: form.rewards.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  }

  function changeKind(i: number, kind: RewardRow['kind']) {
    const value = kind === 'money' ? 'bank' : kind === 'role' ? (roles[0]?.id ?? '') : ''
    updateRow(i, { kind, value, amount: '1', days: '', plateMode: 'random', plate: '' })
  }

  function fail(e: FormErrors) {
    setErrors(e)
    setShake((n) => n + 1)
    setTimeout(() => document.querySelector('.adm-form .bad, .adm-form .bad-box')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 0)
  }

  async function badModels() {
    const models = form.rewards.filter((r) => r.kind === 'vehicle').map((r) => r.value.trim())
    if (isBrowser || models.length === 0) return []
    const res = await fetchNui<{ bad?: string[] }>('checkModels', { models })
    return Array.isArray(res?.bad) ? res.bad : []
  }

  async function save() {
    if (saving) return
    const e = validate(form)
    setTried(true)
    if (Object.keys(e).length) return fail(e)

    setSaving(true)
    const missing = await badModels()
    if (missing.length) {
      setSaving(false)
      return fail({ rewards: `ไม่เจอโมเดลรถ ${missing.join(', ')} ในเกม` })
    }

    const old = products.find((p) => p.id === selected) ?? null
    const d = await run('admin:product:save', toPayload(form, old))
    setSaving(false)
    if (!d) return
    if (d.errors) return fail(d.errors as FormErrors)

    const id = d.savedId ?? old?.id
    const fresh = d.products.find((p) => p.id === id)
    if (fresh) {
      setSelected(fresh.id)
      setForm(toForm(toProduct(fresh, {}, {}, true)))
    }
    setErrors({})
    setTried(false)
    onToast(old ? 'บันทึกแล้ว' : 'เพิ่มสินค้าแล้ว')
  }

  async function remove() {
    const old = products.find((p) => p.id === selected)
    setConfirmDelete(false)
    if (!old) return
    const d = await run('admin:product:delete', { id: old.id, rev: old.rev })
    if (!d) return
    onToast('ลบสินค้าแล้ว')
    addNew()
  }

  async function toggle(p: Product, on: boolean) {
    await run('admin:product:toggle', { id: p.id, enabled: on })
  }

  async function onDrop(e: DragEvent, target: string) {
    e.preventDefault()
    if (!dragId || dragId === target) return
    const next = products.filter((p) => p.id !== dragId)
    next.splice(
      next.findIndex((p) => p.id === target),
      0,
      products.find((p) => p.id === dragId)!,
    )
    setDragId(null)
    await run('admin:product:sort', { ids: next.map((p) => p.id) })
  }

  const bad = (k: keyof FormErrors) => (errors[k] ? `input bad shake-${shake % 2}` : 'input')
  const preview = safeImage(form.image.trim())

  return (
    <div className="adm-split">
      <section className="adm-list">
        <div className="adm-tools">
          <div className="search adm-search">
            <label className="search-field">
              <Icon name="search" size={14} />
              <input
                value={q}
                placeholder="ค้นหาสินค้า"
                aria-label="ค้นหาสินค้า"
                onChange={(e) => {
                  setQ(e.target.value)
                  setOpen(true)
                }}
                onBlur={() => setTimeout(() => setOpen(false), 120)}
              />
            </label>
            {open && needle && (
              <div className="search-drop" role="listbox">
                {hits.slice(0, 3).map((p) => {
                  const at = p.name.toLowerCase().indexOf(needle)
                  return (
                    <div
                      key={p.id}
                      className="sug"
                      role="option"
                      aria-selected="false"
                      onMouseDown={() => {
                        pick(p)
                        setQ('')
                      }}
                    >
                      <span className="sug-name">
                        {p.name.slice(0, at)}
                        <b>{p.name.slice(at, at + needle.length)}</b>
                        {p.name.slice(at + needle.length)}
                      </span>
                      <span className="sug-cat">{catName(p.category)}</span>
                    </div>
                  )
                })}
                {hits.length === 0 && <div className="sug-empty">ไม่เจอ "{q.trim()}"</div>}
              </div>
            )}
          </div>

          <div
            className="chips scroll"
            onWheel={(e) => {
              e.currentTarget.scrollLeft += e.deltaY
            }}
          >
            {[{ id: 'all', name: 'ทั้งหมด' }, ...categories].map((c) => (
              <button key={c.id} type="button" className={cat === c.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>
                {c.name}
              </button>
            ))}
          </div>

          <button type="button" className="ulink adm-add" onClick={addNew}>
            <Icon name="plus" size={14} stroke={2.4} />
            เพิ่มสินค้า
          </button>
        </div>

        <div className="prow prow-head">
          <span />
          <span>สินค้า</span>
          <span>หมวด</span>
          <span className="right">ราคา</span>
          <span className="right">สต็อก</span>
          <span>ขาย</span>
        </div>

        <div className="adm-rows">
          {list.map((p, i) => (
            <div
              key={p.id}
              className={'prow' + (p.id === selected ? ' on' : '') + (p.id === dragId ? ' dragging' : '')}
              style={{ animationDelay: Math.min(i, 12) * 30 + 'ms' }}
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, p.id)}
              onClick={() => pick(p)}
            >
              <svg className="grip" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="6" r="1.6" />
                <circle cx="15" cy="6" r="1.6" />
                <circle cx="9" cy="12" r="1.6" />
                <circle cx="15" cy="12" r="1.6" />
                <circle cx="9" cy="18" r="1.6" />
                <circle cx="15" cy="18" r="1.6" />
              </svg>
              <span className="prow-name">{p.name}</span>
              <span className="prow-cat">{catName(p.category)}</span>
              <span className="right mono">{baht(p.price)}</span>
              <span className="right mono prow-stock">{p.stock == null ? '∞' : p.stock}</span>
              <span onClick={(e) => e.stopPropagation()}>
                <Toggle on={p.enabled !== false} label={`เปิดขาย ${p.name}`} onChange={(on) => toggle(p, on)} />
              </span>
            </div>
          ))}
          {list.length === 0 && (
            <p className="hist-empty">{categories.length === 0 ? 'ยังไม่มีหมวด เพิ่มหมวดก่อนที่แท็บหมวด' : 'ยังไม่มีสินค้าในหมวดนี้'}</p>
          )}
        </div>
      </section>

      <aside className="adm-form" key={selected ?? 'new'}>
        <div className="adm-form-body">
          <div className="adm-form-head">
            <h2>{selected ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h2>
            {selected && <span className="mono">id: {selected}</span>}
          </div>

          <div className="field-group">
            <label htmlFor="p-name">
              ชื่อสินค้า <span className="req">*</span>
            </label>
            <input
              id="p-name"
              className={bad('name')}
              value={form.name}
              maxLength={80}
              onChange={(e) => update({ name: e.target.value })}
            />
            {errors.name && <span className="field-err">{errors.name}</span>}
          </div>

          <div className="field-group">
            <label htmlFor="p-desc">
              คำอธิบาย <span className="opt">ไม่บังคับ · โชว์ตอนกดดูสินค้า</span>
            </label>
            <textarea
              id="p-desc"
              className="input area"
              rows={2}
              maxLength={500}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>

          <div className="field-group">
            <label htmlFor="p-img">
              รูปสินค้า (ลิงก์) <span className="opt">ไม่บังคับ</span>
            </label>
            <div className="img-row">
              <div className="img-thumb">{preview ? <img src={preview} alt="" /> : 'รูป'}</div>
              <input
                id="p-img"
                className={bad('image') + ' mono'}
                value={form.image}
                placeholder="https://..."
                onChange={(e) => update({ image: e.target.value })}
              />
            </div>
            {errors.image && <span className="field-err">{errors.image}</span>}
          </div>

          <div className="two">
            <div className="field-group">
              <label htmlFor="p-cat">
                หมวด <span className="req">*</span>
              </label>
              <select id="p-cat" className={bad('category')} value={form.category} onChange={(e) => update({ category: e.target.value })}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && <span className="field-err">{errors.category}</span>}
            </div>
            <div className="field-group">
              <label htmlFor="p-price">
                ราคา (บาท) <span className="req">*</span>
              </label>
              <input
                id="p-price"
                className={bad('price') + ' mono'}
                value={form.price}
                placeholder="เช่น 650 หรือ 99.50"
                inputMode="decimal"
                onChange={(e) => update({ price: e.target.value.replace(/[^\d.]/g, '') })}
              />
              {errors.price && <span className="field-err">{errors.price}</span>}
            </div>
          </div>

          <fieldset className={errors.rewards ? 'box bad-box' : 'box'}>
            <legend>
              ของที่ได้เมื่อซื้อ <span className="req">*</span>
            </legend>
            <div className="rw rw-head">
              <span>ประเภท</span>
              <span>ชื่อ / รหัส</span>
              <span className="center">จำนวน</span>
              <span className="center">อายุ (วัน)</span>
              <span />
            </div>
            {form.rewards.map((r, i) => {
              const kind = rewardKinds.find((k) => k.kind === r.kind)!
              const exp = canExpire(r.kind)
              return (
                <div key={i} className="rw-wrap">
                  <div className="rw">
                    <select
                      className="input"
                      aria-label="ประเภทของ"
                      value={r.kind}
                      onChange={(e) => changeKind(i, e.target.value as RewardRow['kind'])}
                    >
                      {rewardKinds.map((k) => (
                        <option key={k.kind} value={k.kind}>
                          {k.name}
                        </option>
                      ))}
                    </select>
                    {r.kind === 'money' && (
                      <select className="input" aria-label="ประเภทเงิน" value={r.value} onChange={(e) => updateRow(i, { value: e.target.value })}>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {r.kind === 'role' && (
                      <select className="input" aria-label="Discord role" value={r.value} onChange={(e) => updateRow(i, { value: e.target.value })}>
                        {roles.length === 0 && <option value="">ยังไม่ได้ตั้ง role ใน config</option>}
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {(r.kind === 'item' || r.kind === 'vehicle') && (
                      <input
                        className="input mono"
                        aria-label={kind.hint}
                        placeholder={kind.hint}
                        value={r.value}
                        onChange={(e) => updateRow(i, { value: e.target.value })}
                      />
                    )}
                    <input
                      className="input mono center"
                      aria-label="จำนวน"
                      inputMode="numeric"
                      disabled={r.kind === 'role' || (r.kind === 'vehicle' && r.plateMode === 'fixed')}
                      value={r.kind === 'role' ? '1' : r.amount}
                      onChange={(e) => updateRow(i, { amount: e.target.value.replace(/\D/g, '') })}
                    />
                    <input
                      className="input mono center"
                      aria-label="อายุเป็นวัน เว้นว่างคือถาวร"
                      inputMode="numeric"
                      placeholder={exp ? 'ถาวร' : '—'}
                      disabled={!exp}
                      value={exp ? r.days : ''}
                      onChange={(e) => updateRow(i, { days: e.target.value.replace(/\D/g, '') })}
                    />
                    <button
                      type="button"
                      className="trash"
                      aria-label="ลบบรรทัดนี้"
                      onClick={() => update({ rewards: form.rewards.filter((_, j) => j !== i) })}
                    >
                      <Icon name="trash" size={15} stroke={1.9} />
                    </button>
                  </div>
                  {r.kind === 'vehicle' && (
                    <div className="rw-plate">
                      <span>ป้ายทะเบียน</span>
                      <select
                        className="input"
                        aria-label="แบบป้ายทะเบียน"
                        value={r.plateMode}
                        onChange={(e) =>
                          updateRow(i, {
                            plateMode: e.target.value as RewardRow['plateMode'],
                            plate: '',
                            amount: e.target.value === 'fixed' ? '1' : r.amount,
                          })
                        }
                      >
                        {plateModes.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      {r.plateMode !== 'random' && (
                        <input
                          className="input mono"
                          aria-label={r.plateMode === 'fixed' ? 'ป้ายทะเบียน' : 'ตัวหน้าป้าย'}
                          placeholder={r.plateMode === 'fixed' ? 'เช่น X 44' : 'เช่น RXY'}
                          maxLength={r.plateMode === 'fixed' ? 8 : 3}
                          value={r.plate}
                          onChange={(e) => updateRow(i, { plate: e.target.value.toUpperCase() })}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {errors.rewards && <span className="field-err">{errors.rewards}</span>}
            <span className="box-note">
              อายุว่าง = ได้ถาวร ครบแล้วระบบดึงคืนเอง เงินไม่มีอายุ ป้ายตายตัวขายได้คันเดียว ระบบจะตั้งสต็อกเป็น 1 ให้
            </span>
            <div className="box-foot">
              <button type="button" className="ulink" onClick={() => update({ rewards: [...form.rewards, emptyRow()] })}>
                <Icon name="plus" size={13} stroke={2.4} />
                เพิ่มของ
              </button>
            </div>
          </fieldset>

          <fieldset className="box two">
            <legend>
              ลดราคา <span className="opt">ไม่บังคับ</span>
            </legend>
            <div className="field-group">
              <label htmlFor="p-sale">ราคาลด</label>
              <input
                id="p-sale"
                className={bad('salePrice') + ' mono sale'}
                inputMode="decimal"
                value={form.salePrice}
                onChange={(e) => update({ salePrice: e.target.value.replace(/[^\d.]/g, '') })}
              />
              {errors.salePrice && <span className="field-err">{errors.salePrice}</span>}
            </div>
            <div className="field-group">
              <label htmlFor="p-end">หมดเวลา</label>
              <DateTimeField id="p-end" value={form.saleEnds} align="right" defaultTime="23:59" onChange={(v) => update({ saleEnds: v })} />
            </div>
          </fieldset>

          <div className="two">
            <div className="field-group">
              <label htmlFor="p-stock">สต็อกทั้งหมด</label>
              <input
                id="p-stock"
                className={bad('stock') + ' mono'}
                inputMode="numeric"
                placeholder={fixed ? '1' : 'ว่าง = ไม่จำกัด'}
                disabled={fixed}
                value={fixed ? '1' : form.stock}
                onChange={(e) => update({ stock: e.target.value.replace(/\D/g, '') })}
              />
              {errors.stock && <span className="field-err">{errors.stock}</span>}
            </div>
            <div className="field-group">
              <label htmlFor="p-start">
                เปิดขายวันที่ <span className="opt">ไม่บังคับ</span>
              </label>
              <DateTimeField id="p-start" value={form.startsAt} align="right" onChange={(v) => update({ startsAt: v })} />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="p-limit">ซื้อได้ต่อคน</label>
            <div className="limit-row">
              <input
                id="p-limit"
                className={bad('limit') + ' mono center'}
                inputMode="numeric"
                placeholder="ไม่จำกัด"
                value={form.limit}
                onChange={(e) => update({ limit: e.target.value.replace(/\D/g, '') })}
              />
              <span>ชิ้น</span>
              <select
                className="input"
                aria-label="รอบของลิมิต"
                value={form.limitPeriod}
                disabled={!form.limit}
                onChange={(e) => update({ limitPeriod: e.target.value as ProductForm['limitPeriod'] })}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.limit && <span className="field-err">{errors.limit}</span>}
          </div>

          <label className="check">
            <input type="checkbox" checked={form.featured} onChange={(e) => update({ featured: e.target.checked })} />
            โชว์ในสินค้าแนะนำ
          </label>

          <div className="field-group">
            <label htmlFor="p-when">ตอนซื้อไม่ได้ (หมด / ซื้อครบ / ยังไม่เปิดขาย)</label>
            <select
              id="p-when"
              className="input"
              value={form.hideWhenBlocked ? 'hide' : 'show'}
              onChange={(e) => update({ hideWhenBlocked: e.target.value === 'hide' })}
            >
              <option value="show">โชว์เป็นสีเทา บอกเหตุผล</option>
              <option value="hide">ซ่อนจากหน้าร้าน</option>
            </select>
          </div>
        </div>

        <div className="adm-form-foot">
          {selected && (
            <button type="button" className="trash big" aria-label="ลบสินค้านี้" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" size={17} stroke={1.9} />
            </button>
          )}
          <span className="form-msg">{errCount > 0 && `ยังกรอกไม่ครบ ${errCount} จุด`}</span>
          <button type="button" className="btn btn-solid btn-md save-btn" disabled={saving || categories.length === 0} onClick={save}>
            {saving ? 'กำลังบันทึก' : 'บันทึก'}
          </button>
        </div>
      </aside>

      {confirmDelete && (
        <ConfirmDialog
          danger
          title={`ลบ ${form.name}?`}
          desc="สินค้าจะหายจากหน้าร้านทันที ประวัติการซื้อเก่ายังอยู่ ย้อนกลับไม่ได้"
          confirmLabel="ลบสินค้า"
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
