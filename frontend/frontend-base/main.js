import { createSSRApp, createApp as createSPAApp } from 'vue'

import { registerComponents, useLocale } from '@live-change/vue3-components'
import ReactiveDaoVue from '@live-change/dao-vue3'

import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import { PrimeVueConfirmSymbol } from 'primevue/useconfirm'
import ToastService from 'primevue/toastservice'
import { PrimeVueToastSymbol } from 'primevue/usetoast'
import DialogService from 'primevue/dialogservice'
import { PrimeVueDialogSymbol } from 'primevue/usedialog'
import StyleClass from 'primevue/styleclass'
import Ripple from 'primevue/ripple'
import BadgeDirective from 'primevue/badgedirective'
import VueLazyLoad from 'vue3-lazyload'
import { createI18n } from 'vue-i18n'
import { createHead } from "@vueuse/head"

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export async function createApp(config, api, App, createRouter, host, headers, response, url) {
    
  if(config.beforeStart) await config.beforeStart({ api })

  const isSSR = response !== undefined
  const isSPA = (typeof window !== 'undefined') && !window.__DAO_CACHE__
  //console.log("IS SPA", isSPA)
  //console.log("IS SSR", isSSR)
  const app = isSPA ? createSPAApp(App) : createSSRApp(App)

  app.config.devtools = !isSSR//true

  const errorLog = []

  // Add error handler for SSR to capture setup function errors with full stack trace
  if (isSSR) {
    app.config.errorHandler = (err, instance, info) => {
      console.error('Vue SSR Error:', err.message, err.stack,
                    "IN", instance?.$?.type?.__name || instance?.$?.type?.name || 'Unknown',
                    "AT", info, "URL", url)
      errorLog.push({ message: err.message, stack: err.stack, component: instance?.$?.type?.__name || instance?.$?.type?.name || 'Unknown', info: info, url: url })
      throw err
    }
    
    app.config.warnHandler = (msg, instance, trace) => {
      console.warn('Vue SSR Warning:', msg, "IN", instance?.$?.type?.__name || instance?.$?.type?.name || 'Unknown', "AT", trace, "URL", url)
      errorLog.push({ message: msg, component: instance?.$?.type?.__name || instance?.$?.type?.name || 'Unknown', trace: trace, url: url })
    }
  }

  app.config.globalProperties.$response = response
  app.config.globalProperties.$host = host

  api.installInstanceProperties(app.config.globalProperties)

  registerComponents(app)

  app.use(ReactiveDaoVue, { dao: api })

  const router = createRouter(app)
  app.use(router)

  app.use(PrimeVue, {
    ripple: true,
    ...config.primeVue
  })

  app.use(ConfirmationService)
  //app.provide(PrimeVueConfirmSymbol, app.config.globalProperties.$confirm)

  app.use(ToastService)
  //app.provide(PrimeVueToastSymbol, app.config.globalProperties.$toast)

  app.use(DialogService)
  //app.provide(PrimeVueDialogSymbol, app.config.globalProperties.$dialog)

  const oldCommand = api.command
  api.command = async (...args) => {
    console.log("API COMMAND!")
    try {
      return await oldCommand.apply(api, args)
    } catch(error) {
      const text = error.message || error
      const toast = app.config.globalProperties.$toast
      if(text === 'notAuthorized')  toast.add({ severity:'error', summary: "Not Authorized", life: 5000 })
      throw error
    }
  }

  app.directive('styleclass', StyleClass)
  app.directive('ripple', Ripple)
  app.directive('badge', BadgeDirective)

  app.use(VueLazyLoad, {
    // options...
  })

  const head = createHead()
  app.use(head)

  app.directive("focus", {
    mounted: (el) => el.focus(),
    updated: (el, binding) => app.nextTick(() => el.focus())
  })

  const defaultLocale = config.defaultLocale || 'en'
  const selectedLocale = config.localeSelector
    ? await config.localeSelector({ api, host, url, headers })
    : defaultLocale

  const locale = useLocale(app)
  const userLocale = await locale.getLocale()
  //console.log("USER LOCALE", userLocale)

  const i18n = createI18n({
    legacy: false,
    locale: userLocale?.language ?? selectedLocale,
    fallbackLocale: config.fallbackLocale || defaultLocale,
    ...config.i18n
  })

  /* console.log("I18N CONFIG", {
    legacy: false,
    locale: userLocale?.language ?? selectedLocale,
    fallbackLocale: config.fallbackLocale || defaultLocale,
    ...config.i18n
  }) */


/*   if(typeof window !== 'undefined') { 
    window.i18n = i18n
  } */

  app.use(i18n)

  if(config.configure) await config.configure({ app, api, router, locale, i18n })

  return { app, router, head, errorLog }
}
