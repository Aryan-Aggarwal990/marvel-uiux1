/**
 * ─────────────────────────────────────────────────────────────
 *  HERO ROSTER — every character and the "world" it creates.
 * ─────────────────────────────────────────────────────────────
 *  Selecting a hero re-themes the whole site from its `theme`.
 *  Artwork: set `image` to a licensed/approved file in
 *  /public/assets/characters (e.g. '/assets/characters/thor.png').
 *  While `image` is null the built-in stylised SVG portrait is used.
 */

export type HeroId =
  | 'spiderman'
  | 'ironman'
  | 'strange'
  | 'panther'
  | 'thor'
  | 'hulk'
  | 'cap'
  | 'marvel'
  | 'wanda'
  | 'loki'
  | 'miles'
  | 'deadpool'

/** Background pattern that fills the page behind the content */
export type Motif =
  | 'multiverse'
  | 'web'
  | 'reactor'
  | 'portal'
  | 'vibranium'
  | 'storm'
  | 'impact'
  | 'shield'
  | 'cosmic'
  | 'chaos'
  | 'timeline'
  | 'glitch'
  | 'comic'

/** Behaviour of the global particle field */
export type ParticleKind = 'rise' | 'sparks' | 'spiral' | 'twinkle' | 'rain' | 'debris' | 'warp' | 'wisp' | 'glitch'

/** The 0.5–1.2s "dimension shift" played when this hero is selected */
export type ShiftStyle =
  | 'web'
  | 'scan'
  | 'portal'
  | 'geometric'
  | 'lightning'
  | 'shockwave'
  | 'shield'
  | 'photon'
  | 'hex'
  | 'branch'
  | 'glitch'
  | 'comic'

/** HUD chrome: tag shapes, borders and corner treatment */
export type HudStyle = 'default' | 'comic' | 'technical' | 'mystic' | 'elegant' | 'norse' | 'heavy' | 'military'

/** How accent words in the big display headings are rendered */
export type TypeStyle = 'solid' | 'chromatic' | 'metallic' | 'glow' | 'heavy' | 'comic' | 'tracked'

export interface HeroTheme {
  /** Main UI accent (buttons, highlights, lines) */
  accent: string
  /** Secondary colour (gradients, glows, chromatic offsets) */
  accent2: string
  /** Near-black base tint of the whole world */
  bg: string
  motif: Motif
  particles: ParticleKind
  shift: ShiftStyle
  hud: HudStyle
  type: TypeStyle
}

export type TrackId = 'build' | 'speed' | 'logic' | 'strategy'

export interface Track {
  id: TrackId
  role: string
  tags: string
  description: string
}

export interface Hero {
  id: HeroId
  name: string
  /** Universe / origin code shown on the card, e.g. EARTH-616 */
  code: string
  /** One short identity line */
  tagline: string
  /** Challenge track this hero represents */
  track: TrackId
  /** Tiny HUD status lines shown while this hero is active */
  status: [string, string, string]
  /** Hero-specific directive shown in the Mission section */
  directive: string
  /** Headline shown after registration, e.g. "Welcome to the web." */
  welcome: string
  /** Licensed artwork path, or null for the built-in SVG portrait */
  image: string | null
  theme: HeroTheme
}

/** The four challenge tracks of the event. Each hero belongs to one. */
export const tracks: Record<TrackId, Track> = {
  build: {
    id: 'build',
    role: 'The Engineer',
    tags: 'Build / Code / Logic',
    description: 'Rapid build challenge — ship a working prototype and defend your architecture.',
  },
  speed: {
    id: 'speed',
    role: 'The Agile Mind',
    tags: 'Speed / Adaptability',
    description: 'Timed rapid-fire rounds — debug, pivot and solve under pressure.',
  },
  logic: {
    id: 'logic',
    role: 'The Strategist',
    tags: 'Logic / Puzzles / Problem Solving',
    description: 'A chain of logic puzzles and algorithmic riddles with one true path.',
  },
  strategy: {
    id: 'strategy',
    role: 'The Tactician',
    tags: 'Strategy / Collaboration',
    description: 'Team strategy round — coordinate, allocate and outmanoeuvre rival squads.',
  },
}

