<template>
  <page>
    <div class="card full-width main-card"  v-if="viewConfig">
      <h1>{{ viewType }} {{ viewName }} in {{ databaseName }}</h1>
      <h2>Config</h2>
      <prism-editor class="config-editor" :highlight="highlighter"
                    :style="{ height: (configCode.split('\n').length*1.2+1.0) + 'em' }"
                    :value="configCode" readonly line-numbers>
      </prism-editor>
      <h2>Data</h2>
      <button v-if="!adding" type="button" class="button" @click="()=>{adding=true}">Add row</button>
      <ObjectEdit v-if="adding" :read-only="false" updateText="Create" deleteText="Cancel"
                  :edit-id="viewType=='Table'"
                  :databaseName="databaseName" viewType="viewType" viewName="viewName"
                  @delete="()=>{ adding = false }" @update="(data)=>createObject(data)">
      </ObjectEdit>
      <scroll-loader :what="range => rangeDaoPath(range)" class="conversations" key="conversations"
                     :bucketSize="3" readMode="id" hardClose noDebugLog
                     v-slot:default="{ row, rows }">
        <ObjectEdit :data="row" :readOnly="readOnly" updateText="Save" deleteText="Delete"
                    @delete="()=>deleteObject(row)" @update="(data)=>updateObject(row.id, data)"
                    :databaseName="databaseName" viewType="viewType" viewName="viewName">
        </ObjectEdit>
      </scroll-loader>
    </div>
  </page>
</template>

<script>
import ScrollLoader from "@/components/ScrollLoader.vue"
import ObjectEdit from "./segments/ObjectEdit.vue"
import ConfirmDialog from "@/components/ConfirmDialog.vue"
import overlayModel from "@/components/utils/overlayModel.js"

function encodeQuery(query) {
  return query.map(
      and => and.map(
          or => `${encodeURIComponent(or.operator)}:${encodeURIComponent(or.phrase)}`
      ).join('+')
  ).join('&')
}
function decodeQuery(query) {
  return query.split('&').map(
      and => and.split('+').map(
          or => {
            const [ operator, phrase ] = or.split(':').map(decodeURIComponent)
            return { operator, phrase }
          }
      )
  )
}

export default {
  name: "RangeView",
  components: { ScrollLoader, ObjectEdit },
  props: {
    viewType: {
      type: String,
      required: true
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    databaseName: {
      type: String,
      required: true
    },
    viewName: {
      type: String
    },
    encodedRange: {
      type: String
    }
  },
  inject: ['workingZone'],
  reactive: {
    viewConfig() {
      return ['database', this.viewType.toLowerCase() +'Config', this.databaseName, this.viewName ]
    },
    rowsCount() {
      return ['database', this.viewType.toLowerCase() +'Count', this.databaseName, this.viewName, {} ]
    }
  },
  data() {
    return {
      adding: false
    }
  },
  computed: {
    cleanConfig() {
      return {
        ...this.viewConfig
      }
    },
    configCode() {
      return JSON.stringify(this.cleanConfig, null,'  ')
    },
    range() {
      return decodeQuery(this.encodedRange)
    }
  },
  methods: {
    highlighter(code) {
      return Prism.highlight(code, Prism.languages.js, "js");
    },
    rangeDaoPath(range) {
      return ['database', this.viewType.toLowerCase() +'Range', this.databaseName, this.viewName, range]
    },
    deleteObject(object) {
      overlayModel.show({
        component: ConfirmDialog,
        props: {
          title: `Delete object ${object.id} from table ${this.viewName}`,
          text: `Do you really want to remove this object?`
        },
        on: {
          yes: () => {
            this.workingZone.addPromise(`delete object ${object.id} from ${this.viewName})`,
                api.request(["database", "delete"], this.databaseName, this.viewName, object.id )
            )
          }
        }
      })
    },
    updateObject(rowId, data) {
      this.workingZone.addPromise(`update object ${data.id} in ${this.viewName})`,
          api.request(["database", "put"], this.databaseName, this.viewName, data)
      )
    },
    createObject(data) {
      if(this.viewType == 'Table') {
        this.workingZone.addPromise(`create object ${data.id} in ${this.viewName})`,
            api.request(["database", "put"], this.databaseName, this.viewName, data )
                .then(()=> this.adding = false)
        )
      } else if(this.viewType == 'Log') {
        this.workingZone.addPromise(`create log ${data.id} in ${this.viewName})`,
            api.request(["database", "putLog"], this.databaseName, this.viewName, data)
        )
      }
    }
  },
}
</script>

<style scoped>

</style>