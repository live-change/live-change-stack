import { defineConfig } from 'vite'

import baseViteConfig from '@live-change/frontend-base/vite-config.js'

export default defineConfig(async ({ command, mode }) => {
  const baseConfig = (await baseViteConfig({ command, mode }))
  return {
    ...baseConfig,

    resolve: {
      alias: [
        ...baseConfig.resolve.alias,
/*        { find: 'vue', replacement: 'vue/dist/vue.esm-bundler.js' },
        { find: 'vue/server-renderer', replacement: 'vue/server-renderer' },*/
      ]
    }
  }
})
