import { analytics } from "@live-change/vue3-components"

analytics.on('*', (type, e) => console.log('ANALYTICS EVENT', type, e) )

analytics.on('formDone', ({ service, action }) => {

})

analytics.on('menuOpen', e => {

})

analytics.on('pageView', ({ to, fullPath }) => {

})
