import Loading from "./Loading.vue"
import LoadingZone from "./LoadingZone.vue"
import WorkingZone from "./WorkingZone.vue"
import Observe from "./Observe.vue"

export { Loading, LoadingZone, WorkingZone, Observe }

import { analytics, useAnalytics, installRouterAnalytics } from "./analytics.js"
export { analytics, useAnalytics, installRouterAnalytics }

import { synchronized } from "./synchronized.js"
export { synchronized }

import { synchronizedList } from "./synchronizedList.js"
export { synchronizedList }

import { defaultData, validateData } from "./data.js"
export { defaultData, validateData }

function registerLogicComponents(app) {
  app.component("loading", Loading)
  app.component("loading-zone", LoadingZone)
  app.component("working-zone", WorkingZone)
  app.component("observe", Observe)
}

export { registerLogicComponents }
