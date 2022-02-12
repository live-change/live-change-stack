<template>
  <div class="surface-card p-4 shadow-2 border-round w-full">
    <ConfirmPopup v-if="isMounted"></ConfirmPopup>
    <Toast v-if="isMounted"></Toast>

    <div class="text-center mb-5">
      <div class="text-900 text-3xl font-medium mb-3">Databases</div>
    </div>

    <DataTable :value="databases" responsiveLayout="scroll">
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
      <Column :headerStyle="{ 'width': '30px' }">
        <template #body="slotProps">
          <Button @click="ev => deleteDatabase(ev, slotProps.data.id)" type="button"
                  icon="pi pi-trash" class="p-button-rounded p-button-danger" />
        </template>
      </Column>
    </DataTable>

<!--    <pre>{{ JSON.stringify(databases, null, '  ') }}</pre>-->

    <form class="mt-4 flex flex-row" @submit="handleNewDatabaseSubmit">
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

  function deleteDatabase(event, id) {
    confirm.require({
      target: event.currentTarget,
      message: `Do you really want to delete database ${id}?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        workingZone.addPromise('deleteDatabase', (async () => {
          await dao.request([dbApi, 'deleteDatabase'], id)
        })())
        toast.add({ severity:'info', summary: `Database ${id} deleted`, life: 1500 })
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


</script>
