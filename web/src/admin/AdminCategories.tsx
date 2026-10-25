import { useState, type DragEvent } from 'react'
import type { Category, Product } from '../types'
import { Toggle } from '../components/Toggle'
import { Icon } from '../components/Icon'
import { CategoryIcon, categoryIcons } from '../components/CategoryIcon'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Run } from './AdminApp'

type Group = { id: string; name: string }

type Props = {
  categories: Category[]
  products: Product[]
  groups: Group[]
  run: Run
  onToast: (msg: string, tone?: 'warn') => void
}

type Form = {
  name: string
  icon: string
  some: boolean
  groups: string[]
  hideEmpty: boolean
}

const pickable = Object.keys(categoryIcons).filter((k) => k !== 'people' && k !== 'lock')

function toForm(c: Category | null): Form {
  return {
    name: c?.name ?? '',
    icon: c?.icon ?? 'box',
    some: !!c?.groups?.length,
    groups: c?.groups ?? [],
    hideEmpty: !!c?.hideEmpty,
  }
}

export function AdminCategories({ categories, products, groups, run, onToast }: Props) {
  const [selected, setSelected] = useState<string | null>(categories[0]?.id ?? null)
  const [form, setForm] = useState<Form>(() => toForm(categories[0] ?? null))
  const [error, setError] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const count = (id: string) => products.filter((p) => p.category === id).length
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? id

  function pick(c: Category) {
    setSelected(c.id)
    setForm(toForm(c))
    setError(null)
  }

  function addNew() {
    setSelected(null)
    setForm(toForm(null))
    setError(null)
  }

  async function save() {
    if (saving) return
    if (!form.name.trim()) {
      setError('ต้องใส่ชื่อหมวด')
      return
    }
    if (form.some && form.groups.length === 0) {
      setError('เลือกอย่างน้อย 1 กลุ่ม หรือเปลี่ยนเป็นทุกคน')
      return
    }
    const old = categories.find((c) => c.id === selected)
    setSaving(true)
    const d = await run('admin:category:save', {
      id: old?.id,
      rev: old?.rev,
      name: form.name.trim(),
      icon: form.icon,
      groups: form.some ? form.groups : [],
      hideEmpty: form.hideEmpty,
    })
    setSaving(false)
    if (!d) return
    if (d.errors) {
      setError(Object.values(d.errors)[0] ?? 'บันทึกไม่ได้')
      return
    }
    const id = d.savedId ?? old?.id ?? null
    const fresh = d.categories.find((c) => c.id === id)
    setSelected(id)
    if (fresh) setForm(toForm(fresh))
    setError(null)
    onToast(old ? 'บันทึกหมวดแล้ว' : 'เพิ่มหมวดแล้ว')
  }

  async function remove() {
    const old = categories.find((c) => c.id === selected)
    setConfirmDelete(false)
    if (!old) return
    const d = await run('admin:category:delete', { id: old.id, rev: old.rev })
    if (!d) return
    onToast('ลบหมวดแล้ว')
    addNew()
  }

  async function onDrop(e: DragEvent, target: string) {
    e.preventDefault()
    if (!dragId || dragId === target) return
    const next = categories.filter((c) => c.id !== dragId)
    next.splice(
      next.findIndex((c) => c.id === target),
      0,
      categories.find((c) => c.id === dragId)!,
    )
    setDragId(null)
    await run('admin:category:sort', { ids: next.map((c) => c.id) })
  }

  const inUse = selected ? count(selected) : 0

  return (
    <div className="adm-split">
      <section className="adm-list">
        <div className="adm-tools">
          <span className="adm-hint">ลากเพื่อเรียงลำดับในหน้าร้าน</span>
          <button type="button" className="ulink adm-add" onClick={addNew}>
            <Icon name="plus" size={14} stroke={2.4} />
            เพิ่มหมวด
          </button>
        </div>

        <div className="crow crow-head">
          <span />
          <span />
          <span>หมวด</span>
          <span className="right">สินค้า</span>
          <span>ใครเห็น</span>
          <span>เปิด</span>
        </div>

        <div className="adm-rows">
          {categories.map((c, i) => {
            const on = c.enabled !== false
            const locked = !!c.groups?.length
            return (
              <div
                key={c.id}
                className={'crow' + (c.id === selected ? ' on' : '') + (on ? '' : ' off') + (c.id === dragId ? ' dragging' : '')}
                style={{ animationDelay: i * 40 + 'ms' }}
                draggable
                onDragStart={() => setDragId(c.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, c.id)}
                onClick={() => pick(c)}
              >
                <svg className="grip" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="9" cy="6" r="1.6" />
                  <circle cx="15" cy="6" r="1.6" />
                  <circle cx="9" cy="12" r="1.6" />
                  <circle cx="15" cy="12" r="1.6" />
                  <circle cx="9" cy="18" r="1.6" />
                  <circle cx="15" cy="18" r="1.6" />
                </svg>
                <span className="crow-icon">
                  <CategoryIcon name={c.icon} />
                </span>
                <span className="crow-name">{c.name}</span>
                <span className="right mono crow-count">{count(c.id)}</span>
                <span className={locked ? 'crow-who locked' : 'crow-who'}>
                  <CategoryIcon name={locked ? 'lock' : 'people'} size={14} />
                  {locked ? 'เฉพาะ ' + c.groups!.map(groupName).join(', ') : 'ทุกคน'}
                </span>
                <span onClick={(e) => e.stopPropagation()}>
                  <Toggle
                    on={on}
                    label={`เปิดหมวด ${c.name}`}
                    onChange={(v) => run('admin:category:toggle', { id: c.id, enabled: v })}
                  />
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <aside className="adm-form" key={selected ?? 'new'}>
        <div className="adm-form-body">
          <div className="adm-form-head">
            <h2>{selected ? 'แก้ไขหมวด' : 'เพิ่มหมวด'}</h2>
            {selected && <span className="mono">id: {selected}</span>}
          </div>

          <div className="field-group">
            <label htmlFor="c-name">
              ชื่อหมวด <span className="req">*</span>
            </label>
            <input
              id="c-name"
              className={error && !form.name.trim() ? 'input bad' : 'input'}
              value={form.name}
              maxLength={30}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="field-group">
            <label>ไอคอน</label>
            <div className="icon-grid">
              {pickable.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={form.icon === k ? 'icon-pick on' : 'icon-pick'}
                  aria-label={k}
                  onClick={() => setForm({ ...form, icon: k })}
                >
                  <CategoryIcon name={k} size={20} />
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label>ใครเห็นหมวดนี้</label>
            <div className="seg">
              <button type="button" className={form.some ? '' : 'on'} onClick={() => setForm({ ...form, some: false })}>
                ทุกคน
              </button>
              <button type="button" className={form.some ? 'on' : ''} onClick={() => setForm({ ...form, some: true })}>
                เฉพาะบางกลุ่ม
              </button>
            </div>
            {form.some && (
              <div className="chips wrap drop-in">
                {groups.map((g) => {
                  const on = form.groups.includes(g.id)
                  return (
                    <button
                      key={g.id}
                      type="button"
                      className={on ? 'chip on' : 'chip'}
                      onClick={() =>
                        setForm({ ...form, groups: on ? form.groups.filter((x) => x !== g.id) : [...form.groups, g.id] })
                      }
                    >
                      {g.name}
                    </button>
                  )
                })}
              </div>
            )}
            <span className="box-note">
              {groups.length === 0 ? 'ยังไม่ได้ตั้งกลุ่มใน config' : 'รายชื่อกลุ่มตั้งใน config'}
            </span>
          </div>

          <label className="check">
            <input type="checkbox" checked={form.hideEmpty} onChange={(e) => setForm({ ...form, hideEmpty: e.target.checked })} />
            ซ่อนหมวดนี้ถ้าไม่มีสินค้าที่ซื้อได้
          </label>
        </div>

        <div className="adm-form-foot">
          {selected && (
            <button type="button" className="trash big" aria-label="ลบหมวดนี้" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash" size={17} stroke={1.9} />
            </button>
          )}
          <span className="form-msg">{error}</span>
          <button type="button" className="btn btn-solid btn-md save-btn" disabled={saving} onClick={save}>
            {saving ? 'กำลังบันทึก' : 'บันทึก'}
          </button>
        </div>
      </aside>

      {confirmDelete &&
        (inUse > 0 ? (
          <ConfirmDialog
            title={`ลบหมวด ${form.name} ไม่ได้`}
            desc={`หมวดนี้ยังมีสินค้า ${inUse} ชิ้น ย้ายสินค้าไปหมวดอื่นที่หน้าสินค้าก่อน แล้วค่อยลบ`}
            confirmLabel="เข้าใจแล้ว"
            onConfirm={() => setConfirmDelete(false)}
            onCancel={() => setConfirmDelete(false)}
          />
        ) : (
          <ConfirmDialog
            danger
            title={`ลบหมวด ${form.name}?`}
            desc="หมวดจะหายจากหน้าร้านทันที ย้อนกลับไม่ได้"
            confirmLabel="ลบหมวด"
            onConfirm={remove}
            onCancel={() => setConfirmDelete(false)}
          />
        ))}
    </div>
  )
}
