<template>
  <a v-if="unreadNotificationsCount"
     v-ripple
     v-styleclass="{ selector: '@next', enterClass: 'hidden', leaveToClass: 'hidden', hideOnOutsideClick: true }"
     class="flex mx-0 pl-3 pr-5 p-3 py-3 align-items-center text-600 hover:text-900 overflow-visible
            font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple">
    <i class="pi pi-bell text-base text-2xl p-overlay-badge">
      <Badge v-if="unreadNotificationsCount?.count" :value="unreadNotificationsCount?.count ?? 0"></Badge>
    </i>
  </a>
  <div
       class="align-items-center flex-grow-1 justify-content-between hidden absolute w-full md:w-auto surface-overlay
         right-0 top-100 z-1 shadow-2 overflow-x-hidden overflow-y-auto"
       style="max-height: calc(100vh - 8rem)">
    <loading-zone suspense  v-if="isMounted">
      <template v-slot:loading>
        <div class="flex align-items-center justify-content-center top-0 left-0 notifications-loading">
          <ProgressSpinner animationDuration=".5s"/>
        </div>
      </template>
      <template v-slot:default="{ isLoading }">
        <working-zone>
          <template v-slot:working>
            <div class="fixed w-full h-full flex align-items-center justify-content-center top-0 left-0">
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

  import Badge from "primevue/badge"
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