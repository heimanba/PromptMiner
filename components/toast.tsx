'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

export function Toast() {
  const { theme } = useTheme()
  
  return (
    <Toaster
      theme={theme as 'light' | 'dark' | 'system'}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        },
      }}
    />
  )
}
