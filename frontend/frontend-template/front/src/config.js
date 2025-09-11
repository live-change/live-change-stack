import deepmerge from 'deepmerge';

import * as en from "../locales/en.js"
import { locales as autoFormLocales } from "@live-change/frontend-auto-form"
import { locales as userFrontendLocales } from "@live-change/user-frontend"
import { locales as accessControlLocales } from "@live-change/access-control-frontend"
import { locales as baseLocales } from "@live-change/frontend-base"
import { locales as contentLocales } from "@live-change/content-frontend"
import { locales as imageLocales } from "@live-change/image-frontend"
import { locales as peerConnectionLocales } from "@live-change/peer-connection-frontend"
import { locales as taskLocales } from "@live-change/task-frontend"
import { locales as uploadLocales } from "@live-change/upload-frontend"
import { locales as urlLocales } from "@live-change/url-frontend"
import { locales as videoCallLocales } from "@live-change/video-call-frontend"
import { locales as wysiwygLocales } from "@live-change/wysiwyg-frontend"
import { locales as blogLocales } from "@live-change/blog-frontend"

import Aura from '@primeuix/themes/aura'

export default {

  primeVue: {
    theme: {
      preset: Aura,
      options: {
        prefix: 'p',
        darkModeSelector: '.app-dark-mode:not(.email-rendering)',
        cssLayer: {
          name: "primevue",
          order: "base, primevue",
        },
      }
    },
    ripple: true
  },

  defaultLocale: 'en',
  localeSelector: ({ api, host, url, headers }) => {
    let locale = 'en'
    const acceptLanguage = headers?.['accept-language']
    if(acceptLanguage) {
      locale = acceptLanguage?.split(',')[0]
    }
    if(typeof window !== 'undefined') {     
      const html = document.querySelector('html')
      const lang = html.getAttribute('lang')
      if(html) {
        locale = lang?.split('-')[0]
      }
    }
    return locale || 'en'
  },
  i18n: {
    messages: {
      en: deepmerge.all([
        baseLocales.en,
        autoFormLocales.en,
        userFrontendLocales.en,
        accessControlLocales.en,
        contentLocales.en,
        imageLocales.en,
        peerConnectionLocales.en,
        taskLocales.en,
        uploadLocales.en,
        urlLocales.en,
        videoCallLocales.en,
        wysiwygLocales.en,
        blogLocales.en,
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

}
