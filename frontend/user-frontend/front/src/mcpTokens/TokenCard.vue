<template>
  <Card data-testid="mcp-token-row">
    <template #content>
      <div class="flex gap-2">
        <Button
          text
          rounded
          severity="secondary"
          class="shrink-0"
          :icon="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
          :aria-expanded="expanded ? 'true' : 'false'"
          :aria-label="expanded ? t('mcpTokens.collapse') : t('mcpTokens.expand')"
          data-testid="mcp-token-toggle"
          @click="emit('toggle')"
        />
        <div class="flex-auto min-w-0">
          <div class="flex items-center justify-between gap-3 mb-3">
            <div class="font-medium truncate">{{ row.name }}</div>
            <Button
              severity="danger"
              size="small"
              :label="t('mcpTokens.revoke')"
              @click="emit('revoke')"
            />
          </div>
          <div class="flex gap-2 items-center">
            <InputText
              :model-value="bearer"
              readonly
              class="flex-auto font-mono text-sm"
              :placeholder="t('mcpTokens.secretHidden')"
              :aria-label="t('mcpTokens.bearer')"
              data-testid="mcp-token-bearer"
            />
            <Button
              icon="pi pi-copy"
              :label="t('mcpTokens.copy')"
              :disabled="!bearer"
              data-testid="mcp-token-copy-bearer"
              @click="copy(bearer)"
            />
          </div>
          <div v-if="expanded" class="mt-4" data-testid="mcp-token-details">
            <template v-if="bearer && blocks.length">
              <p class="text-sm text-surface-600 mb-3">{{ t('mcpTokens.copyOnce') }}</p>
              <SnippetTabs :blocks="blocks" />
            </template>
            <p v-else class="text-sm text-surface-500 m-0">{{ t('mcpTokens.secretGone') }}</p>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import SnippetTabs from './SnippetTabs.vue'

defineProps({
  row: {
    type: Object,
    required: true
  },
  bearer: {
    type: String,
    default: ''
  },
  blocks: {
    type: Array,
    default: () => []
  },
  expanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle', 'revoke'])

const { t } = useI18n()
const toast = useToast()

async function copy(text) {
  if (!text) return
  if (navigator.clipboard) await navigator.clipboard.writeText(text)
  toast.add({ severity: 'success', summary: t('mcpTokens.copied'), life: 1500 })
}
</script>
