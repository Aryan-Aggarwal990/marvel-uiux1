import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useMultiverse } from '../data/multiverseContext'
import './Notice.css'

/** Small HUD message for backend problems (never blocks the page). Auto-dismisses after 6s. */
export default function Notice() {
  const { notice, dismissNotice } = useMultiverse()

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(dismissNotice, 6000)
    return () => window.clearTimeout(timer)
  }, [notice, dismissNotice])

  if (!notice) return null
  return (
    <div className={`notice mono is-${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'} key={notice.text}>
      <span className={`pulse-dot ${notice.tone === 'info' ? 'green' : ''}`} />
      <span>{notice.text}</span>
      <button onClick={dismissNotice} aria-label="Dismiss">
        <X size={13} />
      </button>
    </div>
  )
}
