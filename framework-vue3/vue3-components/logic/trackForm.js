import { analytics } from './analytics.js'

function formErrorName(error) {
  const keys = error?.properties && Object.keys(error.properties)
  if (keys?.length) return keys[0]
  return 'unknownError'
}

function contextFields(context) {
  const extra = typeof context === 'function' ? context() : context
  if (!extra || typeof extra !== 'object') return {}
  return extra
}

function formPayload(meta) {
  return {
    ...contextFields(meta.context),
    service: meta.service,
    action: meta.action
  }
}

async function trackForm(meta, run) {
  const payload = formPayload(meta)
  analytics.emit('form', payload)
  try {
    const result = await run()
    analytics.emit('formDone', payload)
    return result
  } catch (error) {
    analytics.emit('formError', {
      ...payload,
      error: formErrorName(error)
    })
    throw error
  }
}

export { trackForm, formErrorName }
