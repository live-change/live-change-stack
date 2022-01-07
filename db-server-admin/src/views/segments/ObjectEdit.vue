<template>
  <div class="object">
    <h3 v-if="!editId">{{ data.id }}</h3>
    <prism-editor class="config-editor" :highlight="highlighter"
                  :style="{ height: (code.split('\n').length*1.2+1.0) + 'em' }"
                  v-model="code" :readonly="readOnly" line-numbers>
    </prism-editor>
    <div v-if="editResult.error" class="field-error">
      {{ editResult.error }}
    </div>
    <div class="buttons">
      <button v-if="!readOnly" type="button" class="button" @click="deleteObject">{{ deleteText }}</button>
      <button v-if="!readOnly && modified" :disabled="editResult.error"
              type="button" class="button" @click="saveObject">{{ updateText }}</button>
    </div>
  </div>
</template>

<script>
import api from "@/api"
import { stringify } from "javascript-stringify"

export default {
  name: "ObjectEdit",
  props: {
    viewType: {
      type: String,
      required: true
    },
    viewName: {
      type: String,
      required: true
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default() {
        return {
          id: api.guid()
        }
      }
    },
    updateText: {
      type: String,
      default: "Update"
    },
    deleteText: {
      type: String,
      default: "Delete"
    },
    editId: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const d = this.editId
     ? JSON.parse(JSON.stringify({ ...this.data }))
     : JSON.parse(JSON.stringify({ ...this.data, id: undefined }))

    return {
      initialCode: stringify(d, null, "  "),
      code: stringify(d, null, "  ")
    }
  },
  computed: {
    modified() {
      return this.initialCode != this.code
    },
    editResult() {
      if(!this.modified) return ({ data: this.data })
      try {
        const result = eval('(' + this.code + ')')
        if(result && typeof result == 'object') return { data: result }
        return { error: 'empty' }
      } catch(e) {
        if(e instanceof SyntaxError) {
          if(e.lineNumber) return {
            error: `${e.message} at ${e.lineNumber}:${e.columnNumber - (e.lineNumber ? 0 : -1)}`
          }
        }
        return { error: e.message }
      }
    }
  },
  methods: {
    highlighter(code) {
      return Prism.highlight(code, Prism.languages.js, "js");
    },
    deleteObject() {
      this.$emit("delete")
    },
    saveObject() {
      if(this.editResult.error) return
      if(!this.editId) {
        this.$emit('update', { ...this.editResult.data, id: this.data.id })
      } else {
        this.$emit('update', { ...this.editResult.data })
      }

    }
  }
}
</script>

<style scoped>

</style>