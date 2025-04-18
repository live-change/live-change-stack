<template>
  <div class="w-full lg:w-6/12 md:w-9/12" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <div>
        <h1>Notifications settings</h1>
      </div>
<!--       <pre>{{ settings }}</pre>
      <pre>{{ clientConfig }}</pre> -->
      <div v-for="notificationType in settings">
        <div>
          <h2>{{ t(`notifications.types.${notificationType.type}.name`) }}</h2>
        </div>
        <div>
          <div v-for="contact in notificationType.contacts"
               class="flex flex-row items-center mb-4">
            <div class="grow md:mb-2">
              <i class="pi" :class="contactTypesIcons[contact.contactType]"></i>
              <span class="ml-2">{{ contactText(contact.contact, contact.contactType) }}</span>
            </div>
            <div class="">
              <InputSwitch v-model="contact.setting.value.active"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

  import InputSwitch from 'primevue/inputswitch'

  import pluralize from 'pluralize'
  import { synchronized } from "@live-change/vue3-components"
  import { computed, ref } from 'vue'
  import { useToast } from 'primevue/usetoast'
  const toast = useToast()

  const checked = ref()

  import { api as useApi, live, path, actions } from '@live-change/vue3-ssr'
  const api = useApi()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const clientConfig = api.getServiceDefinition('notification')?.clientConfig

  const notificationApi = actions().notification


  const contactTypesIcons = {
    email: 'pi-envelope',
    web: 'pi-globe',
    phone: 'pi-phone'
  }
  function contactText(contact, type) {
    if(type === 'web') return 'Web'
    return contact
  }

  const allContacts = await Promise.all(clientConfig.contactTypes.map(async contactType => {
    const contactTypeUpper = contactType[0].toUpperCase() + contactType.slice(1)
    const contactTypeLong = contactType + '_' + contactTypeUpper
    let p = path()[contactType]['myUser' + pluralize(contactTypeUpper)]({})
    p = p.with(contact =>
        path().notification.contactOwnedNotificationSettings({
          contactType: contactTypeLong, contact: contact[contactType]
        }).bind('settings')
    )
    /*for(const notificationType of clientConfig.notificationTypes) {
      p = p.with(contact => path().notification.contactAndNotificationOwnedNotificationSetting({
        contactType, contact: contact[contactType], notificationType, notification: ''
      }).bind(notificationType))
    }*/
    return {
      type: contactType,
      contactType,
      contactTypeUpper,
      contactTypeLong,
      list: await live(p)
    }
  }))

  const contacts = computed(() => {
    const obj = {}
    for(const type of allContacts) {
      obj[type.type] = type.list.value
    }
    return obj
  })

  const settings = computed(() => clientConfig.notificationTypes.map(notificationType => {
    const contacts = allContacts.map(contactsData => contactsData.list.value.map(contact => {
      const contactType = contactsData.type
      const settingSource = computed(() => {
        const userSetting = contact.settings.find(s => s.notificationType === notificationType)
        //const defaultSetting = clientConfig.defaultSettings.find(s => s.notificationType === notificationType)
        return userSetting
      })
      const setting = synchronized({
        source: settingSource,
        update: notificationApi.setOrUpdateNotificationSetting,
        identifiers: {
          contact: contact[contactType], contactType: contactsData.contactTypeLong,
          notificationType, notification: notificationType
        },
        recursive: true,
        onSave: () => toast.add({ severity: 'info', summary: 'Notification settings saved', life: 1500 })
      }).value
      return {
        contactType,
        contact: contact[contactType],
        settingSource,
        setting,

      }
    })).flat()
    return {
      type: notificationType,
      contacts
    }
  }))


</script>