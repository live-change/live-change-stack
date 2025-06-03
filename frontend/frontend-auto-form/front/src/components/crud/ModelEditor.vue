<template>
  <div>
<!--

      <h4>definition</h4>
      <pre>{{ modelDefinition }}</pre>
-->
    <div v-if="editor && editor.saved?.value?.id" >
      <ObjectPath :objectType="service + '_' + model" :object="editor?.saved?.value?.id" class="mb-6" />
    </div>
    <div v-else-if="editor && !editor.saved?.value">      
      <div v-for="parentObject in parentObjects">
        <ObjectPath :objectType="parentObject.objectType" :object="parentObject.object" 
                    class="mb-6" more>
          <template #more="slotProps">
            New {{ model }}
          </template>
        </ObjectPath>
      </div>
    </div>

<!--     <pre>parentObjects = {{ parentObjects }}</pre>
    <pre>scopesPath = {{ scopesPath }}</pre>
    <pre>scopes = {{ scopes }}</pre> -->

    <div class="">
      Service <strong>{{ service }}</strong>
    </div>
    <div class="flex flex-row flex-wrap justify-between align-items-top">
      <div class="text-2xl mb-6">
        <span v-if="isNew">Create </span>
        <span v-else>Edit </span>
        <strong>{{ model }}</strong>
      </div>
      <div v-if="!isNew" class="flex flex-row flex-wrap justify-between align-items-top gap-2">
        <router-link :to="viewRoute">
          <Button label="View" icon="pi pi-eye" class="p-button mb-6" />
        </router-link>
      </div>
    </div>

    <form v-if="editor" @submit="handleSave" @reset="handleReset">
      <div v-for="identifier in modelDefinition.identifiers">                
        <template v-if="(identifier.name ?? identifier).slice(-4) !== 'Type'">
          <div v-if="identifiers[identifier.name ?? identifier]" class="flex flex-col mb-3">        
            <div class="min-w-[8rem] font-medium">{{ identifier.name ?? identifier }}</div>
            <div class="">
              <InjectedObjectIndentification v-if="identifiers[(identifier.name ?? identifier)+'Type']
                       ?? modelDefinition.properties[identifier.field ?? identifier]?.type"
                :type="identifiers[(identifier.name ?? identifier)+'Type']
                       ?? modelDefinition.properties[identifier.field ?? identifier]?.type"
                :object="identifiers[identifier.name ?? identifier]"
              />
            </div>
          </div>      
          <div v-else class="flex flex-col mb-3">
            <auto-field :key="identifier"
                  v-model="editor.value.value[identifier.field ?? identifier]"              
                  :definition="modelDefinition.properties[identifier.field ?? identifier]"
                  :label="identifier.name ?? identifier"
                  :rootValue="props.rootValue" :propName="identifier.field ?? identifier"
                  :i18n="i18n"
                  class="col-span-12" />
          </div>
        </template>
      </div>
      <auto-editor
        :definition="modelDefinition"
        v-model="editor.value.value"
        :rootValue="editor.value.value"
        :errors="editor.propertiesErrors"
        :i18n="i18n" />
      <EditorButtons :editor="editor" reset-button />
    </form>
  </div>
</template>

<script setup>

  import AutoEditor from '../form/AutoEditor.vue'
  import EditorButtons from './EditorButtons.vue'
  import AutoField from "../form/AutoField.vue"

  import ObjectPath from './ObjectPath.vue'

  import { ref, computed, onMounted, defineProps, defineEmits, toRefs, inject, provide } from 'vue'

  const props = defineProps({
    service: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    identifiers: {
      type: Object,
      default: () => ({})
    },
    draft: {
      type: Boolean,
      default: false
    },
    options: {
      type: Object,
      default: () => ({})
    },
    i18n: {
      type: String,
      default: ''
    }
  })
  const { service, model, identifiers, draft, options, i18n } = toRefs(props)

  const emit = defineEmits(['saved', 'draftSaved', 'draftDiscarded', 'saveError', 'created' ])

  import { useApi, usePath, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  const modelDefinition = computed(() => {
    return api.services?.[service.value]?.models?.[model.value]
  })

  import { parentObjectsFromIdentifiers } from '../../logic/relations.js'
  const parentObjects = computed(() => parentObjectsFromIdentifiers(identifiers.value, modelDefinition.value))

  import { editorData } from "@live-change/frontend-auto-form"
  import { computedAsync } from "@vueuse/core"
  import InjectedObjectIndentification from './InjectedObjectIndentification.vue'

  const editor = computedAsync(async () => {
    try {
      const ed = await editorData({
        service: service.value,
        model: model.value,
        identifiers: identifiers.value,
        draft: draft.value,
        autoSave: true,
        ...options.value,
        onSaved: (...args) => handleSaved(...args),
        onDraftSaved: (...args) => emit('draftSaved', ...args),
        onDraftDiscarded: (...args) => emit('draftDiscarded', ...args),
        onSaveError: (...args) => emit('saveError', ...args),
        onCreated: (...args) => emit('created', ...args),
      })
      //console.log("ED", ed)
      return ed
    } catch(e) {
      console.error("EDITOR ERROR", e)
      return null
    }
  })

  const isNew = computed(() => !editor?.value?.saved?.value)

  function handleSave(ev) {
    ev.preventDefault()
    editor.value.save()
  }

  function handleReset(ev) {
    ev.preventDefault()
    editor.value.reset()
  }

  function handleSaved(saveResult) {
    console.log("SAVED", saveResult, isNew.value, editor.value.isNew)
    if(saveResult && isNew.value && editor.value.isNew) {
      emit('created', saveResult)
    } else {
      emit('saved', saveResult)
    }
  }

  const viewRoute = computed(() => editor.value?.saved && ({
    name: 'auto-form:view',
    params: {
      serviceName: service.value,
      modelName: model.value,
      id: editor.value.saved?.value?.to ?? editor.value.saved?.value?.id
    }
  }))

  const scopesPath = computed(() => parentObjects.value[0] && path.scope.objectScopes({
    objectType: parentObjects.value[0].objectType, /// TODO: support multiple parent objects!
    object: parentObjects.value[0].object
  }))

  const [scopes] = await Promise.all([
    live(scopesPath)
  ])

  console.log("SCOPES", scopes)
  provide('scopePickerConfig', {
    objectsPathRangeConfig: (service, model, definition, modelDefinition) => computed(() => {      
      const scopeType = scopes.value[0].scopeType // TODO: support multiple scopes!
      const scope = scopes.value[0].scope
      return {
        service,
        model,
        reverse: true,
        viewPath: (range) => path.scope.scopeObjects({
          scopeType,
          scope,
          objectType: `${service}_${model}`,
          ...range  
        }),
        parameters: {}
      }      
    })
  }) 

</script>

<style scoped>

</style>