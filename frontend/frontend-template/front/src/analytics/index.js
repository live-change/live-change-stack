import { analytics } from "@live-change/vue3-components"

import './posthog.js'

analytics.on('*', (type, e) => console.log('ANALYTICS EVENT', type, e) )

analytics.on('formDone', ({ service, action }) => {

})

analytics.on('menuOpen', e => {

})

analytics.on('pageView', ({ to, fullPath }) => {

})
