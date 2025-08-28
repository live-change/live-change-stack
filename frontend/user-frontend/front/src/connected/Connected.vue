<template>
  <div class="w-full lg:w-6/12 md:w-9/12 max-w-[32rem]">

    <ConfirmPopup v-if="isMounted" />
    <Toast v-if="isMounted" />

    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">Connected accounts</div>

      <ul class="list-none p-0 m-0 mt-8 mb-6">

        <li v-for="contact in contacts"
            class="flex flex-row items-center justify-between mb-2">
          <div class="flex flex-row items-center">
            <i v-if="contact.contactType.contactType === 'email'" class="pi pi-envelope mr-2"></i>
            <i v-if="contact.contactType.contactType === 'phone'" class="pi pi-mobile mr-2"></i>
            <span v-if="contact.contactType.contactType === 'phone'"
                  class="block text-surface-900 dark:text-surface-0 font-medium text-lg">{{ formatPhoneNumber(contact.id) }}</span>
            <span v-else
                  class="block text-surface-900 dark:text-surface-0 font-medium text-lg">{{ contact.id }}</span>
          </div>
          <Button class="p-button-text p-button-plain p-button-rounded mr-1" icon="pi pi-times"
                  v-if="canDelete"
                  @click="event => disconnectContact(event, contact)" />
        </li>
        <li v-for="account in accounts"
            class="flex flex-row items-center justify-between mb-2">
          <InjectComponent 
            :request="{ name: 'connectedAccountItem', accountType: account.accountType.accountType }"
            :defaultComponent="UnknownAccountItem"
            :props="{ account }" />
          <Button class="p-button-text p-button-plain p-button-rounded mr-1" icon="pi pi-times"
                  v-if="canDelete"
                  @click="event => disconnectAccount(event, account, account.email)" />
        </li>

      </ul>

      <div class="flex flex-row flex-wrap">        
        <router-link v-for="contactType in contactsTypes"
                     :to="{ name: 'user:connect-'+contactType.contactType }" class="mr-2 no-underline block mb-1">
          <Button v-if="contactType.contactType === 'email'"
                  :label="'Add '+contactType.contactType" icon="pi pi-envelope" id="connect" />
          <Button v-else-if="contactType.contactType === 'phone'"
                  :label="'Add '+contactType.contactType" icon="pi pi-phone" id="connect" />
          <Button v-else :label="'Add '+contactType.contactType" icon="pi pi-envelope" id="connect" />
        </router-link>
        <template v-for="accountType in accountTypes">
          <router-link v-if="connectAccountRoute(accountType)"
                      :to="connectAccountRoute(accountType)" class="mr-2 no-underline block mb-1">
            <Button v :label="'Add '+accountType.accountType" icon="pi pi-google" id="connect" />
          </router-link>
        </template>

      </div>
    </div>

  </div>
</template>

<script setup>
  import Button from "primevue/button"

  import { provideComponent, InjectComponent } from '@live-change/vue3-components'
  import GoogleAccountItem from './accountTypes/GoogleAccountItem.vue'
  import LinkedinAccountItem from './accountTypes/LinkedinAccountItem.vue'

  provideComponent({ name: 'connectedAccountItem', accountType: 'google' }, GoogleAccountItem)
  provideComponent({ name: 'connectedAccountItem', accountType: 'linkedin' }, LinkedinAccountItem)
  import UnknownAccountItem from './accountTypes/UnknownAccountItem.vue'


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

  import { useRouter } from 'vue-router'
  const router = useRouter()

  import { formatPhoneNumber } from '../phone/phoneNumber.js'

  const workingZone = inject('workingZone')

  import { useApi, live, usePath, useActions } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  const messageAuthenticationApi = useActions().messageAuthentication

  function disconnectContact(event, contactData) {
    const { contactType, id: contact } = contactData
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to disconnect ${contactType.contactType} account ${contact}?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        const upperCaseType = contactType.contactType[0].toUpperCase() + contactType.contactType.slice(1)
        workingZone.addPromise('disconnectContact', (async () => {
          await messageAuthenticationApi['disconnect'+upperCaseType]({ [contactType.contactType]: contact })
          toast.add({ severity: 'info', summary: 'Account disconnected', life: 1500 })
        })())
      },
      reject: () => {
        toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

  function disconnectAccount(event, contactData, name) {
    const { accountType, id: account } = contactData
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to disconnect ${accountType.accountType} account ${name || account}?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        const upperCaseType = accountType.accountType[0].toUpperCase() + accountType.accountType.slice(1)
        workingZone.addPromise('disconnectAccount', (async () => {
          await api.actions[accountType.accountType+'Authentication']['disconnect'+upperCaseType]({ account })
          toast.add({ severity: 'info', summary: 'Account disconnected', life: 1500 })
        })())
      },
      reject: () => {
        toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

  import { getContactTypes, getAccountTypes} from './connected.js'

  const contactsTypes = getContactTypes()
  const accountTypes = getAccountTypes()

  const contactPromises = contactsTypes.map(async contactType => {
    contactType.contacts = await live(contactType.path)
  })

  const accountPromises = accountTypes.map(async accountType => {
    accountType.accounts = await live(accountType.path)
  })

  await Promise.all([ ...contactPromises, ...accountPromises ])

  const contacts = computed(() => contactsTypes.map((c,i) => c.contacts.value.map(v => ({
    contactType: c,
    ...(v)
  }))).flat())

  const accounts = computed(() => accountTypes.map((c,i) => c.accounts.value.map(v => ({
    accountType: c,
    ...(v)
  }))).flat())

  const allAccountsCount = computed(() => contacts.value?.length + accounts.value?.length )
  const canDelete = computed(() => allAccountsCount.value > 1 )

  function connectAccountRoute(accountType) {
    const route = { name: 'user:connect-'+accountType.accountType }
    /// Check if the route is registered in the router
    const routeExists = router.getRoutes().find(r => r.name === route.name)
    return routeExists ? route : null
  }

</script>

<style>

</style>
