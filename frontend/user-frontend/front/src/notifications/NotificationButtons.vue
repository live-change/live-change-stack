<template>
  <div class="notification-buttons">
    <Button v-if="notification.readState === 'new'" @click="markRead()"
            icon="pi pi-eye" class="p-button-rounded p-button-outlined bg-surface-0 dark:bg-surface-900 " />
    <Button v-if="notification.readState === 'read'" @click="markUnread()"
            icon="pi pi-eye-slash" class="p-button-rounded p-button-outlined bg-surface-0 dark:bg-surface-900" />
    <Button @click="deleteNotification()"
            icon="pi pi-trash" class="p-button-rounded p-button-outlined ml-1 bg-surface-0 dark:bg-surface-900" />
  </div>
</template>

<script setup>
  import Button from "primevue/button"

  import { useToast } from 'primevue/usetoast'
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()
  const toast = useToast()

  import { actions } from "@live-change/vue3-ssr"

  import { inject, defineProps, defineExpose } from "vue"

  const { notification } = defineProps({
    notification: {
      type: Object,
      required: true
    }
  })

  const workingZone = inject('workingZone')

  const notificationApi = actions().notification

  function markRead() {
    workingZone.addPromise('markNotificationRead', (async () => {
      await notificationApi.markRead({ notification: notification.to || notification.id })
      toast.add({
        severity: 'success', summary: 'Notification read',
        detail:'Notification has been marked as read', life: 3000
      })
    })())
  }

  function markUnread() {
    workingZone.addPromise('markNotificationUnread', (async () => {
      await notificationApi.markUnread({ notification: notification.to || notification.id })
      toast.add({
        severity: 'success', summary: 'Notification unread',
        detail:'Notification has been marked as unread', life: 3000
      })
    })())
  }

  function deleteNotification() {
    workingZone.addPromise('deleteNotification', (async () => {
      await notificationApi.delete({ notification: notification.to || notification.id })
      toast.add({
        severity: 'warn', summary: 'Notification deleted',
        detail: 'Notification has been deleted', life: 3000
      })
    })())
  }

  defineExpose({
    markRead, markUnread, deleteNotification
  })

</script>

<style scoped>

</style>
