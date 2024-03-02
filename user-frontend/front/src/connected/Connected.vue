<template>
  <div class="w-full lg:w-6 md:w-9">

    <ConfirmPopup v-if="isMounted" />
    <Toast v-if="isMounted" />

    <div class="surface-card border-round shadow-2 p-4">
      <div class="text-900 font-medium mb-3 text-xl">Connected accounts</div>

      <ul class="list-none p-0 m-0 mt-5 mb-4">

        <li v-for="connection in emails"
            class="flex flex-row align-items-center justify-content-between mb-2">
          <div class="flex flex-row align-items-center">
            <i class="pi pi-envelope mr-2"></i>
            <span class="block text-900 font-medium text-lg">{{ connection.email }}</span>
          </div>
          <Button class="p-button-text p-button-plain p-button-rounded mr-1" icon="pi pi-times"
                  v-if="canDelete"
                  @click="event => disconnect(event, 'email', connection.email)" />
        </li>

      </ul>

      <div class="flex flex-row">
        <router-link :to="{ name: 'user:connect' }" class="mr-2 no-underline">
          <Button label="Connect Account" icon="pi pi-user-plus" class="p-button-lg" id="connect"></Button>
        </router-link>
      </div>
    </div>

  </div>
</template>

<script setup>
  import Button from "primevue/button"
  import SettingsTabs from "../SettingsTabs.vue"

  import { ref, onMounted, onUnmounted, inject, computed } from 'vue'
  import ConfirmPopup from 'primevue/confirmpopup'
  import Toast from 'primevue/toast'
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()
  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  let isMounted = ref(false)
  onMounted(() => isMounted.value = true)
  onUnmounted(() => isMounted.value = false)


  const workingZone = inject('workingZone')

  import { path, live, actions } from '@live-change/vue3-ssr'
  const messageAuthenticationApi = actions().messageAuthentication

  function disconnect(event, contactType, contact) {
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to disconnect ${contactType} account ${contact}?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        const upperCaseType = contactType[0].toUpperCase() + contactType.slice(1)
        workingZone.addPromise('disconnectContact', (async () => {
          await messageAuthenticationApi['disconnect'+upperCaseType]({ [contactType]: contact })
          toast.add({ severity: 'info', summary: 'Account disconnected', life: 1500 })
        })())
      },
      reject: () => {
        toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

  const emails = await live(path().email.myUserEmails({}))

  const allAccountsCount = computed(() => emails.value?.length )
  const canDelete = computed(() => allAccountsCount.value > 1 )

</script>

<style>

</style>
