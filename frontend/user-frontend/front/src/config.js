import deepmerge from 'deepmerge';

import * as en from "../locales/en.js"
import { locales as autoFormLocales } from "@live-change/frontend-auto-form"

import Aura from '@primevue/themes/aura'

export default {
  defaultLocale: 'en',

  primevue: {
    theme: {
      preset: Aura,
      cssLayer: false,
      darkModeSelector: 'body'
    }
  },

  i18n: {
    messages: {
      en: deepmerge.all([
        autoFormLocales.en,
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
  }
}
