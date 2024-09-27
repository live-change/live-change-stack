<template>
  <div class="w-full lg:w-6 md:w-9">

    <div class="surface-card border-round shadow-2 p-4">
      <div class="text-900 font-medium mb-3 text-xl">Locale settings</div>

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

        <div class="p-field mb-3">
          <label for="title" class="block text-900 font-medium mb-2">
            Language
          </label>
          <Dropdown v-model="data.language" :options="availableLocales"
                    :optionLabel="languageLabel" showClear
                    :filter="availableLocales.length > 10"
                    placeholder="Auto-detect"
                    class="w-full" />
          <small v-if="data.languageError" id="language-help" class="p-error">{{ t(`errors.${data.languageError}`) }}</small>
        </div>

        <Button type="submit" label="Apply" class="mt-1" icon="pi pi-save" />

      </command-form>

    </div>

<!--    <p>available: {{ availableLocales }}</p>
    <p>current: {{ locale }}</p>
    <pre>{{ localeSettings }}</pre>-->
  </div>
</template>

<script setup>
  import { usePath, live, useApi } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  import { useToast } from 'primevue/usetoast'
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()
  const toast = useToast()

  import { useI18n } from 'vue-i18n'
  const { t, availableLocales, locale, getLocaleMessage } = useI18n()

  function languageLabel(option) {
    if(!option) return `Auto-detect (${navigator.language})`
    return getLocaleMessage(option).languageName
  }

  console.log("availableLocales", availableLocales)

  const localePath = path.localeSettings.myLocaleSettings({})

  const [localeSettings] = await Promise.all([live(localePath)])

  function handleSettingsUpdated({ parameters, result }) {
    toast.add({ severity: 'success', summary: 'Settings updated', detail: 'Your locale settings have been saved' })
  }

</script>

<style scoped>

</style>