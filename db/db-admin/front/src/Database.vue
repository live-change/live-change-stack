<template>
  <div class="bg-surface-0 dark:bg-surface-900 p-12 shadow rounded-border w-full">
    <ConfirmPopup v-if="isMounted"></ConfirmPopup>
    <Toast v-if="isMounted"></Toast>
    <div class="text-center mb-6">
      <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-6">Database "{{ dbName }}" @ {{ dbApi }}</div>
      <div class="flex flex-row justify-center items-center gap-3 mb-4">
        <Button type="button" icon="pi pi-refresh" label="Refresh storage stats" class="p-button-outlined"
                :loading="statsLoading" @click="refreshStorageStats" />
      </div>
      <div v-if="storageStats?.env?.available" class="text-surface-600 dark:text-surface-300 text-sm mb-2">
        Allocated {{ formatBytes(storageStats.env.allocatedFileBytes) }}
        · Apparent {{ formatBytes(storageStats.env.apparentFileBytes) }}
        · High-water {{ formatBytes(storageStats.env.fileBytes) }}
        · Map {{ formatBytes(storageStats.env.mapSize) }}
        · Waste {{ formatBytes(storageStats.wasteBytes) }}
        · Stores {{ formatBytes(storageStats.totals?.storeUsedBytes) }}
        (data {{ formatBytes(storageStats.totals?.dataUsedBytes) }}
        + opLog {{ formatBytes(storageStats.totals?.opLogUsedBytes) }})
      </div>
      <div v-if="sparseHint" class="text-amber-600 dark:text-amber-400 text-sm mb-4">
        Apparent file size is much larger than allocated blocks (sparse LMDB mapSize). Use allocated / high-water for real disk use.
      </div>
      <div v-else-if="storageStats && !storageStats.env?.available" class="text-surface-500 text-sm mb-4">
        Storage size stats unavailable for this backend.
      </div>
      <div class="flex flex-wrap justify-center items-center gap-3 mt-4 text-sm">
        <label class="flex items-center gap-2 text-surface-700 dark:text-surface-200">
          <input type="checkbox" v-model="retentionEnabled" />
          OpLog retention
        </label>
        <InputText v-model="retentionHours" class="w-24" :disabled="!retentionEnabled" placeholder="hours" />
        <span class="text-surface-500">hours</span>
        <span class="text-surface-500">({{ retentionHint }})</span>
        <Button type="button" icon="pi pi-save" label="Save retention" class="p-button-sm"
                :loading="retentionSaving" @click="saveRetention" />
        <Button type="button" icon="pi pi-trash" label="Clean opLogs now" class="p-button-sm p-button-warning"
                :loading="cleanerStarting || cleanerStatus?.running"
                :disabled="cleanerStatus?.running"
                @click="runCleaner" />
      </div>
      <div class="text-surface-600 dark:text-surface-300 text-sm mt-3">
        Cleaner: {{ cleanerStatusText }}
      </div>
    </div>

    <div class="text-center mb-6">
      <div v-if="tableRows?.length > 0" class="text-surface-900 dark:text-surface-0 text-2xl font-medium mb-6">Tables</div>
      <div v-else class="text-surface-600 dark:text-surface-200 text-xl font-medium mb-6">
        There are no tables. Create first one.
      </div>
    </div>

    <DataTable v-if="tableRows?.length > 0" :value="tableRows" responsiveLayout="scroll"
               sortField="usedBytes" :sortOrder="-1">
      <Column field="id" header="Table">
        <template #body="slotProps">
          <form v-if="tableRename === slotProps.data.id"
                @submit="ev => finishTableRename(ev, slotProps.data.id)">
            <InputText v-model="tableNewName" />
          </form>
          <router-link v-else :to="tableLink(dbName, slotProps.data.id)">
            {{ slotProps.data.id  }}
          </router-link>
        </template>
      </Column>
      <Column field="entryCount" header="Entries" :headerStyle="{ 'width': '90px' }">
        <template #body="slotProps">{{ formatCount(slotProps.data.entryCount) }}</template>
      </Column>
      <Column field="dataBytes" header="Data" :headerStyle="{ 'width': '100px' }">
        <template #body="slotProps">{{ formatBytes(slotProps.data.dataBytes) }}</template>
      </Column>
      <Column field="opLogBytes" header="OpLog" :headerStyle="{ 'width': '100px' }">
        <template #body="slotProps">{{ formatBytes(slotProps.data.opLogBytes) }}</template>
      </Column>
      <Column field="usedBytes" header="Total" :headerStyle="{ 'width': '100px' }">
        <template #body="slotProps">{{ formatBytes(slotProps.data.usedBytes) }}</template>
      </Column>
      <Column :headerStyle="{ 'width': '140px' }">
        <template #body="slotProps">
          <Button v-if="tableRename === slotProps.data.id"
                  @click="ev => finishTableRename(ev, slotProps.data.id)" type="button"
                  icon="pi pi-save" class="p-button-rounded p-button-primary mr-2" />
          <Button v-else
                  @click="ev => startTableRename(ev, slotProps.data.id)" type="button"
                  icon="pi pi-pencil" class="p-button-rounded p-button-warning mr-2" />
          <Button @click="ev => deleteTable(ev, slotProps.data.id)" type="button"
                  icon="pi pi-trash" class="p-button-rounded p-button-danger" />
        </template>
      </Column>
    </DataTable>

    <form class="mt-12 flex flex-row justify-center" @submit="handleNewTableSubmit">
      <InputText v-model="newTableName" class="mr-2" placeholder="Table Name" />
      <Button type="submit" class="p-button-primary" icon="pi pi-plus" label="Create Table" />
    </form>


    <div class="text-center mb-6 mt-20">
      <div v-if="logRows?.length > 0" class="text-surface-900 dark:text-surface-0 text-2xl font-medium mb-6">Logs</div>
      <div v-else class="text-surface-600 dark:text-surface-200 text-xl font-medium mb-6">
        There are no logs. Create first one.
      </div>
    </div>

    <DataTable v-if="logRows?.length > 0" :value="logRows" responsiveLayout="scroll"
               sortField="usedBytes" :sortOrder="-1">
      <Column field="id" header="Log">
        <template #body="slotProps">
          <form v-if="logRename === slotProps.data.id" @submit="ev => finishLogRename(ev, slotProps.data.id)">
            <InputText v-model="logNewName" />
          </form>
          <router-link v-else :to="logLink(dbName, slotProps.data.id)">
            {{ slotProps.data.id  }}
          </router-link>
        </template>
      </Column>
      <Column field="entryCount" header="Entries" :headerStyle="{ 'width': '90px' }">
        <template #body="slotProps">{{ formatCount(slotProps.data.entryCount) }}</template>
      </Column>
      <Column field="dataBytes" header="Data" :headerStyle="{ 'width': '100px' }">
        <template #body="slotProps">{{ formatBytes(slotProps.data.dataBytes) }}</template>
      </Column>
      <Column field="usedBytes" header="Total" :headerStyle="{ 'width': '100px' }">
        <template #body="slotProps">{{ formatBytes(slotProps.data.usedBytes) }}</template>
      </Column>
      <Column :headerStyle="{ 'width': '140px' }">
        <template #body="slotProps">
          <Button v-if="logRename === slotProps.data.id"
                  @click="ev => finishLogRename(ev, slotProps.data.id)" type="button"
                  icon="pi pi-save" class="p-button-rounded p-button-primary mr-2" />
          <Button v-else
                  @click="ev => startLogRename(ev, slotProps.data.id)" type="button"
                  icon="pi pi-pencil" class="p-button-rounded p-button-warning mr-2" />
          <Button @click="ev => deleteLog(ev, slotProps.data.id)" type="button"
                  icon="pi pi-trash" class="p-button-rounded p-button-danger" />
        </template>
      </Column>
    </DataTable>

    <form class="mt-12 flex flex-row justify-center" @submit="handleNewLogSubmit">
      <InputText v-model="newLogName" class="mr-2" placeholder="Log Name" />
      <Button type="submit" class="p-button-primary" icon="pi pi-plus" label="Create Log" />
    </form>


    <div class="text-center mb-6 mt-20">
      <div v-if="indexRows?.length > 0" class="text-surface-900 dark:text-surface-0 text-2xl font-medium mb-6">Indexes</div>
      <div v-else class="text-surface-600 dark:text-surface-200 text-xl font-medium mb-6">
        There are no indexes.
      </div>
    </div>

    <DataTable v-if="indexRows?.length > 0" :value="indexRows" responsiveLayout="scroll"
               sortField="usedBytes" :sortOrder="-1">
      <Column field="id" header="Index">
        <template #body="slotProps">
          <form v-if="indexRename === slotProps.data.id" @submit="ev => finishIndexRename(ev, slotProps.data.id)">
            <InputText v-model="indexNewName" />
          </form>
          <router-link v-else :to="indexLink(dbName, slotProps.data.id)">
            {{ slotProps.data.id  }}
          </router-link>
          <Tag v-if="slotProps.data.indexStatus && slotProps.data.indexStatus !== 'ready'"
               class="ml-2"
               :severity="indexStatusSeverity(slotProps.data.indexStatus)"
               :value="indexStatusLabel(slotProps.data)" />
        </template>
      </Column>
      <Column field="entryCount" header="Entries" :headerStyle="{ 'width': '90px' }">
        <template #body="slotProps">{{ formatCount(slotProps.data.entryCount) }}</template>
      </Column>
      <Column field="dataBytes" header="Data" :headerStyle="{ 'width': '100px' }">
        <template #body="slotProps">{{ formatBytes(slotProps.data.dataBytes) }}</template>
      </Column>
      <Column field="opLogBytes" header="OpLog" :headerStyle="{ 'width': '100px' }">
        <template #body="slotProps">{{ formatBytes(slotProps.data.opLogBytes) }}</template>
      </Column>
      <Column field="usedBytes" header="Total" :headerStyle="{ 'width': '100px' }">
        <template #body="slotProps">{{ formatBytes(slotProps.data.usedBytes) }}</template>
      </Column>
      <Column :headerStyle="{ 'width': '140px' }">
        <template #body="slotProps">
          <Button v-if="indexRename === slotProps.data.id"
                  @click="ev => finishIndexRename(ev, slotProps.data.id)" type="button"
                  icon="pi pi-save" class="p-button-rounded p-button-primary mr-2" />
          <Button v-else
                  @click="ev => startIndexRename(ev, slotProps.data.id)" type="button"
                  icon="pi pi-pencil" class="p-button-rounded p-button-warning mr-2" />
          <Button @click="ev => deleteIndex(ev, slotProps.data.id)" type="button"
                  icon="pi pi-trash" class="p-button-rounded p-button-danger" />
        </template>
      </Column>
    </DataTable>

  </div>
