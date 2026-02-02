import { useEffect, useRef } from 'react'

export function useChatScroll<T>(dep: T) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [dep])

  return ref
}