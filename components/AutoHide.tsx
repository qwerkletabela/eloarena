'use client'

import { useEffect, useState } from 'react'

export default function AutoHide({
  children,
  ms = 5000,
}: {
  children: React.ReactNode
  ms?: number
}) {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShow(false), ms)
    return () => clearTimeout(t)
  }, [ms])
  if (!show) return null
  return <>{children}</>
}
