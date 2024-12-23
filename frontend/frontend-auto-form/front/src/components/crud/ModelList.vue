<template>
  <div class="w-full lg:w-8 md:w-11">
<!--    <h4>definition</h4>
    <pre>{{ modelDefinition }}</pre>-->

    <div class="surface-card w-full p-3 shadow-1 border-round mb-2">
      <div class="">
        Service <strong>{{ service }}</strong>
      </div>
      <div class="text-2xl">
        <strong>{{ pluralize(model) }}</strong>
        <span class="ml-1">list</span>
      </div>
    </div>

    <div class="surface-card p-3 shadow-1 border-round">
      <range-viewer :key="JSON.stringify(modelsPathRangeConfig)"
                    :pathFunction="modelsPathRangeFunction"
                    :canLoadTop="false" canDropBottom
                    loadBottomSensorSize="4000px" dropBottomSensorSize="3000px">
        <template #empty>
          <div class="text-xl text-800 my-3 mx-3">
            No {{ pluralize(model) }} found
          </div>
        </template>
        <template #default="{ item: object }">
          <div class="flex flex-row align-items-center justify-content-between">
            <ObjectIdentification
              :objectType="service + '_' + model"
              :object="object.to ?? object.id"
              :data="object"
            />
            <div class="flex flex-row">
              <router-link :to="editRoute(object)" class="no-underline">
                <Button icon="pi pi-pencil" severity="primary" label="Edit" class="mr-2" />
              </router-link>

              <Button icon="pi pi-eraser" severity="primary" label="Delete" class="mr-2" />
            </div>
          </div>
        </template>
      </range-viewer>
    </div>

    <div class="mt-3 flex flex-row justify-content-end mr-2">
      <router-link :to="createRoute" class="no-underline2">
        <Button icon="pi pi-plus" :label="'Create new '+model" />
      </router-link>
    </div>


  </div>
</template>

<script setup>

  import { ref, computed, onMounted, defineProps, toRefs } from 'vue'
  import { RangeViewer, injectComponent } from "@live-change/vue3-components"
  import pluralize from 'pluralize'

  const props = defineProps({
    service: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    }
  })
  const { service, model } = toRefs(props)

  import AutoObjectIdentification from './AutoObjectIdentification.vue'

  const ObjectIdentification = computed(() =>
    injectComponent({
      name: 'ObjectIdentification',
      type: service.value + '_' + model.value,
      service: service.value,
      model: model.value
    }, AutoObjectIdentification)
  )

  import { useApi, usePath, live, reverseRange } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  const modelDefinition = computed(() => {
    return api.services?.[service.value]?.models?.[model.value]
  })

  const modelsPathRangeConfig = computed(() => {
    return {
      service: service.value,
      model: model.value,
      definition: modelDefinition.value,
      reverse: true
    }
  })
  const modelsPathRangeFunction = computed(() => {
    const config = modelsPathRangeConfig.value
    const rangeView = config.definition?.crud?.range
    return (range) => path[config.service][rangeView]({
      ...(config.reverse ? reverseRange(range) : range),
    })
  })

  function objectIdentifiers(object) {
    const identifiers = {}
    for(const identifierDefinition of modelDefinition.value.identifiers) {
      if(typeof identifierDefinition === 'string') {
        identifiers[identifierDefinition] = object[identifierDefinition]
      } else {
        if(identifierDefinition.field === 'id') {
          identifiers[identifierDefinition.name] = object?.to ?? object.id
        } else {
          identifiers[identifierDefinition.name] = object[identifierDefinition.field]
        }
      }
    }
    return identifiers
  }

  function editRoute(object) {
    return {
      name: 'auto-form:editor',
      params: {
        serviceName: service.value,
        modelName: model.value,
        identifiers: Object.values(objectIdentifiers(object))
      }
    }
  }

  const createRoute = computed(() => ({
    name: 'auto-form:editor',
    params: {
      serviceName: service.value,
      modelName: model.name
    }
  }))

</script>

<style scoped>

</style>