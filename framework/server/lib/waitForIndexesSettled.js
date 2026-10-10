import { startupLog } from './startupLog.js'

/**
 * After updateServices and before services.start: wake sleeping indexes whose
 * sources are now ready, then wait until none are CREATING/UPDATING.
 * SLEEPING (missing source) is already settled and does not block startup.
 * Disabled with settings.waitForIndexesOnStart === false.
 * Unknown request (older db-server) is logged and ignored.
 */
export async function waitForIndexesSettled(app, settings = {}) {
  if(settings.waitForIndexesOnStart === false) {
    startupLog('waitForIndexesSettled skipped')
    return { skipped: true }
  }
  try {
    const result = await app.dao.request(['database', 'whenIndexesSettled'], app.databaseName)
    if(result?.waited?.length) {
      startupLog('waitForIndexesSettled caught up', result.waited.map(i => i.name).join(', '))
    } else {
      startupLog('waitForIndexesSettled nothing to wait for')
    }
    return result
  } catch(e) {
    startupLog('waitForIndexesSettled unavailable, proceeding', e?.message || e)
    return { skipped: true, error: e?.message || String(e) }
  }
}

export default waitForIndexesSettled
