import ScrollLoader from "./ScrollLoader.vue"
import VisibleArea from "./VisibleArea.vue"

export { ScrollLoader, VisibleArea }

function registerViewComponents(app) {
  app.component("scroll-loader", ScrollLoader)
  app.component("visible-area", VisibleArea)  
}

export { registerViewComponents }