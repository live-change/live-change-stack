import ScrollLoader from "./ScrollLoader.vue"
import VisibleArea from "./VisibleArea.vue"
import RangeViewer from "./RangeViewer.vue"
import ReactiveRangeViewer from "./ReactiveRangeViewer.vue"

export { ScrollLoader, VisibleArea, RangeViewer, ReactiveRangeViewer }

function registerViewComponents(app) {
  app.component("scroll-loader", ScrollLoader)
  app.component("visible-area", VisibleArea)
  app.component("reactive-range-viewer", ReactiveRangeViewer)
}

export { registerViewComponents }