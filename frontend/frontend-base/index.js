import ComponentDialog from "./ComponentDialog.vue"
export { ComponentDialog }

import ViewRoot from "./ViewRoot.vue"
import Page from "./Page.vue"
import UpdateBanner from "./UpdateBanner.vue"

export { ViewRoot, Page, UpdateBanner }

import { useHost } from "./host.js"
export { useHost }

import { useResponse } from "./response.js"
export { useResponse }

import { now, realTime, currentTime } from "./time.js"
export { now, realTime, currentTime }

import en from "./locales/en.json"
import pl from "./locales/pl.json"
const locales = { en, pl }
export { locales }
