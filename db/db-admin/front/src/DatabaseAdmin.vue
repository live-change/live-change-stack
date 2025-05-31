<template>
  <div class="min-h-screen flex relative lg:static bg-surface-50 dark:bg-surface-950 w-full">
    <div id="app-sidebar-1" class="bg-surface-0 dark:bg-surface-900 h-screen hidden lg:block
                                     flex-shrink-0 absolute lg:static left-0 top-0 z-1
                                     border-r-1 border-surface-200 dark:border-surface-700
                                     select-none" style="width:280px">
      <div class="flex flex-col h-full">
        <div class="flex items-center px-4 shrink-0 py-3">
          <!-- <img src="/images/logo.svg" alt="Image" class="h-6 w-6"> -->
          <span  class="text-secondary-400 text-surface-600 font-medium ml-2 mt-2 text-2xl">
            Databases:
          </span>
        </div>
        <div class="overflow-y-auto">
          <ul class="list-none p-2 m-0">          
            <li v-for="database in databases">
              <div class="px-6 pb-2 flex items-center justify-between text-surface-600 dark:text-surface-200
                         cursor-pointer p-ripple">
                <router-link :to="{ name: 'db:database', params: { dbName: database.id } }"
                             class="font-medium no-underline text-surface-600 dark:text-surface-200">
                  {{ database.id }}
                </router-link>
                <i class="pi pi-chevron-down"
                   v-styleclass="{ selector: `#db-menu-${database.id}`, enterFromClass: 'hidden',
                                   enterActiveClass: 'animate-slidedown', leaveToClass: 'hidden',
                                   leaveActiveClass: 'animate-slideup' }" v-ripple/>
              </div>
              <ul class="list-none p-0 m-0 ml-6 overflow-hidden hidden" :id="`db-menu-${database.id}`">
                <li>
                  <a v-ripple class="flex align-items-center cursor-pointer px-3 border-round 
                                      text-surface-700 dark:text-surface-200 no-underline
                                      hover:text-surface-900 dark:hover:text-surface-100
                                      transition-duration-150 transition-colors p-ripple"
                     v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-slidedown',
                                     leaveToClass: 'hidden', leaveActiveClass: 'animate-slideup' }">
                    <i class="pi pi-table mr-2"></i>
                    <span class="font-medium">{{ database?.tables?.length }} TABLES</span>
                    <i class="pi pi-chevron-down ml-auto"></i>
                  </a>
                  <ul class="list-none py-0 pl-3 pr-0 m-0 hidden overflow-y-hidden transition-all
                               transition-duration-400 transition-ease-in-out">
                    <li v-for="table in database?.tables">
                      <router-link
                          :to="tableLink(database.id, table)"
                          v-ripple class="flex align-items-center cursor-pointer px-3 border-round text-700 
                                            no-underline text-surface-700 dark:text-surface-200
                                            hover:text-surface-900 dark:hover:text-surface-100
                                           hover:surface-100 transition-duration-150 transition-colors p-ripple"
                                           :title="table">
                        <span class="font-medium">{{ table }}</span>
                      </router-link>
                    </li>
                  </ul>
                </li>
                <li>
                  <a v-ripple class="flex align-items-center cursor-pointer px-3 border-round 
                                      text-surface-700 dark:text-surface-200 no-underline
                                      hover:text-surface-900 dark:hover:text-surface-100
                                      transition-duration-150 transition-colors p-ripple"
                     v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-slidedown',
                                     leaveToClass: 'hidden', leaveActiveClass: 'animate-slideup' }">
                    <i class="pi pi-list mr-2"></i>
                    <span class="font-medium">{{ database?.logs?.length }} LOGS</span>
                    <i class="pi pi-chevron-down ml-auto"></i>
                  </a>
                  <ul class="list-none py-0 pl-3 pr-0 m-0 hidden overflow-y-hidden transition-all
                               transition-duration-400 transition-ease-in-out">
                    <li v-for="log in database?.logs">
                      <router-link
                          :to="logLink(database.id, log)"
                          v-ripple class="flex align-items-center cursor-pointer px-3 border-round text-700 
                                            no-underline text-surface-700 dark:text-surface-200
                                            hover:text-surface-900 dark:hover:text-surface-100
                                           hover:surface-100 transition-duration-150 transition-colors p-ripple"
                                           :title="log">
                        <span class="font-medium">{{ log }}</span>
                      </router-link>
                    </li>
                  </ul>
                </li>
                <li>
                  <a v-ripple class="flex align-items-center cursor-pointer px-3 border-round 
                                      text-surface-700 dark:text-surface-200 no-underline
                                      hover:text-surface-900 dark:hover:text-surface-100
                                      transition-duration-150 transition-colors p-ripple"
                     v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-slidedown',
                                     leaveToClass: 'hidden', leaveActiveClass: 'animate-slideup' }">
                    <i class="pi pi-external-link mr-2"></i>
                    <span class="font-medium">{{ database?.indexes?.length }} INDEXES</span>
                    <i class="pi pi-chevron-down ml-auto"></i>
                  </a>
                  <ul class="list-none py-0 pl-3 pr-0 m-0 hidden overflow-y-hidden transition-all
                               transition-duration-400 transition-ease-in-out">
                    <li v-for="index in database?.indexes">
                      <router-link
                          :to="indexLink(database.id, index)"
                          v-ripple class="flex align-items-center cursor-pointer px-3 border-round text-700 
                                            no-underline text-surface-700 dark:text-surface-200
                                            hover:text-surface-900 dark:hover:text-surface-100
                                           hover:surface-100 transition-duration-150 transition-colors p-ripple"
                                           :title="index">
                        <span class="font-medium">{{ index }}</span>
                      </router-link>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="min-h-screen flex flex-col relative flex-auto">
      <div class="flex justify-content-between align-items-center surface-0 border-bottom-1 surface-border
                    lg:hidden fixed top-25 left-5">
        <div class="flex">
          <Button v-ripple 
             icon="pi pi-arrow-right"
             v-styleclass="{ selector: '#app-sidebar-1', enterFromClass: 'hidden',
              leaveToClass: 'hidden', hideOnOutsideClick: true }" />
        </div>
      </div>
      <div v-if="viewType == 'simple'" class="p-3 lg:p-20 flex flex-col flex-auto items-center">
        <router-view></router-view>
      </div>
      <template v-if="viewType == 'wide'">
        <router-view></router-view>
      </template>
    </div>
  </div>
</template>

<script setup>

  import Button from 'primevue/button'
  import { tableLink, logLink, indexLink } from "./links.js"

  const { dbApi } = defineProps({
    dbApi: {
      type: String,
      default: 'serverDatabase'
    }
  })

  import { computed } from 'vue'

  import { useRoute } from 'vue-router'
  const route = useRoute()

  const viewType = computed(() => route?.meta?.viewType ?? 'simple' )

  import { api } from "@live-change/vue3-ssr"
  const dao = api().source
  import { live, RangeBuckets } from "@live-change/dao-vue3"

  const databases = await live(dao, {
    what: [ dbApi, 'databases' ],
    more: [
      { to: 'tables', schema: [[ dbApi, 'tablesList', { property: 'id' } ]] },
      { to: 'indexes', schema: [[ dbApi, 'indexesList', { property: 'id' } ]] },
      { to: 'logs', schema: [[ dbApi, 'logsList', { property: 'id' } ]] }
    ]
  })

</script>
