import deepmerge from 'deepmerge';

import * as en from "../locales/en.js"
import { locales as autoFormLocales } from "@live-change/frontend-auto-form"
import { locales as userFrontendLocales } from "@live-change/user-frontend"

import Aura from '@primevue/themes/aura'

export default {
  defaultLocale: 'en',
  i18n: {
    messages: {
      en: deepmerge.all([
        autoFormLocales.en,
        userFrontendLocales.en,
        en.messages
      ])
    },
    numberFormats: {
      en: deepmerge.all([
        en.numberFormats
      ])
    },
    datetimeFormats: {
      en: deepmerge.all([
        en.datetimeFormats
      ])
    }
  },

  primeVue: {
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
    ripple: true
  },
}
