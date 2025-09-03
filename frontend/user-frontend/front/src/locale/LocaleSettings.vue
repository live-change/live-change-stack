<template>
  <div class="w-full lg:w-6/12 md:w-9/12">

    <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6" v-if="localeSettings">
      <div class="text-surface-900 dark:text-surface-0 font-medium mb-4 text-xl">{{ t('settings.localeSettings') }}</div>

      <command-form service="localeSettings" action="setOrUpdateMyLocaleSettings"
                    :initialValues="{
                      language: localeSettings.language,
                      dataTime: localeSettings.dataTime,
                      number: localeSettings.number,
                      plural: localeSettings.plural,
                      list: localeSettings.list,
                      relativeTime: localeSettings.relativeTime,
                    }"
                    v-slot="{ data }" keepOnDone @done="handleSettingsUpdated">

        <div class="p-field mb-4">
          <label for="title" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
            {{ t('settings.language') }}
          </label>
          <Dropdown v-model="data.language" :options="availableLocales"
                    :optionLabel="languageLabel" showClear
                    :filter="availableLocales.length > 10"
                    :placeholder="t('settings.autoDetect')"
                    class="w-full" />
          <Message v-if="data.languageError" severity="error" variant="simple" size="small">
            {{ t(`errors.${data.languageError}`) }}
          </Message>
        </div>

        <Button type="submit" :label="t('settings.apply')" class="mt-1" icon="pi pi-save" />

      </command-form>

    </div>

<!--    <p>available: {{ availableLocales }}</p>
    <p>current: {{ locale }}</p>
    <pre>{{ localeSettings }}</pre>-->
  </div>
</template>

<script setup>
  import Message from "primevue/message"

  import { usePath, live, useApi } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  import { useToast } from 'primevue/usetoast'
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()
  const toast = useToast()

  import { useI18n } from 'vue-i18n'
  const { t, availableLocales, getLocaleMessage } = useI18n()

  function languageLabel(option) {
    //console.log("LANGUAGE LABEL", option)
    if(!option) return `${t('settings.autoDetect')} (${navigator.language})`
    return getLocaleMessage(option).languageName ?? option
  }

  console.log("availableLocales", availableLocales)

  const localePath = path.localeSettings.myLocaleSettings({})

  const [localeSettings] = await Promise.all([live(localePath)])

  function handleSettingsUpdated({ parameters, result }) {
    toast.add({ severity: 'success', summary: t('settings.settingsUpdated'), detail: t('settings.localeSettingsSaved') })
  }

</script>

<style scoped>

</style>