<template>
  <Tabs v-model:value="tab" class="w-full">
    <TabList>
      <Tab v-for="block in blocks" :key="block.id" :value="block.id">{{ block.title }}</Tab>
    </TabList>
    <TabPanels>
      <TabPanel v-for="block in blocks" :key="block.id" :value="block.id">
        <p class="text-sm text-surface-500 mb-2">{{ block.where }}</p>
        <pre class="text-sm overflow-auto bg-surface-100 dark:bg-surface-800 rounded p-3 m-0">{{ block.snippet }}</pre>
        <Button
          size="small"
          class="mt-3"
          icon="pi pi-copy"
          :label="t('mcpTokens.copy')"
          @click="copy(block.snippet)"
        />
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'

const { blocks } = defineProps({
  blocks: {
    type: Array,
    required: true
  }
})

const { t } = useI18n()
const toast = useToast()
const tab = ref(blocks[0]?.id || '')

watch(() => blocks.map(block => block.id).join('|'), () => {
  if (!blocks.some(block => block.id === tab.value)) tab.value = blocks[0]?.id || ''
})

async function copy(text) {
  if (navigator.clipboard) await navigator.clipboard.writeText(text)
  toast.add({ severity: 'success', summary: t('mcpTokens.copied'), life: 1500 })
}
</script>
