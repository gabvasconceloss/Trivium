const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
}

export const IconGrid = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="8" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
    <rect x="13" y="13" width="8" height="8" rx="2" />
  </svg>
)

export const IconAward = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="5" />
    <path d="M8.5 12.5 7 21l5-2 5 2-1.5-8.5" />
  </svg>
)

export const IconBook = (p) => (
  <svg {...base} {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
  </svg>
)

export const IconActivity = (p) => (
  <svg {...base} {...p}>
    <path d="M3 12h4l2.5-8L14 20l2.5-8H21" />
  </svg>
)

export const IconCalendar = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
)

export const IconUser = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
  </svg>
)

export const IconPlus = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconMenu = (p) => (
  <svg {...base} {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

export const IconMoon = (p) => (
  <svg {...base} {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
)

export const IconSun = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const IconSliders = (p) => (
  <svg {...base} {...p}>
    <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M22 18h-2" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="8" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
)

export const IconCloud = (p) => (
  <svg {...base} {...p}>
    <path d="M7 18a4 4 0 1 1 .6-7.96A5.5 5.5 0 0 1 18 12.5a3.5 3.5 0 0 1-.5 5.5H7Z" />
  </svg>
)

export const IconTrash = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" />
  </svg>
)

export const IconCheck = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12.5 10 17.5 19 7" />
  </svg>
)

export const IconPlay = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M8 5v14l11-7z" />
  </svg>
)

export const IconArrowLeft = (p) => (
  <svg {...base} {...p}>
    <path d="M19 12H5M11 5l-7 7 7 7" />
  </svg>
)

export const IconLogout = (p) => (
  <svg {...base} {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)

export const IconSparkles = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Z" />
    <path d="M19 14l.9 2.6L22.5 17.5 19.9 18.4 19 21l-.9-2.6L15.5 17.5l2.6-.9L19 14Z" />
  </svg>
)

export const IconLock = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
)

export const IconChevronLeft = (p) => (
  <svg {...base} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)

export const IconChevronRight = (p) => (
  <svg {...base} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const IconClock = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
)
