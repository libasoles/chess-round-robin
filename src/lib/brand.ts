/**
 * Brand configuration module.
 * Supports multiple brands deployed to different subdomains.
 * Brand selection via VITE_BRAND environment variable.
 *
 * Usage:
 *   import { brand } from '@/lib/brand'
 *   <img src={brand.logoPath} alt={brand.logoAlt} />
 */

const BRAND = import.meta.env.VITE_BRAND ?? 'default'
const PREFIX = BRAND === 'default' ? '' : `/brand/${BRAND}`

const brandNames = {
  default: 'Round Robin',
  tucuchess: 'Tucu Chess',
} as const

const brandTopLabels = {
  default: 'Torneo',
  tucuchess: 'TucuChess',
} as const

const brandAltText = {
  default: 'Chess Round Robin',
  tucuchess: 'Tucu Chess',
} as const

export const brand = {
  /** Brand identifier (e.g., 'tucuchess', 'default') */
  name: (brandNames[BRAND as keyof typeof brandNames] ?? 'Round Robin') as string,

  /** Top label for header (first line) */
  topLabel: (brandTopLabels[BRAND as keyof typeof brandTopLabels] ?? 'Torneo') as string,

  /** Short name for PWA manifest */
  shortName: (brandNames[BRAND as keyof typeof brandNames] ?? 'Round Robin') as string,

  /** Logo path for header (logo.png) */
  logoPath: `${PREFIX}/logo.png`,

  /** Alt text for logo image */
  logoAlt: (brandAltText[BRAND as keyof typeof brandAltText] ?? 'Chess Round Robin') as string,

  /** PWA 192×192 icon */
  pwa192: `${PREFIX}/pwa-192x192.png`,

  /** PWA 512×512 icon (also used for OG preview) */
  pwa512: `${PREFIX}/pwa-512x512.png`,

  /** Empty state illustration (falls back to default if brand has none) */
  emptyPath: `${PREFIX}/empty.png`,

  /** Favicon path */
  faviconPath: `${PREFIX}/favicon.png`,
}
