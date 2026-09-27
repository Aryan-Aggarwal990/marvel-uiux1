/// <reference types="vite/client" />

// Allow CSS custom properties (e.g. style={{ '--c': color }}) in inline styles.
import 'react'
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined
  }
}
