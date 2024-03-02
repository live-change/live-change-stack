import deepmerge from 'deepmerge';

import blogEn from "../locales/en.json"
import { locales as autoFormLocales } from "@live-change/frontend-auto-form"

export default {
  i18n: {
    messages: {
      en: deepmerge.all([
        blogEn,
        autoFormLocales.en
      ])
    }
  }
}
