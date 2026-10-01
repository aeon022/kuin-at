// Single source for the main navigation — Header.astro (desktop + mobile) and the command
// palette both read it, so the "Seiten" in search always match the menu.
export interface NavLink { href: string; label: string; id: string; children?: { href: string; label: string }[] }

export const navLinks: NavLink[] = [
  { href: '/', label: 'Start', id: 'home' },
  { href: '/events', label: 'Veranstaltungen', id: 'events' },
  { href: '/archiv', label: 'Archiv', id: 'archiv' },
  { href: '/partner', label: 'Mitglieder', id: 'partner' },
  {
    href: '/der-verein', label: 'Über uns', id: 'ueber-uns',
    children: [
      { href: '/der-verein/vorstand', label: 'Vorstand' },
      { href: '/der-verein/team', label: 'Team' },
    ],
  },
  { href: '/kontakt', label: 'Kontakt', id: 'kontakt' },
];

// Footer "Rechtliches" links — not in the menu, but people search for them.
export const legalLinks = [
  { href: '/impressum', label: 'Impressum' },
  { href: '/datenschutzerklaerung-eu', label: 'Datenschutz' },
  { href: '/barrierefreiheit', label: 'Barrierefreiheit' },
];
