'use client'

import { useEffect } from 'react'
import { sanitizeCss } from '@/lib/sanitize-css'

interface Props {
  css: string | null
}

export default function CustomCssProvider({ css }: Props) {
  useEffect(() => {
    if (!css?.trim()) return

    const style = document.createElement('style')
    style.id = 'custom-user-css'
    style.textContent = sanitizeCss(css)
    document.head.appendChild(style)

    return () => {
      document.getElementById('custom-user-css')?.remove()
    }
  }, [css])

  return null
}
