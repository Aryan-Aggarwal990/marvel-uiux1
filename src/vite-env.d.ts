/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://abcd1234.supabase.co (optional — backend is disabled without it) */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon / publishable key — public by design, protected by Row Level Security */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

// Allow CSS custom properties (e.g. style={{ '--c': color }}) in inline styles.
import 'react'
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined
  }
}
