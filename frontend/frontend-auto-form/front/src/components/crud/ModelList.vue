<template>
  <div>
<!--    <h4>definition</h4>
    <pre>{{ modelDefinition }}</pre>-->

<!--    <pre>{{ modelsPathRangeConfig.view }}</pre>
    <pre>{{ identifiers }}</pre>-->

    <div class="surface-card w-full p-3 shadow-1 border-round mb-2">
      <slot name="header">
        <div class="">
          Service <strong>{{ service }}</strong>
        </div>
        <div class="text-2xl">
          <strong>{{ pluralize(model) }}</strong>
          <span class="ml-1">list</span>
        </div>
      </slot>
    </div>

    <div class="surface-card p-3 shadow-1 border-round" v-if="modelsPathRangeFunctions">
      <range-viewer v-for="(modelsPathRangeFunction, index) in modelsPathRangeFunctions"
                    :key="JSON.stringify(modelsPathRangeConfig)+index"
                    :pathFunction="modelsPathRangeFunction"
                    :canLoadTop="false" canDropBottom
                    loadBottomSensorSize="4000px" dropBottomSensorSize="3000px">
        <template #empty>
          <div class="text-xl text-800 my-1 mx-3">
            No <strong>{{ pluralize(model[0].toLowerCase() +  model.slice(1)) }}</strong> found.
          </div>
        </template>
        <template #default="{ item: object }">
          <div class="flex flex-row align-items-center justify-content-between my-3">
            <router-link :to="viewRoute(object)" class="no-underline text-color">
              <ObjectIdentification
                :objectType="service + '_' + model"
                :object="object.to ?? object.id"
                :data="object"
                class="text-xl"
              />
            </router-link>
            <div class="flex flex-row">
              <router-link :to="viewRoute(object)" class="no-underline">
                <Button icon="pi pi-eye" severity="primary" label="View" class="mr-2" />
              </router-link>

              <router-link :to="editRoute(object)" class="no-underline">
                <Button icon="pi pi-pencil" severity="primary" label="Edit" class="mr-2" />
              </router-link>

              <Button v-if="modelDefinition.crud?.delete" @click="ev => deleteObject(ev, object)"
                      icon="pi pi-eraser" severity="primary" label="Delete" class="mr-2" />
            </div>
          </div>
        </template>
      </range-viewer>
    </div>
    <div v-else class="flex align-items-start p-4 bg-pink-100 border-round border-1 border-pink-300 mb-4">
      <i class="pi pi-times-circle text-pink-900 text-2xl mr-3" />
      <div class="mr-3">
        <div class="text-pink-900 font-medium text-xl mb-3 line-height-1">Not authorized</div>
        <p class="m-0 p-0 text-pink-700">
          You do not have sufficient privileges to use this feature of this object.
        </p>
      </div>
    </div>

    <div v-if="modelDefinition.crud?.create" class="mt-2 flex flex-row justify-content-end mr-2">
      <router-link :to="createRoute" class="no-underline2">
        <Button icon="pi pi-plus" :label="'Create new '+model" />
      </router-link>
    </div>

    <ConfirmPopup group="delete">
      <template #message="slotProps">
        <div class="flex flex-row align-items-center w-full gap-3 border-bottom-1 surface-border px-3 pt-1 pb-1">
          <i class="pi pi-trash text-3xl text-primary-500"></i>
          <p>
            Do you want to delete {{ model[0].toLowerCase() + model.slice(1) }}
            <ObjectIdentification
              :objectType="service + '_' + model"
              :object="slotProps.message.object.to ?? slotProps.message.object.id"
              :data="slotProps.message.object"
            />
            ?
          </p>
        </div>
      </template>
    </ConfirmPopup>
  </div>
</template>

<script setup>

  import ConfirmPopup from "primevue/confirmpopup"
  import Button from "primevue/button"

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

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
    },
    identifiers: {
      type: Object,
      default: () => ({})
    },
    view: {
      type: String,
      default: undefined
    }
  })
  const { service, model, identifiers, view } = toRefs(props)

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
      reverse: true,
      view: modelDefinition.value?.crud?.[view.value ?? 'range']
    }
  })
  const modelsPathRangeFunctions = computed(() => {
    const config = modelsPathRangeConfig.value
    const rangeView = config.view
    if(!path[config.service]) return null
    if(!path[config.service][rangeView]) return null
    let idents = identifiers.value
    if(!Array.isArray(idents)) idents = [idents]
    return idents.map(ident => (range) =>  path[config.service][rangeView]({
      ...ident,
      ...(config.reverse ? reverseRange(range) : range),
    }))
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

  function viewRoute(object) {
    return {
      name: 'auto-form:view',
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
      modelName: model.value,
      identifiers: Object.values(identifiers.value[0])
    }
  }))

  function deleteObject(event, object) {
    confirm.require({
      group: 'delete',
      target: event.currentTarget,
      object,
      acceptClass: "p-button-danger",
      accept: async () => {
        await api.actions[service.value][modelDefinition.value.crud.delete]({
          ...objectIdentifiers(object)
        });
        toast.add({ severity: "info", summary: model.value + " deleted", life: 1500 });
      },
      reject: () => {
        toast.add({ severity: "error", summary: "Rejected", detail: "You have rejected", life: 3e3 });
      }
    });
  }

</script>

<style scoped>

</style>