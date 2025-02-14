<template>
  <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border w-full">
    <ConfirmPopup v-if="isMounted"></ConfirmPopup>
    <Toast v-if="isMounted"></Toast>
    <div class="text-center mb-4">
      <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Database "{{ dbName }}" @ {{ dbApi }}</div>
    </div>
    <div class="text-center mb-4">
      <div v-if="tables.length > 0" class="text-surface-900 dark:text-surface-0 text-2xl font-medium mb-4">Tables</div>
      <div v-else class="text-surface-600 dark:text-surface-200 text-xl font-medium mb-4">
        There are no tables. Create first one.
      </div>
    </div>

    <DataTable v-if="tables.length > 0" :value="tables" responsiveLayout="scroll">
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
      <Column field="rows" header="Rows" :headerStyle="{ 'width': '60px' }"></Column>
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

    <form class="mt-6 flex flex-row justify-center" @submit="handleNewTableSubmit">
      <InputText v-model="newTableName" class="mr-2" placeholder="Table Name" />
      <Button type="submit" class="p-button-primary" icon="pi pi-plus" label="Create Table" />
    </form>


    <div class="text-center mb-4 mt-8">
      <div v-if="logs.length > 0" class="text-surface-900 dark:text-surface-0 text-2xl font-medium mb-4">Logs</div>
      <div v-else class="text-surface-600 dark:text-surface-200 text-xl font-medium mb-4">
        There are no logs. Create first one.
      </div>
    </div>

    <DataTable v-if="logs.length > 0" :value="logs" responsiveLayout="scroll">
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
      <Column field="rows" header="Rows" :headerStyle="{ 'width': '60px' }"></Column>
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

    <form class="mt-6 flex flex-row justify-center" @submit="handleNewLogSubmit">
      <InputText v-model="newLogName" class="mr-2" placeholder="Log Name" />
      <Button type="submit" class="p-button-primary" icon="pi pi-plus" label="Create Log" />
    </form>


    <div class="text-center mb-4 mt-8">
      <div v-if="indexes.length > 0" class="text-surface-900 dark:text-surface-0 text-2xl font-medium mb-4">Indexes</div>
      <div v-else class="text-surface-600 dark:text-surface-200 text-xl font-medium mb-4">
        There are no indexes.
      </div>
    </div>

    <DataTable v-if="indexes.length > 0" :value="indexes" responsiveLayout="scroll">
      <Column field="id" header="Index">
        <template #body="slotProps">
          <form v-if="indexRename === slotProps.data.id" @submit="ev => finishIndexRename(ev, slotProps.data.id)">
            <InputText v-model="indexNewName" />
          </form>
          <router-link v-else :to="indexLink(dbName, slotProps.data.id)">
            {{ slotProps.data.id  }}
          </router-link>
        </template>
      </Column>
      <Column field="rows" header="Rows" :headerStyle="{ 'width': '60px' }"></Column>
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

  import { ref, onMounted, onUnmounted, inject } from "vue"
  let isMounted = ref(false)
  onMounted(() => isMounted.value = true)
  onUnmounted(() => isMounted.value = false)

  import { api } from "@live-change/vue3-ssr"
  const dao = api().source
  import { live, RangeBuckets } from "@live-change/dao-vue3"

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  const workingZone = inject('workingZone')

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
      } catch(error) {
        toast.add({ severity: 'error', summary: `Index ${indexName} not renamed`, detail: error.message, life: 3000 })
      }
    })())
  }

  const [ tables, indexes, logs ] = await Promise.all([
    live(dao, {
      what: [dbApi, 'tables', dbName],
      more: [{ to: 'rows', schema: [[dbApi, 'tableCount', dbName, { property: 'id' }, { static: { limit: 999 }} ]] }]
    }),
    live(dao, {
      what: [dbApi, 'indexes', dbName],
      more: [{ to: 'rows', schema: [[dbApi, 'indexCount', dbName, { property: 'id' }, { static: { limit: 999 }} ]] }]
    }),
    live(dao, {
      what: [dbApi, 'logs', dbName],
      more: [{ to: 'rows', schema: [[dbApi, 'logCount', dbName, { property: 'id' }, { static: { limit: 999 }} ]] }]
    })
  ])

</script>
