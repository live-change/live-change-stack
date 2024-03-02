import { defineConfig } from 'vite'

import baseViteConfig from '@live-change/frontend-base/vite-config.js'

export default defineConfig(async ({ command, mode }) => {
  return {
    ...(await baseViteConfig({ command, mode })),


  }
})
