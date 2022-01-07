import Vue from 'vue'
import App from './App.vue'
import router from './router'
import api from 'api'

import "@/components/registerGlobal.js"

Vue.config.productionTip = false

import 'vue-prism-editor/dist/prismeditor.min.css'
import 'prismjs/themes/prism-coy.css'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'

import { PrismEditor } from 'vue-prism-editor'
Vue.component('PrismEditor', PrismEditor)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