</template>

<script setup>
  import DataTable from "primevue/datatable"
  import Column from "primevue/column"
  import Button from "primevue/button"
  import InputText from "primevue/inputtext"
  import Tag from "primevue/tag"

  import ConfirmPopup from 'primevue/confirmpopup'
  import Toast from 'primevue/toast'

  import { tableLink, logLink, indexLink } from "./links.js"

  const { dbApi, dbName } = defineProps({
    dbApi: {
      type: String,
      default: 'serverDatabase'
    },
    dbName: {
      type: String,
      required: true
    }
  })

  import { ref, computed, watch, onMounted, onUnmounted, inject } from "vue"
  let isMounted = ref(false)
  onMounted(() => isMounted.value = true)
  onUnmounted(() => isMounted.value = false)

  import { api } from "@live-change/vue3-ssr"
  const dao = api().source
  import { live } from "@live-change/dao-vue3"

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  const workingZone = inject('workingZone')

  function formatBytes(value) {
    if(value == null || Number.isNaN(value)) return 'n/a'
    const n = Number(value)
    if(n < 1024) return n + ' B'
    if(n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
    if(n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB'
    return (n / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  function formatCount(value) {
    if(value == null || Number.isNaN(value)) return 'n/a'
    return String(value)
  }

  const storageStats = ref(null)
  const statsLoading = ref(false)

  async function refreshStorageStats() {
    statsLoading.value = true
    try {
      storageStats.value = await dao.get([dbApi, 'databaseStorageStats', dbName])
    } catch(error) {
      toast.add({
        severity: 'error',
        summary: 'Storage stats failed',
        detail: error.message || String(error),
        life: 3000
      })
    } finally {
      statsLoading.value = false
    }
  }

  const sparseHint = computed(() => {
    const env = storageStats.value?.env
    if(!env?.available) return false
    if(env.apparentFileBytes == null || env.allocatedFileBytes == null) return false
    return env.apparentFileBytes > env.allocatedFileBytes * 4
      && env.apparentFileBytes > 1024 * 1024 * 1024
  })

  const DEFAULT_RETENTION_HOURS = 2
  const retentionEnabled = ref(true)
  const retentionHours = ref(String(DEFAULT_RETENTION_HOURS))
  const retentionSaving = ref(false)
  const retentionHint = computed(() => {
    if(!retentionEnabled.value) return 'disabled'
    const hours = Number(retentionHours.value)
    if(!Number.isFinite(hours) || hours <= 0) return 'invalid'
    return `${hours}h`
  })

  function applyRetentionFromConfig(config) {
    const value = config?.storage?.opLogRetentionMs
    if(value === false || value === 0) {
      retentionEnabled.value = false
      retentionHours.value = String(DEFAULT_RETENTION_HOURS)
      return
    }
    retentionEnabled.value = true
    if(typeof value === 'number' && value > 0) {
      retentionHours.value = String(value / (60 * 60 * 1000))
    } else {
      retentionHours.value = String(DEFAULT_RETENTION_HOURS)
    }
  }

  async function loadRetentionConfig() {
    try {
      const config = await dao.get([dbApi, 'databaseConfig', dbName])
      applyRetentionFromConfig(config)
    } catch(error) {
      // keep defaults
    }
  }

  async function saveRetention() {
    retentionSaving.value = true
    try {
      let opLogRetentionMs
      if(!retentionEnabled.value) {
        opLogRetentionMs = false
      } else {
        const hours = Number(retentionHours.value)
        if(!Number.isFinite(hours) || hours <= 0) {
          throw new Error('retention hours must be a positive number')
        }
        opLogRetentionMs = Math.round(hours * 60 * 60 * 1000)
      }
      await dao.request([dbApi, 'updateDatabaseStorage'], dbName, { opLogRetentionMs })
      toast.add({ severity: 'info', summary: 'OpLog retention saved', life: 1500 })
      await loadRetentionConfig()
    } catch(error) {
      toast.add({
        severity: 'error',
        summary: 'Retention not saved',
        detail: error.message || String(error),
        life: 3000
      })
    } finally {
      retentionSaving.value = false
    }
  }

  const cleanerStarting = ref(false)
  const cleanerStatus = await live(dao, { what: [dbApi, 'opLogCleanerStatus'] })
  const cleanerStatusText = computed(() => {
    const s = cleanerStatus.value
    if(!s) return 'loading…'
    const parts = [s.message || (s.running ? 'running' : 'idle')]
    if(s.mode) parts.push(`mode=${s.mode}`)
    if(s.dbName) parts.push(`db=${s.dbName}`)
    if(s.progressPercent != null) parts.push(`${s.progressPercent}%`)
    if(s.running || s.deleted) {
      parts.push(`batches=${s.batch || 0}`)
      parts.push(`deleted=${formatCount(s.deleted)}`)
      const denom = s.estimatedDeletable ?? s.estimatedTotal
      if(denom != null) parts.push(`/~${formatCount(denom)}`)
    }
    if(s.ratePerSec != null && s.running) {
      parts.push(`~${Math.round(s.ratePerSec)}/s`)
    }
    if(s.etaMs != null && s.running) {
      const sec = Math.round(s.etaMs / 1000)
      parts.push(sec < 60 ? `eta=${sec}s` : `eta=${Math.floor(sec / 60)}m`)
    }
    if(s.databasesTotal) {
      parts.push(`dbs=${s.databasesDone || 0}/${s.databasesTotal}`)
    }
    if(s.lastError) parts.push(`error=${s.lastError}`)
    return parts.join(' · ')
  })

  let lastCleanerFinishedAt = cleanerStatus.value?.finishedAt || null
  watch(() => cleanerStatus.value?.finishedAt, async (finishedAt, prev) => {
    if(!finishedAt || finishedAt === lastCleanerFinishedAt) return
    lastCleanerFinishedAt = finishedAt
    if(cleanerStatus.value?.mode === 'manual') {
      toast.add({
        severity: cleanerStatus.value?.lastError ? 'error' : 'info',
        summary: cleanerStatus.value?.lastError ? 'OpLog clean failed' : 'OpLog clean finished',
        detail: cleanerStatus.value?.lastError
          || `deleted ${formatCount(cleanerStatus.value?.deleted)} entries`,
        life: 3000
      })
      await refreshStorageStats()
    }
  })

  async function runCleaner() {
    cleanerStarting.value = true
    try {
      await dao.request([dbApi, 'runOpLogCleaner'], dbName, { force: !retentionEnabled.value })
      toast.add({ severity: 'info', summary: 'OpLog clean started', life: 1500 })
    } catch(error) {
      toast.add({
        severity: 'error',
        summary: 'OpLog clean not started',
        detail: error.message || String(error),
        life: 3000
      })
    } finally {
      cleanerStarting.value = false
    }
  }

  function mergeRows(list, type) {
    const stores = storageStats.value?.stores || []
    const byName = new Map(
      stores.filter(s => s.type === type).map(s => [s.name, s])
    )
    return (list || []).map(row => {
      const stats = byName.get(row.id)
      return {
        id: row.id,
        entryCount: stats?.entryCount ?? null,
        dataBytes: stats?.data?.usedBytes ?? null,
        opLogBytes: stats?.opLog?.usedBytes ?? null,
        usedBytes: stats?.usedBytes ?? null
      }
    })
  }

  function indexStatusSeverity(status) {
    if(status === 'sleeping') return 'warn'
    if(status === 'error') return 'danger'
    if(status === 'starting') return 'info'
    return 'success'
  }

  function indexStatusLabel(row) {
    if(row.indexStatus === 'sleeping' && row.failedOn) {
      return `sleeping: ${row.failedOn.type} ${row.failedOn.name}`
    }
    if(row.indexStatus === 'sleeping' && row.indexError) {
      return `sleeping: ${row.indexError}`
    }
    return row.indexStatus || ''
  }

  function deleteTable(event, id) {
    console.log('deleteTable', id)
    confirm.require({
      target: event.currentTarget,
      message: `Do you really want to delete table ${id}?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        workingZone.addPromise('deleteTable', (async () => {
          await dao.request([dbApi, 'deleteTable'], dbName, id)
          toast.add({ severity:'info', summary: `Table ${id} deleted`, life: 1500 })
          await refreshStorageStats()
        })())
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

  const tableRename = ref("")
  const tableNewName = ref("")
  function startTableRename(event, id) {
    tableNewName.value = id
    tableRename.value = id
  }
  function finishTableRename(event, id) {
    event.preventDefault()
    const oldTableName = tableRename.value
    const tableName = tableNewName.value
    tableRename.value = null
    if(oldTableName === tableName) return
    workingZone.addPromise('renameTable', (async () => {
      try {
        await dao.request([dbApi, 'renameTable'], dbName, oldTableName, tableName)
        toast.add({severity: 'info', summary: `Table ${oldTableName} renamed to ${tableName}`, life: 1500})
        await refreshStorageStats()
      } catch(error) {
        toast.add({ severity: 'error', summary: `Table ${tableName} not renamed`, detail: error.message, life: 3000 })
      }
    })())
  }


  const newTableName = ref("")
  function handleNewTableSubmit(event) {
    event.preventDefault()
    const tableName = newTableName.value
    if(tableName.length === 0) return
    newTableName.value = ""
    workingZone.addPromise('createTable', (async () => {
      try {
        await dao.request([dbApi, 'createTable'], dbName, tableName)
        toast.add({ severity: 'info', summary: `Table ${tableName} created`, life: 1500 })
        await refreshStorageStats()
      } catch(error) {
        toast.add({ severity: 'error', summary: `Table ${tableName} not created`, detail: error.message, life: 3000 })
      }
    })())
  }


  function deleteLog(event, id) {
    confirm.require({
      target: event.currentTarget,
      message: `Do you really want to delete log ${id}?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        workingZone.addPromise('deleteLog', (async () => {
          await dao.request([dbApi, 'deleteLog'], dbName, id)
          toast.add({ severity:'info', summary: `Log ${id} deleted`, life: 1500 })
          await refreshStorageStats()
        })())
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

  const logRename = ref("")
  const logNewName = ref("")
  function startLogRename(event, id) {
    logNewName.value = id
    logRename.value = id
  }
  function finishLogRename(event, id) {
    event.preventDefault()
    const oldLogName = logRename.value
    const logName = logNewName.value
    logRename.value = null
    if(oldLogName == logName) return
    workingZone.addPromise('renameLog', (async () => {
      try {
        await dao.request([dbApi, 'renameLog'], dbName, oldLogName, logName)
        toast.add({severity: 'info', summary: `Log ${oldLogName} renamed to ${logName}`, life: 1500})
        await refreshStorageStats()
      } catch(error) {
        toast.add({ severity: 'error', summary: `Log ${logName} not renamed`, detail: error.message, life: 3000 })
      }
    })())
  }

  const newLogName = ref("")
  function handleNewLogSubmit(event) {
    event.preventDefault()
    const logName = newLogName.value
    newLogName.value = ""
    workingZone.addPromise('createLog', (async () => {
      try {
        await dao.request([dbApi, 'createLog'], dbName, logName)
        toast.add({severity: 'info', summary: `Log ${logName} created`, life: 1500})
        await refreshStorageStats()
      } catch(error) {
        toast.add({ severity: 'error', summary: `Log ${logName} not created`, detail: error.message, life: 3000 })
      }
    })())
  }


  function deleteIndex(event, id) {
    confirm.require({
      target: event.currentTarget,
      message: `Do you really want to delete index ${id}?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        workingZone.addPromise('deleteIndex', (async () => {
          await dao.request([dbApi, 'deleteIndex'], dbName, id)
          toast.add({ severity:'info', summary: `Index ${id} deleted`, life: 1500 })
          await refreshStorageStats()
        })())
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

  const indexRename = ref("")
  const indexNewName = ref("")
  function startIndexRename(event, id) {
    indexNewName.value = id
    indexRename.value = id
  }
  function finishIndexRename(event, id) {
    event.preventDefault()
    const oldIndexName = indexRename.value
    const indexName = indexNewName.value
    indexRename.value = null
    if(oldIndexName === indexName) return
    workingZone.addPromise('renameIndex', (async () => {
      try {
        await dao.request([dbApi, 'renameIndex'], dbName, oldIndexName, indexName)
        toast.add({severity: 'info', summary: `Index ${oldIndexName} renamed to ${indexName}`, life: 1500})
        await refreshStorageStats()
      } catch(error) {
        toast.add({ severity: 'error', summary: `Index ${indexName} not renamed`, detail: error.message, life: 3000 })
      }
    })())
  }

  const [ tables, indexes, logs, indexStates ] = await Promise.all([
    live(dao, { what: [dbApi, 'tables', dbName] }),
    live(dao, { what: [dbApi, 'indexes', dbName] }),
    live(dao, { what: [dbApi, 'logs', dbName] }),
    live(dao, { what: [dbApi, 'indexStates', dbName] })
  ])

  await Promise.all([
    refreshStorageStats(),
    loadRetentionConfig()
  ])

  const tableRows = computed(() => mergeRows(tables.value, 'table'))
  const indexRows = computed(() => {
    const rows = mergeRows(indexes.value, 'index')
    const states = indexStates.value || []
    const byName = new Map(states.map(s => [s.name, s]))
    return rows.map(row => {
      const state = byName.get(row.id)
      return {
        ...row,
        indexStatus: state?.status || null,
        indexError: state?.error || null,
        failedOn: state?.failedOn || null
      }
    })
  })
  const logRows = computed(() => mergeRows(logs.value, 'log'))

</script>
