/**
 * Re-export framework startupLog so server package shares the same clock/delta
 * as App.updateService / database updater logs.
 */
export {
  startupLog,
  startupTimed,
  formatMs
} from '@live-change/framework/lib/utils/startupLog.js'
export { startupLog as default } from '@live-change/framework/lib/utils/startupLog.js'
