const STORAGE_KEY = 'kpuppy_tokens'
const SETTINGS_KEY = 'kpuppy_settings'
const RETURN_TO_KEY = 'kpuppy_return_to'
const CONTENT_TYPES_KEY = 'kpuppy_content_types'

export interface Tokens {
  access: string
  refresh: string
  expiresAt: number
}

export type VideoQuality = '2160p' | '1080p' | '720p' | '480p' | 'auto'
export type PlayerType = 'native' | 'builtin'

export interface LocalSettings {
  defaultQuality: VideoQuality
  playerType: PlayerType
  showContinueWatching: boolean
}

const DEFAULT_SETTINGS: LocalSettings = {
  defaultQuality: 'auto',
  playerType: 'native',
  showContinueWatching: true
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (err) {
    if (import.meta.env.DEV) console.warn('localStorage read failed:', err)
    return null
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch (err) {
    if (import.meta.env.DEV) console.warn('localStorage write failed:', err)
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (err) {
    if (import.meta.env.DEV) console.warn('localStorage remove failed:', err)
  }
}

export function getLocalSettings(): LocalSettings {
  const data = readStorage(SETTINGS_KEY)
  if (!data) return DEFAULT_SETTINGS

  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveLocalSettings(settings: Partial<LocalSettings>): void {
  const current = getLocalSettings()
  writeStorage(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }))
}

export function saveTokens(tokens: Tokens): void {
  writeStorage(STORAGE_KEY, JSON.stringify(tokens))
}

export function getTokens(): Tokens | null {
  const data = readStorage(STORAGE_KEY)
  if (!data) return null

  try {
    return JSON.parse(data) as Tokens
  } catch {
    return null
  }
}

export function clearTokens(): void {
  removeStorage(STORAGE_KEY)
}

export function isAuthenticated(): boolean {
  const tokens = getTokens()
  if (!tokens) return false

  return Date.now() < tokens.expiresAt
}

export interface ReturnToState {
  itemId: number | null
  seriesId: number | null
  selectedMenuId: string
  screenFocus?: Record<string, { row: number; col: number }>
}

export function saveReturnTo(state: ReturnToState): void {
  writeStorage(RETURN_TO_KEY, JSON.stringify(state))
}

export function getReturnTo(): ReturnToState | null {
  const data = readStorage(RETURN_TO_KEY)
  if (!data) return null

  try {
    return JSON.parse(data) as ReturnToState
  } catch {
    return null
  }
}

export function clearReturnTo(): void {
  removeStorage(RETURN_TO_KEY)
}

export interface CachedContentType {
  id: string
  title: string
}

export interface CachedContentTypes {
  types: CachedContentType[]
  fetchedAt: number
}

const CONTENT_TYPES_TTL = 24 * 60 * 60 * 1000

export function getContentTypesCache(): CachedContentType[] | null {
  const data = readStorage(CONTENT_TYPES_KEY)
  if (!data) return null

  try {
    const cached = JSON.parse(data) as CachedContentTypes
    if (Date.now() - cached.fetchedAt > CONTENT_TYPES_TTL) {
      return null
    }
    return cached.types
  } catch {
    return null
  }
}

export function saveContentTypesCache(types: CachedContentType[]): void {
  const cached: CachedContentTypes = {
    types,
    fetchedAt: Date.now()
  }
  writeStorage(CONTENT_TYPES_KEY, JSON.stringify(cached))
}
