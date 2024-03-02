<template>
  <SimpleNotification :notification="notification">
    <div>
      <UserIdentification :ownerType="notification.fromType" :owner="notification.from"
                        :data="notification.fromIdentification" inline />
      Invited you to
      <ObjectIdentification :objectType="notification.objectType" :object="notification.object" />
    </div>
    <div class="mt-2 ml-4" v-if="!notification.state">
      <Button label="Accept" icon="pi pi-check" class="p-button-sm mr-2" @click="acceptInvitation" />
      <Button label="Ignore" icon="pi pi-times" class="p-button-sm" @click="deleteNotification" />
    </div>
<!--    <pre class="w-full overflow-hidden">{{ notification }}</pre>-->
  </SimpleNotification>
</template>

<script setup>

  import { SimpleNotification, UserIdentification, ObjectIdentification } from "@live-change/user-frontend"
  import Button from "primevue/button"

  import { useToast } from 'primevue/usetoast'
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()
  const toast = useToast()

  const { notification } = defineProps({
    notification: {
      type: Object,
      required: true
    }
  })

  import { inject } from "vue"
  const workingZone = inject('workingZone')

  import { actions } from "@live-change/vue3-ssr"

  const notificationApi = actions().notification
  const accessControlApi = actions().accessControl

  function deleteNotification() {
    workingZone.addPromise('deleteNotification', (async () => {
      await notificationApi.delete({ notification: notification.to || notification.id })
      toast.add({
        severity: 'warn', summary: 'Notification deleted',
        detail: 'Notification has been deleted', life: 3000
      })
    })())
  }

  function acceptInvitation() {
    workingZone.addPromise('acceptInvitation', (async () => {
      const { objectType, object } = notification
      await Promise.all([
        accessControlApi.acceptInvitation({ objectType, object }),
        notificationApi.markRead({ notification: notification.to || notification.id }),
        notificationApi.mark({ notification: notification.to || notification.id, state: 'accepted' })
      ])
      toast.add({
        severity: 'success', summary: 'Invitation Accepted',
        detail: 'Invitation has been accepted', life: 3000
      })
    })())
  }

</script>

<style scoped>

</style>
