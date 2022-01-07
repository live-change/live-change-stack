<template>
  <page>
    <div class="card full-width main-card"  v-if="databaseConfig">
      <h1>Database {{ databaseName }}</h1>
      <h2>Config</h2>
      <prism-editor class="config-editor" :highlight="highlighter"
                    :style="{ height: (configCode.split('\n').length*1.2+1.0) + 'em' }"
                    :value="configCode" readonly line-numbers>
      </prism-editor>
      <table class="table">
        <thead>
          <tr>
            <th>
              Table
            </th>
            <th class="numeric">
              Rows
            </th>
            <th class="numeric">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tableName in Object.keys(databaseConfig.tables)">
            <td>
              <router-link :to="{ name: 'table', params: { databaseName, viewName: tableName } }">
                {{ tableName }}
              </router-link>
            </td>
            <observe :what="['database', 'tableCount', databaseName, tableName, { limit: 999 } ]"
                     :name="'tableCount '+tableName" class="numeric"
                     tag="td"
                     v-slot="{ value: rows }">
              {{ rows }}
            </observe>
            <td class="buttons">
              <button class="button" type="button" @click="() => deleteTable(tableName)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <table class="table">
        <thead>
          <tr>
            <th>
              Index
            </th>
            <th class="numeric">
              Rows
            </th>
            <th class="numeric">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="indexName in Object.keys(databaseConfig.indexes)">
            <td>
              <router-link :to="{ name: 'index', params: { databaseName, viewName: indexName } }">
                {{ indexName }}
              </router-link>
            </td>
            <observe :what="['database', 'indexCount', databaseName, indexName, { limit: 999 } ]"
                     :name="'indexCount '+indexName" class="numeric"
                     tag="td"
                     v-slot="{ value: rows }">
              {{ rows }}
            </observe>
            <td class="buttons">
              <button class="button" type="button" @click="() => deleteIndex(indexName)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <table class="table">
        <thead>
        <tr>
          <th>
            Log
          </th>
          <th class="numeric">
            Rows
          </th>
          <th class="numeric">
            Actions
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="logName in Object.keys(databaseConfig.logs)">
          <td>
            <router-link :to="{ name: 'log', params: { databaseName, viewName: logName } }">
              {{ logName }}
            </router-link>
          </td>
          <observe :what="['database', 'logCount', databaseName, logName, { limit: 999 } ]"
                   :name="'tableCount '+logName" class="numeric"
                   tag="td"
                   v-slot="{ value: rows }">
            {{ rows }}
          </observe>
          <td class="buttons">
            <button  class="button" type="button" @click="() => deleteLog(logName)">Delete</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="card full-width main-card"  v-if="databaseConfig">
      <CreateTable :database-name="databaseName"></CreateTable>
    </div>
    <div class="card full-width main-card"  v-if="databaseConfig">
      <CreateLog :database-name="databaseName"></CreateLog>
    </div>
    <div class="card full-width main-card"  v-if="databaseConfig">
      <CreateIndex :database-name="databaseName"></CreateIndex>
    </div>

  </page>
</template>

<script>
import ConfirmDialog from "@/components/ConfirmDialog.vue"
import overlayModel from "@/components/utils/overlayModel.js"
import CreateTable from "./segments/CreateTable.vue"
import CreateLog from "./segments/CreateLog.vue"
import CreateIndex from "./segments/CreateIndex.vue"

export default {
  name: "Database",
  props: {
    databaseName: {
      type: String,
      required: true
    }
  },
  inject: ["workingZone"],
  components: { CreateTable, CreateLog, CreateIndex },
  reactive: {
    databaseConfig(){
      return ['database', 'databaseConfig', this.databaseName]
    }
  },
  computed: {
    cleanConfig() {
      return {
        ...this.databaseConfig,
        indexes: undefined,
        tables: undefined,
        logs: undefined
      }
    },
    configCode() {
      return JSON.stringify(this.cleanConfig, null,'  ')
    }
  },
  methods: {
    highlighter(code) {
      return Prism.highlight(code, Prism.languages.js, "js");
    },
    deleteTable(name) {
      overlayModel.show({
        component: ConfirmDialog,
        props: {
          title: `Delete table ${name} from database ${this.databaseName}`,
          text: `Do you really want to remove this table?`
        },
        on: {
          yes: () => {
            this.workingZone.addPromise(`delete table ${name} from ${this.databaseName})`,
                api.request(["database", "deleteTable"], this.databaseName, name )
            )
          }
        }
      })
    },
    deleteIndex(name) {
      overlayModel.show({
        component: ConfirmDialog,
        props: {
          title: `Delete index ${name} from database ${this.databaseName}`,
          text: `Do you really want to remove this index?`
        },
        on: {
          yes: () => {
            this.workingZone.addPromise(`delete index ${name} from ${this.databaseName})`,
                api.request(["database", "deleteIndex"], this.databaseName, name )
            )
          }
        }
      })
    },
    deleteLog(name) {
      overlayModel.show({
        component: ConfirmDialog,
        props: {
          title: `Delete log ${name} from database ${this.databaseName}`,
          text: `Do you really want to remove this log?`
        },
        on: {
          yes: () => {
            this.workingZone.addPromise(`delete log ${name} from ${this.viewName})`,
                api.request(["database", "deleteLog"], this.databaseName, name )
            )
          }
        }
      })
    }
  },
}
</script>

<style scoped>

</style>