/** Theme used before any hero is chosen: the neutral GFG × Marvel multiverse. */
export const defaultTheme: HeroTheme = {
  accent: '#E62429',
  accent2: '#7C8CFF',
  bg: '#050505',
  motif: 'multiverse',
  particles: 'rise',
  shift: 'portal',
  hud: 'default',
  type: 'solid',
}

export const heroes: Hero[] = [
  {
    id: 'spiderman',
    name: 'Spider-Man',
    code: 'EARTH-616',
    tagline: 'Your friendly neighbourhood coder.',
    track: 'speed',
    status: ['Spider-sense // Tingling', 'Web fluid // 87%', 'Sector // Queens, NY'],
    directive: 'Swing in fast, adapt faster. Every bug is just another villain of the week.',
    welcome: 'Welcome to the web.',
    image: null,
    theme: {
      accent: '#E62429',
      accent2: '#2F6BFF',
      bg: '#05060d',
      motif: 'web',
      particles: 'rise',
      shift: 'web',
      hud: 'comic',
      type: 'chromatic',
    },
  },
  {
    id: 'ironman',
    name: 'Iron Man',
    code: 'EARTH-616',
    tagline: 'Genius. Engineer. Avenger.',
    track: 'build',
    status: ['Arc reactor // 400%', 'Suit integrity // Nominal', 'J.A.R.V.I.S. // Online'],
    directive: 'Prototype first, perfect in the air. If it doesn’t exist yet, build it.',
    welcome: 'Suit up, engineer.',
    image: null,
    theme: {
      accent: '#F5B843',
      accent2: '#E0262F',
      bg: '#0a0605',
      motif: 'reactor',
      particles: 'sparks',
      shift: 'scan',
      hud: 'technical',
      type: 'metallic',
    },
  },
  {
    id: 'strange',
    name: 'Doctor Strange',
    code: 'KAMAR-TAJ',
    tagline: 'One path in fourteen million.',
    track: 'logic',
    status: ['Time stone // Stable', 'Portals // 3 open', 'Futures scanned // 14M'],
    directive: 'See every branch of the problem before you commit to the one that wins.',
    welcome: 'The sanctum is yours.',
    image: null,
    theme: {
      accent: '#FF8A2A',
      accent2: '#5B3FD9',
      bg: '#070518',
      motif: 'portal',
      particles: 'spiral',
      shift: 'portal',
      hud: 'mystic',
      type: 'glow',
    },
  },
  {
    id: 'panther',
    name: 'Black Panther',
    code: 'WAKANDA',
    tagline: 'Vibranium-grade strategy.',
    track: 'strategy',
    status: ['Vibranium // Charged', 'Kinetic store // 92%', 'Kingdom // Protected'],
    directive: 'Lead with precision. The strongest systems are built by the whole tribe.',
    welcome: 'Wakanda welcomes you.',
    image: null,
    theme: {
      accent: '#A57BFF',
      accent2: '#DAD3F7',
      bg: '#050409',
      motif: 'vibranium',
      particles: 'twinkle',
      shift: 'geometric',
      hud: 'elegant',
      type: 'tracked',
    },
  },
  {
    id: 'thor',
    name: 'Thor',
    code: 'ASGARD',
    tagline: 'Worthy of the final round.',
    track: 'strategy',
    status: ['Storm // Summoned', 'Bifrost // Aligned', 'Worthiness // Confirmed'],
    directive: 'Bring the thunder to the team round — lead from the front, strike once.',
    welcome: 'You are worthy.',
    image: null,
    theme: {
      accent: '#5AA2FF',
      accent2: '#DDE7F3',
      bg: '#040811',
      motif: 'storm',
      particles: 'rain',
      shift: 'lightning',
      hud: 'norse',
      type: 'metallic',
    },
  },
  {
    id: 'hulk',
    name: 'Hulk',
    code: 'EARTH-616',
    tagline: 'Smash the problem statement.',
    track: 'build',
    status: ['Gamma // Critical', 'Anger // Managed', 'Structural load // ∞'],
    directive: 'Big problems need big force. Break it apart, then build it back stronger.',
    welcome: 'Hulk approves.',
    image: null,
    theme: {
      accent: '#46E35A',
      accent2: '#8B4DD1',
      bg: '#030803',
      motif: 'impact',
      particles: 'debris',
      shift: 'shockwave',
      hud: 'heavy',
      type: 'heavy',
    },
  },
  {
    id: 'cap',
    name: 'Captain America',
    code: 'EARTH-616',
    tagline: 'I can debug this all day.',
    track: 'strategy',
    status: ['Shield // Ready', 'Squad // Assembled', 'Morale // 100%'],
    directive: 'Hold the line for your team. Clean plans, honest code, no one left behind.',
    welcome: 'Avengers, assembled.',
    image: null,
    theme: {
      accent: '#3D74F5',
      accent2: '#E0303A',
      bg: '#040714',
      motif: 'shield',
      particles: 'rise',
      shift: 'shield',
      hud: 'military',
      type: 'solid',
    },
  },
  {
    id: 'marvel',
    name: 'Captain Marvel',
    code: 'HALA // C-53',
    tagline: 'Higher. Further. Faster. Deploy.',
    track: 'build',
    status: ['Photon output // Max', 'Binary mode // Armed', 'Orbit // Stable'],
    directive: 'Push past the limits of the problem. Ship at escape velocity.',
    welcome: 'Binary mode unlocked.',
    image: null,
    theme: {
      accent: '#FFC53D',
      accent2: '#3B6BFF',
      bg: '#050718',
      motif: 'cosmic',
      particles: 'warp',
      shift: 'photon',
      hud: 'military',
      type: 'glow',
    },
  },
  {
    id: 'wanda',
    name: 'Scarlet Witch',
    code: 'WESTVIEW',
    tagline: 'Rewrite reality.',
    track: 'logic',
    status: ['Chaos magic // Rising', 'Hex radius // 8km', 'Reality // Editable'],
    directive: 'Bend the rules of the puzzle until reality gives you the answer.',
    welcome: 'Reality rewritten.',
    image: null,
    theme: {
      accent: '#FF2E63',
      accent2: '#B340FF',
      bg: '#0c0307',
      motif: 'chaos',
      particles: 'wisp',
      shift: 'hex',
      hud: 'mystic',
      type: 'glow',
    },
  },
  {
    id: 'loki',
    name: 'Loki',
    code: 'TVA // VARIANT',
    tagline: 'Glorious purpose. Glorious code.',
    track: 'logic',
    status: ['Timeline // Branching', 'Variant // L-1130', 'Mischief // Scheduled'],
    directive: 'Think like a trickster: find the loophole nobody else noticed.',
    welcome: 'Burdened with glorious purpose.',
    image: null,
    theme: {
      accent: '#3FD17A',
      accent2: '#E3B341',
      bg: '#030906',
      motif: 'timeline',
      particles: 'glitch',
      shift: 'branch',
      hud: 'elegant',
      type: 'metallic',
    },
  },
  {
    id: 'miles',
    name: 'Miles Morales',
    code: 'EARTH-1610',
    tagline: 'Anyone can ship the code.',
    track: 'speed',
    status: ['Venom blast // Charged', 'Camouflage // Ready', 'Glitch // Contained'],
    directive: 'Take the leap of faith. Improvise, remix and make the solution yours.',
    welcome: 'Leap of faith: complete.',
    image: null,
    theme: {
      accent: '#FF2D3D',
      accent2: '#3DF0FF',
      bg: '#07050a',
      motif: 'glitch',
      particles: 'glitch',
      shift: 'glitch',
      hud: 'comic',
      type: 'chromatic',
    },
  },
  {
    id: 'deadpool',
    name: 'Deadpool',
    code: 'EARTH-10005',
    tagline: 'Maximum effort.',
    track: 'speed',
    status: ['Fourth wall // Broken', 'Chimichangas // 12', 'Healing factor // On'],
    directive: 'Yes, you’re reading a website. Now go break the problem, not the fourth wall.',
    welcome: 'Maximum effort, registered.',
    image: null,
    theme: {
      accent: '#F0243B',
      accent2: '#F5F5F5',
      bg: '#0a0304',
      motif: 'comic',
      particles: 'rise',
      shift: 'comic',
      hud: 'comic',
      type: 'comic',
    },
  },
]

export const heroById = (id: HeroId | null | undefined): Hero | undefined => heroes.find((h) => h.id === id)
