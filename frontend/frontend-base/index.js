import ComponentDialog from "./ComponentDialog.vue"
export { ComponentDialog }

import ViewRoot from "./ViewRoot.vue"
import Page from "./Page.vue"
import NavBar from "./NavBar.vue"
import UpdateBanner from "./UpdateBanner.vue"

export { ViewRoot, Page, NavBar, UpdateBanner }

import { useHost } from "./host.js"
export { useHost }

import { useResponse } from "./response.js"
export { useResponse }

import { now, realTime, currentTime } from "./time.js"
export { now, realTime, currentTime }

import en from "./locales/en.json"
const locales = { en }
export { locales }
