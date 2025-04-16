<template>
  <div>
    <div v-if="!model && !selectedType && typeOptions.length < 8">
      <div class="p-2">
        <div class="text-sm text-surface-600 dark:text-surface-400 mb-2">
          {{ t('objectPicker.selectObjectType') }}
        </div>
        <div class="flex flex-col">
          <div v-for="type in typeOptions" :key="type"
               class="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer"
               @click="selectedType = type">
            {{ typeLabel(type) }}
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div v-if="isTypeNeeded" class="bg-surface-100 dark:bg-surface-900 p-1 py-2 sticky top-0 z-10">
        <div v-if="typeOptions.length > 1"
          class="flex flex-col gap-2">
    <!--       <label :for="`type-select-${uid}`">{{ t('objectPicker.selectObjectType') }}</label> -->
          <Select v-model="selectedType" :options="typeOptions" :id="`type-select-${uid}`"
                  :placeholder="t('objectPicker.selectObjectType')"
                  :optionLabel="typeLabel" />
        </div>
        <div v-else>
          <span>{{ t('objectPicker.currentType') }} {{ selectedTypeModel }}</span>
          <span v-if="showServiceName">{{ t('objectPicker.fromService') }} {{ selectedTypeService }}</span>
        </div>
      </div>

      <div v-if="objectsPathRangeFunction">
        <range-viewer :key="JSON.stringify(objectsPathRangeConfig)"
                      :pathFunction="objectsPathRangeFunction"
                      :canLoadTop="false" canDropBottom
                      loadBottomSensorSize="4000px" dropBottomSensorSize="3000px">
          <template #empty>
            <div class="text-xl text-surface-800 dark:text-surface-50 my-1 mx-4">
              No <strong>
                {{ pluralize(selectedTypeModel[0].toLowerCase() +  selectedTypeModel.slice(1)) }}
              </strong> found.
            </div>
          </template>
          <template #default="{ item: object }">
            <div @click="selectObject(object)"
                class="flex flex-row items-center justify-between my-1 py-2 px-4
                  bg-surface-100 dark:bg-surface-900 hover:bg-surface-200 dark:hover:bg-surface-800">
              <ObjectIdentification
                :objectType="selectedTypeService + '_' + selectedTypeModel"
                :object="object.to ?? object.id"
                :data="object"
                class=""
              />
            </div>
          </template>
        </range-viewer>
      </div>
    </div>


    <!-- <pre>isTypeNeeded = {{ isTypeNeeded }}</pre>
    <pre>typePropertyName = {{ typePropertyName }}</pre>
    <pre>typePropertyPath = {{ typePropertyPath }}</pre>
    <pre>typeModel = {{ typeModel }}</pre> -->
    <!-- <div>
      <pre>objectsPathRangeConfig = {{ objectsPathRangeConfig }}</pre>
      <pre>objectsPathRangeFunction = {{ objectsPathRangeFunction }}</pre>
      <pre>selectedType = {{ selectedType }}</pre>
      <pre>definition = {{ definition }}</pre>
      <pre>properties = {{ properties }}</pre>
      <pre>typeOptions = {{ typeOptions }}</pre>
      <pre>model = {{ model }}</pre>
    </div> -->
  </div>
</template>

