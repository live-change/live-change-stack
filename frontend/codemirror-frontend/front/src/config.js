import deepmerge from 'deepmerge'

import * as en from '../locales/en.js'
import codemirrorEn from '../locales/en.json'
import codemirrorPl from '../locales/pl.json'
import { locales as baseLocales } from '@live-change/frontend-base'

import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'

const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

export default {

  primeVue: {
    theme: {
      preset: definePreset(Aura, {
        semantic: {
          primary: Object.fromEntries(
            levels.map(level => [level, `{blue.${level}}`])
          ),
          colorScheme: {
            light: {
              surface: {
                0: '#ffffff',
                ...Object.fromEntries(
                  levels.map(level => [level, `{zinc.${level}}`])
                )
              },
              primary: {
                contrastColor: '#000000'
              }
            },
            dark: {
              surface: {
                0: '#ffffff',
                ...Object.fromEntries(
                  levels.map(level => [level, `{slate.${level}}`])
                )
              }
            }
          }
        }
      }),
      options: {
        prefix: 'p',
        darkModeSelector: '.app-dark-mode',
        cssLayer: {
          name: 'primevue',
          order: 'base, primevue'
        }
      }
    },
    ripple: true
  },

  defaultLocale: 'en',
  localeSelector: ({ headers }) => {
    const acceptLanguage = headers?.['accept-language']
    if (acceptLanguage) {
      const code = acceptLanguage.split(',')[0].trim().split('-')[0]
      if (code) return code
    }
    if (typeof window !== 'undefined') {
      const html = document.querySelector('html')
      const lang = html?.getAttribute('lang')
      if (lang) return lang.split('-')[0]
    }
    return 'en'
  },

  i18n: {
    messages: {
      en: deepmerge.all([
        baseLocales.en,
        codemirrorEn,
        en.messages
      ]),
      pl: deepmerge.all([
        baseLocales.pl,
        codemirrorPl
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
