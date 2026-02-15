import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  lang: 'en-US',

  title: 'Live Change Framework',
  description: 'Live Change Framework documentation',

  theme: defaultTheme({
    logo: '/images/logo.svg',

    navbar: ['/', '/framework/', '/server/', '/relations/globals.md'],
    sidebar: {
      '/server/': [
        { text: 'Server manual', link: '/server/README.md' },
        { text: '01 Getting started', link: '/server/01-getting-started.md' },
        { text: '02 App config', link: '/server/02-app-config.md' },
        { text: '03 Services list and init', link: '/server/03-services-list-and-init.md' },
        { text: '04 Service definition', link: '/server/04-service-definition.md' },
        { text: '05 Models', link: '/server/05-models.md' },
        { text: '06 Actions', link: '/server/06-actions.md' },
        { text: '07 Views', link: '/server/07-views.md' },
        { text: '08 Triggers', link: '/server/08-triggers.md' },
        { text: '09 Relations', link: '/server/09-relations.md' },
        { text: '  09-01 propertyOf / itemOf', link: '/server/09-01-propertyOf-itemOf.md' },
        { text: '  09-02 propertyOfAny / itemOfAny', link: '/server/09-02-propertyOfAny-itemOfAny.md' },
        { text: '  09-03 userProperty / userItem', link: '/server/09-03-userProperty-userItem.md' },
        { text: '  09-04 sessionOrUserProperty / sessionOrUserItem', link: '/server/09-04-sessionOrUserProperty-sessionOrUserItem.md' },
        { text: '  09-05 contactOrUserProperty / contactOrUserItem', link: '/server/09-05-contactOrUserProperty-contactOrUserItem.md' },
        { text: '  09-06 boundTo / relatedTo', link: '/server/09-06-boundTo-relatedTo.md' },
        { text: '10 Simple query (WIP)', link: '/server/10-simple-query.md' },
        { text: '11 Indexes and foreign models', link: '/server/11-indexes-and-foreign-models.md' },
        { text: '12 Security and access', link: '/server/12-security-and-access.md' },
        { text: '13 Custom services in project', link: '/server/13-custom-services-in-project.md' },
        { text: '14 Tasks', link: '/server/14-tasks.md' },
        { text: '15 Cron and intervals', link: '/server/15-cron-and-intervals.md' },
        { text: '16 Timers', link: '/server/16-timers.md' },
        { text: '17 Email and SMS', link: '/server/17-email-and-sms.md' },
      ],
    },
  }),

  bundler: viteBundler(),
})
