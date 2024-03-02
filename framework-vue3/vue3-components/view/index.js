import ScrollLoader from "./ScrollLoader.vue"
import VisibleArea from "./VisibleArea.vue"
import RangeViewer from "./RangeViewer.vue"

export { ScrollLoader, VisibleArea, RangeViewer }

function registerViewComponents(app) {
  app.component("scroll-loader", ScrollLoader)
  app.component("visible-area", VisibleArea)  
}

export { registerViewComponents }