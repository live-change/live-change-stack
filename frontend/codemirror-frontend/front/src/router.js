import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

export function createRouter() {
  const router = _createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
      {
        name: 'codemirror:editor',
        path: '/',
        component: () => import('./components/CodeEditor.vue')
      }
    ]
  })
  return router
}

