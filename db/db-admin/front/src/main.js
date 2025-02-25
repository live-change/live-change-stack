import { createSSRApp } from 'vue'
import { createHead } from "@vueuse/head"

import { registerComponents } from '@live-change/vue3-components'
import ReactiveDaoVue from '@live-change/dao-vue3'

import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import { PrimeVueConfirmSymbol } from 'primevue/useconfirm'
import { PrimeVueToastSymbol } from 'primevue/usetoast'
import ToastService from 'primevue/toastservice'
import StyleClass from 'primevue/styleclass'
import Ripple from 'primevue/ripple'
import BadgeDirective from 'primevue/badgedirective'
import Aura from '@primevue/themes/aura'
import App from './App.vue'
import Page from './Page.vue'
import { createRouter } from './router'

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp(api) {
  const app = createSSRApp(App)
  app.config.devtools = true

  api.installInstanceProperties(app.config.globalProperties)

  registerComponents(app) 
  app.use(ReactiveDaoVue, { dao: api })
  
  const router = createRouter(app)
  app.use(router)

  app.use(PrimeVue, {
    ripple: true,
    theme: {
      preset: Aura,
      options: {
        prefix: 'p',
        darkModeSelector: '.app-dark-mode, .app-dark-mode *',
        //cssLayer: false
        cssLayer: {
          name: "primevue",
          order: "base, primevue",
        },
      }
    },
  })

  app.use(ConfirmationService)
  app.provide(PrimeVueConfirmSymbol, app.config.globalProperties.$confirm)

  app.use(ToastService)
  app.provide(PrimeVueToastSymbol, app.config.globalProperties.$toast)

  app.directive('styleclass', StyleClass)
  app.directive('ripple', Ripple)
  app.directive('badge', BadgeDirective)

  const head = createHead()
  app.use(head)

  return { app, router, head }
}
