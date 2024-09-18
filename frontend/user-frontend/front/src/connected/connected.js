import { useApi, live } from '@live-change/vue3-ssr'
import { computed, onUnmounted, getCurrentInstance } from 'vue'

export function getContactTypes(api = useApi()) {
  const path = api.fetch
  const messageAuthenticationClientConfig = api.getServiceDefinition('messageAuthentication')?.clientConfig
  const contactTypesAvailable = messageAuthenticationClientConfig?.contactTypes || []
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
      contacts: null,
      async fetchContacts(context, onUnmountedCb){
        const contacts = await live(path[serviceName][viewName]({}), context, onUnmountedCb)
        this.contacts = contacts
        return contacts
      }
    }
  })
  return contactsTypes

}

export function getAccountTypes(api = useApi()) {
  const userClientConfig = api.getServiceDefinition('user')?.clientConfig
  const accountTypesAvailable = userClientConfig?.remoteAccountTypes || []
  const path = api.fetch
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
      accounts: null,
      async fetchAccounts(context, onUnmountedCb){
        const accounts = await live(path[serviceName][viewName]({}), context, onUnmountedCb)
        this.accounts = accounts
        return accounts
      }
    }
  })
  return accountTypes
}

export async function getContacts(context, onUnmountedCb) {
  if(!context) context = getCurrentInstance().appContext
  if(!onUnmountedCb) onUnmountedCb = onUnmounted
  const api = useApi(context)
  const contactsTypes = getContactTypes(api)
  for(const contactType of contactsTypes) {
    await contactType.fetchContacts(context, onUnmountedCb)
  }
  const contacts = computed(() => contactsTypes.map((c,i) => c.contacts.value.map(v => ({
    contactType: c.contactType,
    serviceName: c.serviceName,
    ...(v)
  }))).flat())
  return contacts
}

export async function getAccounts(context, onUnmountedCb) {
  if(!context) context = getCurrentInstance().appContext
  if(!onUnmountedCb) onUnmountedCb = onUnmounted
  const api = useApi(context)
  const accountTypes = getAccountTypes(api)
  for(const accountType of accountTypes) {
    await accountType.fetchAccounts(context, onUnmountedCb)
  }
  const accounts = computed(() => accountTypes.map((c,i) => c.accounts.value.map(v => ({
    accountType: c.contactType,
    serviceName: c.serviceName,
    ...(v)
  }))).flat())
  return accounts
}