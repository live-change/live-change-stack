/**
 * Pure preference helpers (no DB / framework imports) — safe for unit tests.
 */

/**
 * @param {string} notificationType
 * @param {string} contactService e.g. 'email' | 'web'
 * @param {Array<{ notificationType?: string, contactService?: string, active?: boolean }>|null|undefined} defaults
 */
export function defaultChannelActive(notificationType, contactService, defaults) {
  if (!Array.isArray(defaults) || !defaults.length) return true
  const match = defaults.find(row =>
    String(row?.notificationType ?? '') === String(notificationType)
    && (
      !row.contactService
      || String(row.contactService) === String(contactService)
    )
  )
  if (!match) return true
  return match.active !== false
}

/**
 * @param {{ active?: boolean }|null|undefined} setting
 * @param {string} notificationType
 * @param {string} contactService
 * @param {Array|null|undefined} defaults
 */
export function resolveChannelActiveFromSetting(setting, notificationType, contactService, defaults) {
  if (setting && typeof setting.active === 'boolean') return setting.active
  return defaultChannelActive(notificationType, contactService, defaults)
}
