<template>
  <page>
    <div class="card full-width main-card">
      <h1>Databases</h1>
      <table class="table">
        <thead>
          <tr>
            <th>
              Database
            </th>
            <th class="numeric">
              Tables
            </th>
            <th class="numeric">
              Indexes
            </th>
            <th class="numeric">
              Logs
            </th>
            <th class="numeric">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="database in databases">
            <td>
              <router-link :to="{ name: 'database', params: { databaseName: database } }">
                {{ database }}
              </router-link>
            </td>
            <observe :what="['database', 'tablesList', database]"
                     name="tables" class="numeric"
                     tag="td"
                     v-slot="{ value: tables }">
              {{ tables.length }}
            </observe>
            <observe :what="['database', 'indexesList', database]"
                     name="indexes" class="numeric"
                     tag="td"
                     v-slot="{ value: indexes }">
              {{ indexes.length }}
            </observe>
            <observe :what="['database', 'logsList', database]"
                     name="indexes" class="numeric"
                     tag="td"
                     v-slot="{ value: logs }">
              {{ logs.length }}
            </observe>
            <td class="buttons">
              <button class="button" @click="() => deleteDatabase(database)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card full-width main-card">
      <CreateDatabase></CreateDatabase>
    </div>
  </page>
</template>

<script>
import ConfirmDialog from "@/components/ConfirmDialog.vue"
import overlayModel from "@/components/utils/overlayModel.js"
import CreateDatabase from "./segments/CreateDatabase.vue"

export default {
  name: "Databases",
  components: { CreateDatabase },
  inject: ["workingZone"],
  reactive: {
    databases: ['database', 'databasesList']
  },
  methods: {
    deleteDatabase(name) {
      overlayModel.show({
        component: ConfirmDialog,
        props: {
          title: `Delete database ${name}`,
          text: `Do you really want to delete this database?`
        },
        on: {
          yes: () => {
            this.workingZone.addPromise(`delete database ${name}`,
                api.request(["database", "deleteDatabase"], name )
            )
          }
        }
      })
    }
  }
}
</script>

<style scoped>

</style>