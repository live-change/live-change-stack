import { createSSRApp } from 'vue'
import { createMetaManager } from 'vue-meta'

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

import App from './App.vue'
import Page from './Page.vue'
import { createRouter } from './router'

import emailValidator from "@live-change/email-service/clientEmailValidator.js"
import passwordValidator from "@live-change/password-authentication-service/clientPasswordValidator.js"

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp(api) {
  api.validators.email = emailValidator
  api.validators.password = passwordValidator

  const app = createSSRApp(App)
  app.config.devtools = true

  api.installInstanceProperties(app.config.globalProperties)

  registerComponents(app) 
  app.use(ReactiveDaoVue, { dao: api })
  
  const router = createRouter(app)
  app.use(router)

  app.use(PrimeVue, {
    ripple: true
  })

  app.use(ConfirmationService)
  app.provide(PrimeVueConfirmSymbol, app.config.globalProperties.$confirm)

  app.use(ToastService)
  app.provide(PrimeVueToastSymbol, app.config.globalProperties.$toast)

  app.directive('styleclass', StyleClass)
  app.directive('ripple', Ripple)
  app.directive('badge', BadgeDirective)

  const meta = createMetaManager({
    isSSR: import.meta.env.SSR
  })
  app.use(meta)

  return { app, router }
}
