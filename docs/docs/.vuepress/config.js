import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  lang: 'en-US',

  title: 'Live Change Framework',
  description: 'Live Change Framework documentation',

  theme: defaultTheme({
    logo: '/images/logo.svg',

    navbar: ['/', '/framework/', '/relations/globals.md'],
  }),

  bundler: viteBundler(),
})
