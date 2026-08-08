// Shared display formatting.
//
// Before this file every page carried its own formatKamas / formatDate /
// formatDuration, which is why the same number rendered three different ways
// depending on which screen you were looking at.

/** Full precision with thousands separators: 1 234 567 k */
export const formatKamas = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${Math.round(value).toLocaleString('fr-FR')} k`
}

/** Short form for dense contexts: 1.2M, 340k, 8 500.
 *
 *  No trailing kamas "k" here: the thousands abbreviation is already a k, and
 *  carrying both rendered 100 000 as "100k k". UiMoney exposes the exact figure
 *  with its unit on hover, so the unit is not lost. */
export const formatKamasShort = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (abs >= 10_000) return `${sign}${Math.round(abs / 1000)}k`
  return `${sign}${Math.round(abs).toLocaleString('fr-FR')}`
}

/** Same as formatKamas but always carries an explicit + or −. */
export const formatSigned = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const rounded = Math.round(value)
  if (rounded === 0) return '0 k'
  const sign = rounded > 0 ? '+' : '−'
  return `${sign}${Math.abs(rounded).toLocaleString('fr-FR')} k`
}

export const formatPercent = (value: number | null | undefined, digits = 0): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}%`
}

export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return value.toLocaleString('fr-FR')
}

export const formatDate = (iso: string | number | Date | null | undefined): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDateTime = (iso: string | number | Date | null | undefined): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

/** "3d ago" / "just now" — for freshness indicators. */
export const formatRelative = (iso: string | number | Date | null | undefined): string => {
  if (!iso) return '—'
  const time = new Date(iso).getTime()
  if (!Number.isFinite(time)) return '—'
  const mins = Math.floor((Date.now() - time) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

export const formatDuration = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) return '—'
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

export const formatBytes = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
