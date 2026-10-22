import { useEffect, useState } from 'react'

// เวลาปัจจุบัน ใช้กับตัวนับถอยหลัง
export function useNow(every = 1000, enabled = true) {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (!enabled) return
    const t = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(t)
  }, [every, enabled])

  return now
}
