import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/anton/latin-400.css'
import '@fontsource/space-grotesk/latin-400.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import './styles/global.css'
import App from './App.tsx'
import HeroThemeProvider from './theme/HeroThemeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HeroThemeProvider>
      <App />
    </HeroThemeProvider>
  </StrictMode>,
)
