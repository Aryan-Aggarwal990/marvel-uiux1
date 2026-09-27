/**
 * ─────────────────────────────────────────────────────────────
 *  EVENT CONFIG — the only file you need to edit for content.
 * ─────────────────────────────────────────────────────────────
 *  The hero roster (names, colours, effects, artwork paths) lives
 *  in ./characters.ts — every hero re-themes the whole site.
 */

export type Stat = { label: string } & ({ value: number; pad: number; suffix: string } | { value: null; display: string })

export interface TimelineItem {
  time: string
  title: string
  /** Tiny Marvel-flavoured phase code shown above the time */
  code: string
  detail: string
}

export interface EventConfig {
  eventName: string
  organiser: string
  university: string
  city: string
  country: string
  universeCode: string
  year: string
  protocol: string
  date: string
  time: string
  venue: string
  coordinates: { lat: string; lng: string; decimal: string; mapsUrl: string }
  registration: { endpoint: string; externalLink: string; branches: string[] }
  stats: Stat[]
  timeline: TimelineItem[]
  socials: { instagram: string; linkedin: string; github: string }
}

export const eventConfig: EventConfig = {
  // ── Identity ──────────────────────────────────────────────
  eventName: 'The Multiverse Is Open',
  organiser: 'GeeksForGeeks Student Chapter',
  university: 'Bennett University',
  city: 'Greater Noida',
  country: 'India',
  universeCode: 'EARTH-616',
  year: '2026',
  protocol: 'GFG-01',

  // ── When & where ──────────────────────────────────────────
  date: '[EVENT DATE]',
  time: '[EVENT TIME]',
  venue: '[EVENT VENUE]',

  coordinates: {
    lat: '28°27′ N',
    lng: '77°31′ E',
    decimal: '28.4500° N, 77.5200° E',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bennett+University+Greater+Noida',
  },

  // ── Registration ──────────────────────────────────────────
  registration: {
    // Optional: POST endpoint that accepts JSON { name, email, phone, branch, hero, track }.
    // Leave empty to simulate submission on the frontend.
    endpoint: '',
    // Optional: external form (Google Form, Unstop, etc). When set, a secondary
    // link is shown next to the custom form.
    externalLink: '',
    branches: [
      'CSE — 1st Year',
      'CSE — 2nd Year',
      'CSE — 3rd Year',
      'CSE — 4th Year',
      'ECE / EEE',
      'Mechanical / Civil',
      'BCA / MCA',
      'Other',
    ],
  },

  // ── Stats counter strip ───────────────────────────────────
  stats: [
    { value: 1, pad: 2, suffix: '', label: 'Event' },
    { value: 4, pad: 2, suffix: '+', label: 'Challenges' },
    { value: null, display: '∞', label: 'Possibilities' },
  ],

  // ── Timeline ──────────────────────────────────────────────
  timeline: [
    { time: '10:00', title: 'Arrival', code: 'Assemble', detail: 'Check-in, badges and hero allocation.' },
    { time: '10:30', title: 'Opening', code: 'Briefing', detail: 'Briefing from the chapter. Rules of the multiverse.' },
    { time: '11:00', title: 'First Challenge', code: 'Portals open', detail: 'The portals open. Round one begins.' },
    { time: '13:00', title: 'Multiverse Battle', code: 'Civil war', detail: 'Teams collide across all four tracks.' },
    { time: '15:00', title: 'Final Round', code: 'Endgame', detail: 'Top squads. One problem. No second chances.' },
    { time: '16:00', title: 'The Verdict', code: 'Post-credits', detail: 'Results, prizes and the end of the mission.' },
  ],

  // ── Socials ───────────────────────────────────────────────
  socials: {
    instagram: 'https://www.instagram.com/',
    linkedin: 'https://www.linkedin.com/',
    github: 'https://github.com/',
  },
}
