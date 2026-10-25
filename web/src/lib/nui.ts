export const isBrowser = !(window as any).invokeNative

export const resource: string = isBrowser ? 'Rxy_Store' : (window as any).GetParentResourceName()

export async function fetchNui<T = unknown>(event: string, data?: unknown, mock?: T): Promise<T> {
  if (isBrowser) {
    return mock as T
  }

  const res = await fetch(`https://${resource}/${event}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data ?? {}),
  })
  return res.json()
}

export function mockNuiEvent(action: string, data: unknown, delay = 0) {
  if (!isBrowser) return
  setTimeout(() => {
    window.dispatchEvent(new MessageEvent('message', { data: { action, data } }))
  }, delay)
}
