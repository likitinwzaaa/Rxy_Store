import { useEffect, useRef } from 'react'

type NuiMessage<T> = { action: string; data: T }

// รับ message จาก Lua ตาม action
export function useNuiEvent<T = unknown>(action: string, handler: (data: T) => void) {
  const saved = useRef(handler)
  saved.current = handler

  useEffect(() => {
    const onMessage = (e: MessageEvent<NuiMessage<T>>) => {
      if (e.data?.action === action) saved.current(e.data.data)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [action])
}
