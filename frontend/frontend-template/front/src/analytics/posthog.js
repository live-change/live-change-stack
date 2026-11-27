import { analytics } from '@live-change/vue3-components'
import posthog from 'posthog-js'

// Set per project. An empty key keeps the starter from sending events.
const POSTHOG_KEY = ''

function isAnalyticsGranted(value) {
  return value === true || value === 'true'
}

function sharedContact(list, type) {
  const row = (list ?? []).find(item => item?.type === type)
  if (!row) return undefined
  return row.id || row.email || row.phone
}

function personName(record) {
  if (record?.name) return record.name
  const parts = [record?.firstName, record?.lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : undefined
}

if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: 'https://eu.i.posthog.com',
    ui_host: 'https://eu.posthog.com',
    // Pending and rejected visitors are counted without a cookie. Opt-in switches to cookies.
    cookieless_mode: 'on_reject',
    opt_out_capturing_by_default: true,
    person_profiles: 'identified_only',
    capture_pageview: false
  })

  let lastIdentification = null
  let analyticsGranted = false
  let hadIdentifiedUser = false

  let lastPageviewUrl = ''

  function capturePageview() {
    const url = window.location.href
    if (url === lastPageviewUrl) return
    lastPageviewUrl = url
    posthog.capture('$pageview', {
      $current_url: url
    })
  }

  // First afterEach often fires before this module is imported, so send the landing hit here.
  capturePageview()

  function applyIdentification() {
    if (!lastIdentification?.user) {
      if (hadIdentifiedUser) {
        posthog.reset()
        hadIdentifiedUser = false
      }
      return
    }
    if (!analyticsGranted) return
    const identification = lastIdentification
    const record = identification?.identification
    const email = sharedContact(record?.contactsShared, 'email')
      || (identification?.contacts ?? []).find(c => c.contactType === 'email')?.email
    const phone = sharedContact(record?.contactsShared, 'phone')
      || (identification?.contacts ?? []).find(c => c.contactType === 'phone')?.phone
    posthog.identify(identification.user, {
      user: identification.user,
      email,
      phone,
      firstName: record?.firstName,
      lastName: record?.lastName,
      name: personName(record),
      title: record?.title
    })
    hadIdentifiedUser = true
  }

  analytics.on('consent', (payload) => {
    analyticsGranted = isAnalyticsGranted(payload?.analytics)
    if (analyticsGranted) {
      posthog.opt_in_capturing()
      applyIdentification()
    } else {
      posthog.opt_out_capturing()
    }
  })

  analytics.on('user:identification', (identification) => {
    lastIdentification = identification
    applyIdentification()
  })

  analytics.on('pageView', (to) => {
    posthog.register({
      route: {
        name: to.name,
        params: to.params
      }
    })
    capturePageview()
  })

  analytics.on('locale', (record) => {
    const language = record?.language
    if (!language) return
    posthog.register({ language })
  })

  const ignored = ['user:identification', 'pageView', 'consent', 'locale']

  analytics.on('*', (type, event) => {
    if (ignored.includes(type)) return
    posthog.capture(type, event)
  })
}
