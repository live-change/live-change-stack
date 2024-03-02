import deepmerge from 'deepmerge';

import contentEn from "../locales/en.json"
import { locales as autoFormLocales } from "@live-change/frontend-auto-form"

export default {
  i18n: {
    messages: {
      en: deepmerge.all([
        contentEn,
        autoFormLocales.en
      ])
    }
  }
}
