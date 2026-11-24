<template>
  <div class="w-full max-w-3xl flex flex-col gap-4" data-testid="mcp-tokens">
    <Card>
      <template #title>
        <h1 class="text-2xl font-bold m-0">{{ t('mcpTokens.title') }}</h1>
      </template>
      <template #content>
        <p v-if="!serviceReady" class="m-0 text-surface-500">{{ t('mcpTokens.unavailable') }}</p>
        <template v-else>
          <p class="m-0 text-surface-600">
            {{ tokenEndpoints.length ? t('mcpTokens.intro') : t('mcpTokens.openOnly') }}
          </p>
          <p v-if="tokenEndpoints.length && !activeTokens.length" class="m-0 mt-2 text-surface-500">
            {{ t('mcpTokens.empty') }}
          </p>
        </template>
      </template>
    </Card>

    <template v-if="serviceReady">
      <Card v-if="openEndpoints.length">
        <template #title>{{ t('mcpTokens.openEndpoints') }}</template>
        <template #content>
          <SnippetTabs :blocks="openBlocks" />
        </template>
      </Card>

      <TokenCard
        v-for="row in activeTokens"
        :key="row.id"
        :row="row"
        :bearer="bearerFor(row)"
        :blocks="blocksFor(row)"
        :expanded="!!expandedIds[row.id]"
        @toggle="toggle(row.id)"
        @revoke="revoke(row)"
      />

      <Card v-if="tokenEndpoints.length && form">
        <template #title>{{ t('mcpTokens.newToken') }}</template>
        <template #content>
          <div class="flex gap-2 items-end">
            <div class="flex-auto">
              <label class="block text-sm mb-1" for="mcp-token-name">{{ t('mcpTokens.name') }}</label>
              <InputText id="mcp-token-name" v-model="form.data.value.name" class="w-full" />
            </div>
            <Button
              :label="t('mcpTokens.create')"
              :loading="form.submitting.value"
              @click="form.submit()"
            />
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { actionData } from '@live-change/frontend-auto-form'
import { live, useApi, useClient, usePath } from '@live-change/vue3-ssr'
import { buildSnippets } from '@live-change/agent-mcp-service/snippets.js'
import SnippetTabs from './SnippetTabs.vue'
import TokenCard from './TokenCard.vue'

const { t } = useI18n()
const api = useApi()
const path = usePath()
const client = useClient()
const confirm = useConfirm()
const toast = useToast()
const origin = ref('')
const secrets = ref({})
const expandedIds = ref({})

onMounted(() => {
  origin.value = window.location.origin
})

const serviceDefinition = api.getServiceDefinition('agentMcpServer')
const serviceReady = !!serviceDefinition
const endpoints = serviceDefinition?.clientConfig?.endpoints || []
const tokenEndpoints = endpoints.filter(endpoint => endpoint.requireToken)
const openEndpoints = endpoints.filter(endpoint => !endpoint.requireToken)

const tokensPath = computed(() => {
  // useClient() is a computed ref. servicesDefinitions updates when the API is generated.
  api.servicesDefinitions?.value
  const view = path.agentMcpServer?.myUserMcpTokens
  if (!client.value?.user || typeof view !== 'function') return false
  return view({})
})
const [tokens] = await Promise.all([
  live(tokensPath)
])

const activeTokens = computed(() => (tokens.value || []).filter(row => !row.revokedAt))

const form = serviceReady && api.services?.agentMcpServer?.actions?.createMyUserMcpToken
  ? await actionData({
    service: 'agentMcpServer',
    action: 'createMyUserMcpToken',
    initialValue: { name: '' },
    doneToast: t('mcpTokens.created'),
    onDone(result) {
      if (!result?.id) return
      secrets.value = { ...secrets.value, [result.id]: result.token }
      expandedIds.value = { ...expandedIds.value, [result.id]: true }
    }
  })
  : null

function endpointBlocks(list, token) {
  const many = list.length > 1
  return list.flatMap(endpoint => {
    return buildSnippets({
      origin: origin.value || '',
      path: endpoint.path,
      token,
      snippetName: endpoint.snippetName
    }).map(block => ({
      ...block,
      id: endpoint.name + ':' + block.id,
      title: many ? endpoint.snippetName + ' · ' + block.title : block.title
    }))
  })
}

const openBlocks = computed(() => endpointBlocks(openEndpoints))

function bearerFor(row) {
  const token = secrets.value[row.id]
  return token ? 'Bearer ' + token : ''
}

function blocksFor(row) {
  const token = secrets.value[row.id]
  if (!token) return []
  return endpointBlocks(tokenEndpoints, token)
}

function toggle(id) {
  expandedIds.value = { ...expandedIds.value, [id]: !expandedIds.value[id] }
}

function revoke(row) {
  confirm.require({
    message: t('mcpTokens.revokeConfirm'),
    header: t('mcpTokens.revoke'),
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      await api.command(['agentMcpServer', 'revokeMyUserMcpToken'], { mcpToken: row.id })
      const nextSecrets = { ...secrets.value }
      delete nextSecrets[row.id]
      secrets.value = nextSecrets
      toast.add({ severity: 'success', summary: t('mcpTokens.revoked'), life: 2000 })
    }
  })
}
</script>
