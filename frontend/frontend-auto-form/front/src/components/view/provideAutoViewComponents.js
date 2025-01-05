import { provideComponent } from '@live-change/vue3-components'
import { defineAsyncComponent } from 'vue'

export default function provideAutoViewComponents() {
  provideComponent({
    name: 'AutoView',
    type: 'Object'
  }, defineAsyncComponent(() => import('./ObjectView.vue')))

  provideComponent({
    name: 'AutoView',
    type: 'String'
  }, defineAsyncComponent(() => import('./StringView.vue')))
}