/**
 * ─────────────────────────────────────────────────────────────
 *  EVENT CONFIG — the only file you need to edit for content.
 * ─────────────────────────────────────────────────────────────
 *  Images: drop files into /public/assets and point the `image`
 *  fields at them (e.g. '/assets/ironman.png'). Leave a field as
 *  null to use the built-in SVG artwork — nothing will break.
 */

export type CharacterId = 'ironman' | 'spiderman' | 'strange' | 'panther'

export interface Character {
  id: CharacterId
  number: string
  name: string
  role: string
  traits: string[]
  tags: string
  description: string
  clearance: string
  accent: string
  /** Secondary colour used for the card glow and section background tint */
  glow: string
  /** Path to a licensed image in /public/assets, or null for the built-in SVG art */
  image: string | null
}

export type Stat = { label: string } & ({ value: number; pad: number; suffix: string } | { value: null; display: string })

export interface TimelineItem {
  time: string
  title: string
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
  images: { hero: string | null }
  stats: Stat[]
  characters: Character[]
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
    // Optional: POST endpoint that accepts JSON { name, email, phone, branch }.
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

  // ── Images (optional overrides) ───────────────────────────
  images: {
    hero: null, // e.g. '/assets/hero-character.png' (transparent PNG works best)
  },

  // ── Stats counter strip ───────────────────────────────────
  stats: [
    { value: 1, pad: 2, suffix: '', label: 'Event' },
    { value: 4, pad: 2, suffix: '+', label: 'Challenges' },
    { value: null, display: '∞', label: 'Possibilities' },
  ],

  // ── Heroes / challenge tracks ─────────────────────────────
  characters: [
    {
      id: 'ironman',
      number: '01',
      name: 'Iron Man',
      role: 'The Engineer',
      traits: ['Build.', 'Code.', 'Create.'],
      tags: 'Build / Code / Logic',
      description: 'A rapid build challenge. Take a problem statement, ship a working prototype and defend your architecture.',
      clearance: 'Stark-Class',
      accent: '#E62429',
      glow: '#FFB547',
      image: null, // '/assets/ironman.png'
    },
    {
      id: 'spiderman',
      number: '02',
      name: 'Spider-Man',
      role: 'The Agile Mind',
      traits: ['Think.', 'Adapt.', 'Swing.'],
      tags: 'Speed / Adaptability',
      description: 'Timed rapid-fire rounds. Debug, pivot and solve under pressure — your reflexes are the only framework.',
      clearance: 'Web-Class',
      accent: '#E62429',
      glow: '#3D7BFF',
      image: null, // '/assets/spiderman.png'
    },
    {
      id: 'strange',
      number: '03',
      name: 'Doctor Strange',
      role: 'The Strategist',
      traits: ['Decode.', 'Solve.', 'Foresee.'],
      tags: 'Logic / Puzzles / Problem Solving',
      description: 'A chain of logic puzzles and algorithmic riddles. One of fourteen million paths leads to the answer.',
      clearance: 'Sanctum-Class',
      accent: '#E62429',
      glow: '#FF8A3D',
      image: null, // '/assets/strange.png'
    },
    {
      id: 'panther',
      number: '04',
      name: 'Black Panther',
      role: 'The Tactician',
      traits: ['Plan.', 'Unite.', 'Lead.'],
      tags: 'Strategy / Collaboration',
      description: 'A team strategy round. Coordinate, allocate resources and outmanoeuvre rival squads to protect the kingdom.',
      clearance: 'Wakanda-Class',
      accent: '#E62429',
      glow: '#A06BFF',
      image: null, // '/assets/black-panther.png'
    },
  ],

  // ── Timeline ──────────────────────────────────────────────
  timeline: [
    { time: '10:00', title: 'Arrival', detail: 'Check-in, badges and hero allocation.' },
    { time: '10:30', title: 'Opening', detail: 'Briefing from the chapter. Rules of the multiverse.' },
    { time: '11:00', title: 'First Challenge', detail: 'The portals open. Round one begins.' },
    { time: '13:00', title: 'Multiverse Battle', detail: 'Teams collide across all four tracks.' },
    { time: '15:00', title: 'Final Round', detail: 'Top squads. One problem. No second chances.' },
    { time: '16:00', title: 'The Verdict', detail: 'Results, prizes and the end of the mission.' },
  ],

  // ── Socials ───────────────────────────────────────────────
  socials: {
    instagram: 'https://www.instagram.com/',
    linkedin: 'https://www.linkedin.com/',
    github: 'https://github.com/',
  },
}
