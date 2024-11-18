<template>
  <div class="flex align-items-center justify-content-between mb-1 px-3 pt-1">
    <div class="text-900 font-medium text-xl">Notifications</div>
    <div>
      <Button @click="$refs.menu.toggle($event)"
          icon="pi pi-ellipsis-v" class="p-button-text p-button-plain p-button-rounded" />
      <Menu ref="menu" :popup="true" :model="menuItems"></Menu>
    </div>
  </div>
  <ul class="list-none p-0 m-0 notifications">
    <div v-for="(bucket, bucketIndex) in notificationsBuckets.buckets" :key="bucket.id"
         :style="{ backgroundz: `hsl(${bucket.id * 11}, 100%, 80%)` }">
      <div v-for="(notification, index) in bucket.data" :key="notification.id"
           :ref="el => bucket.domElements[index] = el"
           class="notification border-bottom-1 surface-border"
           :class="{ selected: selectedNotification === notification.to }">
        <component :is="notificationComponent(notification)" :notification="notification" />
        <div class="notification-more-button flex align-items-end justify-content-center">
          <Button @click="() => selectNotification(notification)"
                  icon="pi pi-ellipsis-h" class="p-button-rounded p-button-text " />
        </div>
        <NotificationButtons :notification="notification" />
      </div>
    </div>
    <scroll-border placement="bottom"
                   :load="notificationsBuckets.loadBottom"
                   :canLoad="notificationsBuckets.canLoadBottom" />
  </ul>
</template>

<script setup>
  import Button from "primevue/button"
  import Menu from "primevue/menu"

  import ScrollBorder from 'vue3-scroll-border'

  import { useToast } from 'primevue/usetoast'
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()
  const toast = useToast()


  import { ref, inject } from 'vue'

  const workingZone = inject('workingZone')

  import { notificationTypes } from "./notificationTypes.js"

  import NotificationButtons from "./NotificationButtons.vue"

  import { actions, api, rangeBuckets, reverseRange } from '@live-change/vue3-ssr'

  const notificationApi = actions().notification

  function notificationComponent(notification) {
    const known = notificationTypes[notification.notificationType]
    if(known) return known.component
    return notificationTypes.unknown.component
  }

  const selectedNotification = ref(null)
  function selectNotification(notification) {
    console.log("SELECT NOTIFICATION", notification)
    selectedNotification.value = notification.to
  }

  const menuItems = [
    {
      label: 'Mark all as read',
      icon: 'pi pi-check',
      command: () => {
        workingZone.addPromise('markNotification', (async () => {
          await notificationApi.markAllAsRead({ })
          toast.add({
            severity: 'success', summary:' Notifications read',
            detail:'all notifications have been marked as read', life: 3000
          })
        })())
      }
    },
    {
      label: 'Delete all',
      icon: 'pi pi-times',
      command: () => {
        workingZone.addPromise('markNotification', (async () => {
          await notificationApi.deleteAll({ })
          toast.add({
            severity: 'warn', summary: 'Notifications deleted',
            detail: 'All notifications have been deleted', life: 3000
          })
        })())
      }
    },
  ]

  const [ notificationsBuckets ] = await Promise.all([
    rangeBuckets(
        (range, p) => p.notification.myNotifications(reverseRange(range)),
        { bucketSize: 10 }
    )
  ])

</script>

<style lang="scss">
  .notifications {
    .notification:last-child {
      border-bottom: none;
    }
    .notification {
      position: relative;
      .notification-buttons {
        visibility: hidden;
        position: absolute;
        right: 40px;
        bottom: 5px;
        //transform: translate(0, -50%);
      }
      .notification-more-button {
        position: absolute;
        right: 0px;
        bottom: -5px;
        height: 100%;
      }
    }
    .notification.selected {
      .notification-buttons {
        visibility: visible;
      }
      .notification-more-button {
        visibility: hidden;
      }
    }
    .notification:hover {
      .notification-buttons {
        visibility: visible;
      }
      .notification-more-button {
        visibility: hidden;
      }
    }

  }
</style>
