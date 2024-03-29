<template>
  <div class="min-h-screen flex relative lg:static surface-ground w-full">
    <div id="app-sidebar-1" class="surface-section h-screen hidden lg:block flex-shrink-0 absolute lg:static left-0
                                     top-0 z-1 border-right-1 surface-border select-none" style="width:280px">
      <div class="flex flex-column h-full">
        <div class="flex align-items-center px-5 flex-shrink-0" style="height:60px">
          <img src="/images/logo.svg" alt="Image" height="30">
        </div>
        <div class="overflow-y-auto">
          <ul class="list-none p-2 m-0">
            <li v-for="database in databases">
              <div  class="p-3 flex align-items-center justify-content-between text-600 cursor-pointer p-ripple">
                <router-link :to="{ name: 'db:database', params: { dbName: database.id } }"
                             class="font-medium no-underline text-600">
                  {{ database.id }}
                </router-link>
                <i class="pi pi-chevron-down"
                   v-styleclass="{ selector: `#db-menu-${database.id}`, enterClass: 'hidden',
                                   enterActiveClass: 'slidedown', leaveToClass: 'hidden',
                                   leaveActiveClass: 'slideup' }" v-ripple/>
              </div>
              <ul class="list-none p-0 m-0 ml-3 overflow-hidden hidden" :id="`db-menu-${database.id}`">
                <li>
                  <a v-ripple class="flex align-items-center cursor-pointer p-3 border-round text-700
                                      hover:surface-100 transition-duration-150 transition-colors p-ripple"
                     v-styleclass="{ selector: '@next', enterClass: 'hidden', enterActiveClass: 'slidedown',
                                     leaveToClass: 'hidden', leaveActiveClass: 'slideup' }">
                    <i class="pi pi-table mr-2"></i>
                    <span class="font-medium">{{ database?.tables?.length }} TABLES</span>
                    <i class="pi pi-chevron-down ml-auto"></i>
                  </a>
                  <ul class="list-none py-0 pl-3 pr-0 m-0 hidden overflow-y-hidden transition-all
                               transition-duration-400 transition-ease-in-out">
                    <li v-for="table in database?.tables">
                      <router-link
                          :to="tableLink(database.id, table)"
                          v-ripple class="flex align-items-center cursor-pointer p-3 border-round text-700
                                           hover:surface-100 transition-duration-150 transition-colors p-ripple">
                        <span class="font-medium">{{ table }}</span>
                      </router-link>
                    </li>
                  </ul>
                </li>
                <li>
                  <a v-ripple class="flex align-items-center cursor-pointer p-3 border-round text-700
                                     hover:surface-100 transition-duration-150 transition-colors p-ripple"
                     v-styleclass="{ selector: '@next', enterClass: 'hidden', enterActiveClass: 'slidedown',
                                     leaveToClass: 'hidden', leaveActiveClass: 'slideup' }">
                    <i class="pi pi-list mr-2"></i>
                    <span class="font-medium">{{ database?.logs?.length }} LOGS</span>
                    <i class="pi pi-chevron-down ml-auto"></i>
                  </a>
                  <ul class="list-none py-0 pl-3 pr-0 m-0 hidden overflow-y-hidden transition-all
                               transition-duration-400 transition-ease-in-out">
                    <li v-for="log in database?.logs">
                      <router-link
                          :to="logLink(database.id, log)"
                          v-ripple class="flex align-items-center cursor-pointer p-3 border-round text-700
                                          hover:surface-100 transition-duration-150 transition-colors p-ripple">
                        <span class="font-medium">{{ log }}</span>
                      </router-link>
                    </li>
                  </ul>
                </li>
                <li>
                  <a v-ripple class="flex align-items-center cursor-pointer p-3 border-round text-700
                                     hover:surface-100 transition-duration-150 transition-colors p-ripple"
                     v-styleclass="{ selector: '@next', enterClass: 'hidden', enterActiveClass: 'slidedown',
                                     leaveToClass: 'hidden', leaveActiveClass: 'slideup' }">
                    <i class="pi pi-external-link mr-2"></i>
                    <span class="font-medium">{{ database?.indexes?.length }} INDEXES</span>
                    <i class="pi pi-chevron-down ml-auto"></i>
                  </a>
                  <ul class="list-none py-0 pl-3 pr-0 m-0 hidden overflow-y-hidden transition-all
                               transition-duration-400 transition-ease-in-out">
                    <li v-for="index in database?.indexes">
                      <router-link
                          :to="indexLink(database.id, index)"
                          v-ripple class="flex align-items-center cursor-pointer p-3 border-round text-700
                                          hover:surface-100 transition-duration-150 transition-colors p-ripple">
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
    <div class="min-h-screen flex flex-column relative flex-auto">
      <div class="flex justify-content-between align-items-center px-5 surface-0 border-bottom-1 surface-border
                    relative lg:hidden" style="height:60px">
        <div class="flex">
          <a v-ripple class="cursor-pointer block text-700 mr-3 p-ripple"
             v-styleclass="{ selector: '#app-sidebar-1', enterClass: 'hidden', enterActiveClass: 'fadeinleft', leaveToClass: 'hidden', leaveActiveClass: 'fadeoutleft', hideOnOutsideClick: true }">
            <i class="pi pi-bars text-4xl"></i>
          </a>
        </div>
      </div>
      <div v-if="viewType == 'simple'" class="p-5 flex flex-column flex-auto align-items-center">
        <router-view></router-view>
      </div>
      <template v-if="viewType == 'wide'">
        <router-view></router-view>
      </template>
    </div>
  </div>
</template>

<script setup>
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
