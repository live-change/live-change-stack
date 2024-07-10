import deepmerge from 'deepmerge';


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
  }
}
