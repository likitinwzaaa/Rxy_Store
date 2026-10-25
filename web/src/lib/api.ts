import { fetchNui, isBrowser } from './nui'
import { mockCall } from '../mock/api'

export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

const messages: Record<string, string> = {
  rate: 'กดถี่เกินไป รอสักครู่แล้วลองใหม่',
  forbidden: 'คุณไม่มีสิทธิ์ทำแบบนี้',
  timeout: 'เซิร์ฟตอบช้า ลองใหม่อีกครั้ง',
  not_ready: 'ร้านยังไม่พร้อม ลองใหม่อีกครั้ง',
  not_found: 'ไม่เจอข้อมูลนี้',
  bad: 'ข้อมูลไม่ถูกต้อง',
  conflict: 'มีคนแก้ไปก่อนแล้ว โหลดข้อมูลล่าสุดให้แล้ว',
  stock_changed: 'มีคนซื้อไประหว่างแก้ สต็อกเปลี่ยนแล้ว โหลดข้อมูลล่าสุดให้แล้ว',
  in_use: 'หมวดนี้ยังมีสินค้าอยู่ ย้ายสินค้าออกก่อน',
}

export function errorText(code: string) {
  return messages[code] ?? 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง'
}

export async function call<T>(name: string, payload: object = {}): Promise<Result<T>> {
  try {
    if (isBrowser) return await mockCall<T>(name, payload)
    const res = await fetchNui<Result<T>>('req', { name, payload })
    if (!res || typeof res !== 'object' || typeof res.ok !== 'boolean') return { ok: false, error: 'error' }
    return res
  } catch {
    return { ok: false, error: 'error' }
  }
}
