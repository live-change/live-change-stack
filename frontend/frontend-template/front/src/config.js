import deepmerge from 'deepmerge';

import * as exchangeEn from "../locales/en.js"
import { locales as autoFormLocales } from "@live-change/frontend-auto-form"

export default {
  i18n: {
    messages: {
      en: deepmerge.all([
        autoFormLocales.en,
        exchangeEn.messages
      ])
    },
    numberFormats: {
      en: deepmerge.all([
        exchangeEn.numberFormats
      ])
    },
    datetimeFormats: {
      en: deepmerge.all([
        exchangeEn.datetimeFormats
      ])
    }
  }
}
