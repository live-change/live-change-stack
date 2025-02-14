<template>
  <a v-if="unreadNotificationsCount"
     v-ripple
     v-styleclass="{ selector: '@next', enterFromClass: 'hidden', leaveToClass: 'hidden', hideOnOutsideClick: true }"
     class="flex mx-0 pl-4 pr-6  pt-3 pb-2 items-center text-surface-500 dark:text-surface-400
            hover:text-surface-900 hover:dark:text-surface-100 overflow-visible
            font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple">
    <OverlayBadge v-if="unreadNotificationsCount?.count" :value="unreadNotificationsCount?.count ?? 0" size="small">
      <i class="pi pi-bell" style="font-size: 2rem" />
    </OverlayBadge>
  </a>
  <div
       class="align-items-center flex-grow-1 justify-content-between hidden absolute w-full md:w-auto
         bg-surface-0 dark:bg-surface-950
         right-0 top-full z-1 shadow overflow-x-hidden overflow-y-auto"
       style="max-height: calc(100vh - 8rem)">
    <loading-zone suspense>
      <template v-slot:loading>
        <div class="flex items-center justify-center top-0 left-0 notifications-loading">
          <ProgressSpinner animationDuration=".5s"/>
        </div>
      </template>
      <template v-slot:default="{ isLoading }">
        <working-zone>
          <template v-slot:working>
            <div class="fixed w-full h-full flex items-center justify-center top-0 left-0">
              <ProgressSpinner animationDuration=".5s"/>
            </div>
          </template>
          <template v-slot:default="{ isWorking }">
            <div :style="(isWorking || isLoading) ? 'filter: blur(4px)' : ''" class="working-blur">
              <NotificationsList />
            </div>
          </template>
        </working-zone>
      </template>
    </loading-zone>
  </div>
</template>

<script setup>

  import OverlayBadge from "primevue/overlaybadge"
  import ProgressSpinner from "primevue/progressspinner"

  import NotificationsList from "./NotificationsList.vue"

  import { ref, onMounted } from 'vue'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { live, usePath } from '@live-change/vue3-ssr'

  const path = usePath()

  const unreadNotificationsCount = await live(path.notification.myUnreadCount({ }))

</script>

<style>
  .notifications-loading {
    height: 300px;
    max-height: 80%;
  }
</style>