<template>
  <div class="w-full lg:w-6/12 md:w-9/12" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <div>
        <h1>{{ t('notifications.notificationsSettings') }}</h1>
      </div>

      <WebPushSubscribePanel v-if="hasWebContact" />

      <div v-for="notificationType in settings" :key="notificationType.type">
        <div>
          <h2>{{ t(`notifications.types.${notificationType.type}.name`) }}</h2>
        </div>
        <div>
          <div
            v-for="contact in notificationType.contacts"
            :key="`${contact.contactType}:${contact.contact}`"
            class="flex flex-row items-center mb-4"
          >
            <div class="grow md:mb-2">
              <i class="pi" :class="contactTypesIcons[contact.contactType]"></i>
              <span class="ml-2">{{ contactText(contact.contact, contact.contactType) }}</span>
            </div>
            <div>
              <InputSwitch v-model="contact.setting.value.active" />
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
  import { synchronized } from '@live-change/vue3-components'
  import { resolveChannelActiveFromSetting } from '@live-change/notification-service/deliveryPreferencesCore.js'
  import { computed } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { api as useApi, live, path, actions } from '@live-change/vue3-ssr'
  import { useI18n } from 'vue-i18n'
  import WebPushSubscribePanel from './WebPushSubscribePanel.vue'

  const toast = useToast()
  const api = useApi()
  const { t } = useI18n()

  const clientConfig = api.getServiceDefinition('notification')?.clientConfig
  const notificationApi = actions().notification
  const defaultSettings = clientConfig?.defaultSettings

  const hasWebContact = computed(() => (clientConfig?.contactTypes ?? []).includes('web'))

  const contactTypesIcons = {
    email: 'pi-envelope',
    web: 'pi-globe',
    phone: 'pi-phone'
  }

  function contactText(contact, type) {
    if (type === 'web') return t('notifications.web')
    return contact
  }

  function contactIdFromRow(contactType, contact) {
    if (contactType === 'web') return contact?.id ?? contact?.to ?? contact?.web
    return contact?.[contactType] ?? contact?.id ?? contact?.to
  }

  function findSettingRow(settings, notificationType) {
    return (settings ?? []).find(row =>
      String(row?.notificationType ?? '') === String(notificationType)
      || String(row?.notification ?? '') === String(notificationType)
    ) ?? null
  }

  /**
   * Match deliveryPreferences: stored boolean wins; otherwise defaultSettings / opt-out true.
   * Synthetic source keeps InputSwitch honest without inventing a DB row until the user toggles.
   */
  function effectiveSettingSource(existing, notificationType, contactService) {
    if (existing && typeof existing.active === 'boolean') return existing
    return {
      active: resolveChannelActiveFromSetting(
        existing,
        notificationType,
        contactService,
        defaultSettings
      )
    }
  }

  const allContacts = await Promise.all((clientConfig?.contactTypes ?? []).map(async contactType => {
    const contactTypeUpper = contactType[0].toUpperCase() + contactType.slice(1)
    const contactTypeLong = contactType + '_' + contactTypeUpper
    let p = path()[contactType]['myUser' + pluralize(contactTypeUpper)]({})
    p = p.with(contact =>
      path().notification.contactOwnedNotificationSettings({
        contactType: contactTypeLong,
        contact: contactIdFromRow(contactType, contact)
      }).bind('settings')
    )
    return {
      type: contactType,
      contactType,
      contactTypeUpper,
      contactTypeLong,
      list: await live(p)
    }
  }))

  const settings = computed(() => (clientConfig?.notificationTypes ?? []).map(notificationType => {
    const contacts = allContacts.map(contactsData => (contactsData.list.value ?? []).map(contact => {
      const contactType = contactsData.type
      const contactId = contactIdFromRow(contactType, contact)
      const settingSource = computed(() => {
        const existing = findSettingRow(contact.settings, notificationType)
        return effectiveSettingSource(existing, notificationType, contactType)
      })
      const setting = synchronized({
        source: settingSource,
        update: notificationApi.setOrUpdateNotificationSetting,
        identifiers: {
          contact: contactId,
          contactType: contactsData.contactTypeLong,
          notificationType,
          notification: notificationType
        },
        recursive: true,
        onSave: () => toast.add({
          severity: 'info',
          summary: t('notifications.settingsSaved'),
          life: 1500
        })
      }).value
      return {
        contactType,
        contact: contactId,
        settingSource,
        setting
      }
    })).flat()
    return {
      type: notificationType,
      contacts
    }
  }))
</script>
