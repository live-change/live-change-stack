<template>
  <a v-if="unreadNotificationsCount"
     v-ripple
     @click="showNotifications"
     class="flex mx-2 px-3 p-3 py-3 align-items-center text-600 hover:text-900 hover:surface-100
            font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple">
    <i class="pi pi-bell text-base text-2xl p-overlay-badge">
      <Badge v-if="unreadNotificationsCount?.count" :value="unreadNotificationsCount?.count ?? 0"></Badge>
    </i>
  </a>
  <OverlayPanel v-if="isMounted" ref="overlayPanel" class="notifications-panel">
    <loading-zone suspense>
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
  </OverlayPanel>
</template>

<script setup>

  import Badge from "primevue/badge"
  import OverlayPanel from 'primevue/overlaypanel'
  import ProgressSpinner from "primevue/progressspinner"

  import NotificationsList from "./NotificationsList.vue"

  import { ref, onMounted } from 'vue'

  const overlayPanel = ref()

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  function showNotifications(event) {
    overlayPanel.value.toggle(event)
  }

  import { live, path } from '@live-change/vue3-ssr'

  const unreadNotificationsCount = await live(path().notification.myUnreadCount({ }))

</script>

<style>
  .notifications-panel .p-overlaypanel-content {
    padding: 0px;
    max-height: calc(90vh - 50px);
    overflow-y: auto;
  }
  .notifications-panel {
    width: 500px;
    max-width: 80%;
  }
  .notifications-loading {
    height: 300px;
    max-height: 80%;
  }
</style>