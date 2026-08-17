<template>
  <div class="bg-surface-0 dark:bg-surface-900 p-12 shadow rounded-border w-full">
    <ConfirmPopup v-if="isMounted"></ConfirmPopup>
    <Toast v-if="isMounted"></Toast>

    <div class="text-center mb-6">
      <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-6">Databases @ {{ dbApi }}</div>
      <Button type="button" icon="pi pi-refresh" label="Refresh sizes" class="p-button-outlined mb-6"
              :loading="sizesLoading" @click="refreshSizes" />
    </div>

    <DataTable :value="databaseRows" responsiveLayout="scroll" sortField="storeUsedBytes" :sortOrder="-1">
      <Column field="id" header="Database">
        <template #body="slotProps">
          <router-link :to="{ name: 'db:database', params: { dbName: slotProps.data.id } }">
            {{ slotProps.data.id  }}
          </router-link>
        </template>
      </Column>
      <Column field="tables" header="Tables" :headerStyle="{ 'width': '60px' }"></Column>
      <Column field="indexes" header="Indexes" :headerStyle="{ 'width': '60px' }"></Column>
      <Column field="logs" header="Logs" :headerStyle="{ 'width': '60px' }"></Column>
      <Column field="storeUsedBytes" header="Stores" :headerStyle="{ 'width': '100px' }">
        <template #body="slotProps">{{ formatBytes(slotProps.data.storeUsedBytes) }}</template>
      </Column>
      <Column field="allocatedFileBytes" header="Disk" :headerStyle="{ 'width': '100px' }">
        <template #body="slotProps">{{ formatBytes(slotProps.data.allocatedFileBytes ?? slotProps.data.fileBytes) }}</template>
      </Column>
      <Column field="wasteBytes" header="Waste" :headerStyle="{ 'width': '100px' }">
        <template #body="slotProps">{{ formatBytes(slotProps.data.wasteBytes) }}</template>
      </Column>
      <Column :headerStyle="{ 'width': '30px' }">
        <template #body="slotProps">
          <Button @click="ev => deleteDatabase(ev, slotProps.data.id)" type="button"
                  icon="pi pi-trash" class="p-button-rounded p-button-danger" />
        </template>
      </Column>
    </DataTable>

    <form class="mt-12 flex flex-row" @submit="handleNewDatabaseSubmit">
      <InputText v-model="newDatabaseName" class="mr-2" placeholder="Database Name" />
      <Button type="submit" class="p-button-primary" icon="pi pi-plus" label="Create Database" />
    </form>

  </div>
</template>

<script setup>
  import DataTable from "primevue/datatable"
  import Column from "primevue/column"
  import Button from "primevue/button"
  import InputText from "primevue/inputtext"

  import ConfirmPopup from 'primevue/confirmpopup'
  import Toast from 'primevue/toast'

  const { dbApi } = defineProps({
    dbApi: {
      type: String,
      default: 'serverDatabase'
    }
  })

  import { ref, computed, onMounted, onUnmounted, inject, watch } from "vue"
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

  function deleteDatabase(event, id) {
    confirm.require({
      target: event.currentTarget,
      message: `Do you really want to delete database ${id}?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        workingZone.addPromise('deleteDatabase', (async () => {
          await dao.request([dbApi, 'deleteDatabase'], id)
          toast.add({ severity:'info', summary: `Database ${id} deleted`, life: 1500 })
          await refreshSizes()
        })())
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

  const newDatabaseName = ref("")
  function handleNewDatabaseSubmit(event) {
    event.preventDefault()
    const dbName = newDatabaseName.value
    newDatabaseName.value = ""
    workingZone.addPromise('createDatabase', (async () => {
      await dao.request([dbApi, 'createDatabase'], dbName)
      toast.add({ severity:'info', summary: `Database ${dbName} created`, life: 1500 })
      await refreshSizes()
    })())
  }

  const databases = await live(dao, {
    what: [dbApi, 'databases'],
    more: [
      { to: 'tables', schema: [[ dbApi, 'tablesCount', { property: 'id' } ]] },
      { to: 'indexes', schema: [[ dbApi, 'indexesCount', { property: 'id' } ]] },
      { to: 'logs', schema: [[ dbApi, 'logsCount', { property: 'id' } ]] }
    ]
  })

  const sizeByDb = ref({})
  const sizesLoading = ref(false)

  async function refreshSizes() {
    sizesLoading.value = true
    try {
      const list = databases.value || []
      const next = {}
      await Promise.all(list.map(async (row) => {
        try {
          const stats = await dao.get([dbApi, 'databaseStorageStats', row.id])
          next[row.id] = {
            storeUsedBytes: stats.totals?.storeUsedBytes ?? null,
            allocatedFileBytes: stats.env?.allocatedFileBytes ?? null,
            fileBytes: stats.env?.fileBytes ?? null,
            wasteBytes: stats.wasteBytes ?? null
          }
        } catch(e) {
          next[row.id] = {
            storeUsedBytes: null,
            allocatedFileBytes: null,
            fileBytes: null,
            wasteBytes: null
          }
        }
      }))
      sizeByDb.value = next
    } finally {
      sizesLoading.value = false
    }
  }

  await refreshSizes()

  watch(() => (databases.value || []).map(d => d.id).join(','), () => {
    refreshSizes()
  })

  const databaseRows = computed(() => {
    return (databases.value || []).map(row => ({
      ...row,
      ...(sizeByDb.value[row.id] || {})
    }))
  })

</script>
