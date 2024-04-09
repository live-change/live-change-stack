<template>
  <div class="w-full lg:w-6 md:w-9">

    <ConfirmPopup v-if="isMounted" />
    <Toast v-if="isMounted" />

    <div class="surface-card border-round shadow-2 p-4">
      <div class="text-900 font-medium mb-3 text-xl">Connected accounts</div>

      <ul class="list-none p-0 m-0 mt-5 mb-4">

        <li v-for="contact in contacts"
            class="flex flex-row align-items-center justify-content-between mb-2">
          <div class="flex flex-row align-items-center">
            <i v-if="contact.contactType.contactType === 'email'" class="pi pi-envelope mr-2"></i>
            <i v-if="contact.contactType.contactType === 'phone'" class="pi pi-mobile mr-2"></i>
            <span class="block text-900 font-medium text-lg">{{ contact.id }}</span>
          </div>
          <Button class="p-button-text p-button-plain p-button-rounded mr-1" icon="pi pi-times"
                  v-if="canDelete"
                  @click="event => disconnectContact(event, contact)" />
        </li>
        <li v-for="account in accounts"
            class="flex flex-row align-items-center justify-content-between mb-2">
          <div v-if="account.accountType.accountType === 'google'"
               class="flex flex-row align-items-center">
            <i  class="pi pi-google mr-2"></i>
            <span class="block text-900 font-medium text-lg">{{ account.email }}</span>
          </div>
          <pre v-else>{{ account }}</pre>
          <Button class="p-button-text p-button-plain p-button-rounded mr-1" icon="pi pi-times"
                  v-if="canDelete"
                  @click="event => disconnectAccount(event, account, account.email)" />
        </li>

      </ul>

      <div class="flex flex-row flex-wrap">
        <router-link v-for="contactType in contactsTypes"
                     :to="{ name: 'user:connect-'+contactType.contactType }" class="mr-2 no-underline block mb-1">
          <Button :label="'Add '+contactType.contactType" icon="pi pi-envelope" id="connect"></Button>
        </router-link>
      </div>
    </div>

  </div>
</template>

<script setup>
  import Button from "primevue/button"

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

  import { useApi, live, usePath, useActions } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()
  const messageAuthenticationClientConfig = api.getServiceDefinition('messageAuthentication')?.clientConfig
  const contactTypesAvailable = messageAuthenticationClientConfig?.contactTypes || []

  const userClientConfig = api.getServiceDefinition('user')?.clientConfig
  const accountTypesAvailable = userClientConfig?.remoteAccountTypes || []

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

  const contactsTypes = contactTypesAvailable.map(contactType => {
    const contactTypeUpper = contactType[0].toUpperCase() + contactType.slice(1)

    let serviceName = contactType
    let viewName = 'myUser'+contactTypeUpper+'s'
    if(!path[serviceName]) { // find service by viewName
      for(const s in path) {
        if(path[s][viewName]) {
          serviceName = s
          break
        }
      }
    }
    //console.log('contactType', contactType, 'serviceName', serviceName, 'viewName', viewName)
    console.log(`path[${serviceName}][${viewName}] =`, path[serviceName][viewName])
    return {
      contactType,
      serviceName,
      viewName,
      path: path[serviceName][viewName]({}),
      contacts: null
    }
  })

  const accountTypes = accountTypesAvailable.map(accountType => {
    let serviceName = accountType+'Authentication'
    let viewName = 'myUserAccounts'
    console.log('remoteAccountType', accountType, 'serviceName', serviceName, 'viewName', viewName)
    console.log(`path[${serviceName}][${viewName}] =`, path[serviceName][viewName])
    return {
      accountType,
      serviceName,
      viewName,
      path: path[serviceName][viewName]({}),
      accounts: null
    }
  })

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

</script>

<style>

</style>