<script setup>
  import Select from 'primevue/select'
  import AutoObjectIdentification from '../crud/DefaultObjectIdentification.vue'
  import { RangeViewer, injectComponent } from "@live-change/vue3-components"

  import { defineProps, defineEmits, toRefs, ref, defineModel, computed, useId } from 'vue'
  import pluralize from 'pluralize'

  const uid = useId()

  const props = defineProps({
    definition: {
      type: Object
    },
    properties: {
      type: Object,
      default: () => ({})
    },
    rootValue: {
      type: Object,
      default: () => ({})
    },
    propName: {
      type: String,
      default: ''
    },
    i18n: {
      type: String,
      default: ''
    },
    showServiceName: {
      type: Boolean,
      default: false
    },
    view: {
      type: String,
      default: 'range'
    } 
  })

  const { definition, properties, rootValue, propName, i18n, view } = toRefs(props)

  const model = defineModel({
    required: true
  })

  const emit = defineEmits(['selected'])

  import { useI18n } from 'vue-i18n'
  const { t: tI18n, te } = useI18n()
  const t = (key, ...params) => tI18n(
    te(i18n.value + propName.value + key) 
    ? i18n.value + propName.value + key 
    : key, ...params
  )

  const isTypeNeeded = computed(() => {
    return definition.value.type === 'any'
  })
  const typePropertyName = computed(() => props.propName + 'Type')
  const typePropertyPath = computed(() => typePropertyName.value.split('.'))
  const typeModel = computed({
    get() {
      return typePropertyPath.value.reduce((acc, prop) => acc?.[prop], rootValue.value)  
    },
    set(value) {
      const path = typePropertyPath.value
      let data = rootValue.value
      for(let i = 0; i < path.length - 1; i++) {
        const prop = path[i]
        if(data[prop] === undefined || data[prop] === null) {
          data[prop] = {}
        }
        data = data[prop]
      }
      data[path.at(-1)] = value
    }
  })

  import { getAllTypesWithCrud } from '../../logic/relations'

  const typeOptions = computed(() => {
    if(definition.value.type === 'any') {
      return definition.value.types ?? getAllTypesWithCrud('read')
    }
    return [definition.value.type]
  })

  const typeOptionsServices = computed(() => {
    return Array.from(new Set(typeOptions.value.map(option => option.split('_')[0])))
  })

  const selectedType = ref(null)

  console.log("Type options", typeOptions.value)
  if(typeModel.value) {
    selectedType.value = typeModel.value
  } else if(typeOptions.value.length === 1) {
    selectedType.value = typeOptions.value[0]
  }

  const selectedTypeParsed = computed(() => {
    if(selectedType.value) return selectedType.value.split('_')    
    return null
  })

  const selectedTypeService = computed(() => {
    if(selectedTypeParsed.value) return selectedTypeParsed.value[0]
    return null
  })  

  const selectedTypeModel = computed(() => {
    if(selectedTypeParsed.value) return selectedTypeParsed.value[1]
    return null
  })

  const ObjectIdentification = computed(() => {
    const [service, model] = selectedTypeParsed.value
    return injectComponent({
      name: 'ObjectIdentification',
      type: service + '_' + model,
      service: service,
      model: model
    }, AutoObjectIdentification)
  })
  
  function typeLabel(option) {
    const [service, model] = option.split('_')
    if(typeOptionsServices.value.length === 1) {
      return t('objectPicker.modelOption', { model })
    }
    return t('objectPicker.modelOptionWithService', { service, model })
  }

  import { useApi, usePath, live, reverseRange } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()  

  const objectsPathRangeConfig = computed(() => {
    if(!selectedTypeParsed.value) return null
    const [service, model] = selectedTypeParsed.value
    const serviceDefinition = api.metadata.api.value.services.find(s => s.name === service)
    const modelDefinition = serviceDefinition.models[model]
    return {
      service,
      model,
      reverse: true,
      view: modelDefinition?.crud?.[view.value ?? 'range']
    }
  })
  const objectsPathRangeFunction = computed(() => {
    const config = objectsPathRangeConfig.value
    if(!config) return null
    const rangeView = config.view
    if(!path[config.service]) return null
    if(!path[config.service][rangeView]) return null    
    return (range) =>  path[config.service][rangeView]({
      //...ident,
      ...(config.reverse ? reverseRange(range) : range),
    })
  })

  function selectObject(object) {
    if(isTypeNeeded.value) {
      typeModel.value = selectedType.value
    }
    model.value = object.to ?? object.id
    emit('selected', object)
  }

</script>

<style scoped>
</style>