<template>
  <div>
<!--    <h4>definition</h4>
    <pre>{{ modelDefinition }}</pre>-->

    <div class="bg-surface-0 dark:bg-surface-900 w-full p-4 shadow-sm rounded-border mb-2">
      <slot name="header">
        <div class="">
          Service <strong>{{ service }}</strong>
        </div>
        <div class="text-2xl">
          <strong>{{ model }}</strong>
        </div>
      </slot>
    </div>

    <!-- <pre>{{  modelDefinition  }}</pre> -->

    <div class="bg-surface-0 dark:bg-surface-900 p-4 shadow-sm rounded-border" v-if="modelsPaths">
      <div v-for="({ value: object }, index) in (modelsData ?? [])">
        <div v-if="!object" class="text-xl text-surface-800 dark:text-surface-50 my-1 mx-4">
          <strong>{{ model }}</strong> not found.
        </div>
        <div v-else
             :key="JSON.stringify(modelsPaths[index])+index"
             class="flex flex-row items-center justify-between my-4">
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
      </div>
    </div>
    <div v-else class="flex items-start p-6 bg-pink-100 rounded-border border border-pink-300 mb-6">
      <i class="pi pi-times-circle text-pink-900 text-2xl mr-4" />
      <div class="mr-4">
        <div class="text-pink-900 font-medium text-xl mb-4 leading-none">Not authorized</div>
        <p class="m-0 p-0 text-pink-700">
          You do not have sufficient privileges to use this feature of this object.
        </p>
      </div>
    </div>

    <div v-if="modelDefinition.crud?.create && !modelsData.find(x => x?.value)"
         class="mt-2 flex flex-row justify-end mr-2">
      <router-link :to="createRoute" class="no-underline2">
        <Button icon="pi pi-plus" :label="'Set '+model" />
      </router-link>
    </div>

    <ConfirmPopup group="delete">
      <template #message="slotProps">
        <div class="flex flex-row items-center w-full gap-4 border-b border-surface px-4 pt-1 pb-1">
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

  const props = defineProps({
    service: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    views: {
      type: Object,
      default: () => ({})
    },
  })
  const { service, model, views } = toRefs(props)

  import AutoObjectIdentification from './DefaultObjectIdentification.vue'

  const ObjectIdentification = computed(() =>
    injectComponent({
      name: 'ObjectIdentification',
      type: service.value + '_' + model.value,
      service: service.value,
      model: model.value
    }, AutoObjectIdentification)
  )

  import { useApi, usePath, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  const serviceDefinition = computed(() => {
    const serviceDefinition = api.metadata.api.value.services.find(s => s.name === service.value)
    return serviceDefinition
  })

  const modelDefinition = computed(() => {
    return serviceDefinition.value.models[model.value]
  })

  const modelsPathConfig = computed(() => {
    return {
      service: service.value,
      model: model.value,
      definition: modelDefinition.value,
    }
  })

  const modelsPathRangeConfig = computed(() => {
    return {
      service: service.value,
      model: model.value,
      //definition: modelDefinition.value,
      reverse: true,
      views: views.value.map(view => ({
        ...view,
        view: modelDefinition.value?.crud?.[view.name]
      }))
    }
  })
  const modelsPaths = computed(() => {
    const config = modelsPathRangeConfig.value    
    if(!path[config.service]) return null
    const views = config.views
    const serviceViews = serviceDefinition.value.views
    return views.map(view => serviceViews[view.view] && path[config.service][view.view]({
      ...view.identifiers,
    }))
  })

  const modelsData = await Promise.all(
    modelsPaths.value.map(path => live(path))
  )

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
      name: 'auto-form:edit',
      params: {
        serviceName: service.value,
        modelName: model.value,
        id: object.to ?? object.id
      }
    }
  }

  function viewRoute(object) {
    return {
      name: 'auto-form:view',
      params: {
        serviceName: service.value,
        modelName: model.value,
        id: object.to ?? object.id
      }
    }
  }

  const createRoute = computed(() => ({
    name: 'auto-form:create',
    params: {
      serviceName: service.value,
      modelName: model.value,
      identifiersWithNames: Object.entries(objectIdentifiers(views.value[0].identifiers)).flat()
    }
  }))

  function deleteObject(event, object) {
    confirm.require({
      group: 'delete',
      target: event.currentTarget,
      object,
      acceptClass: "p-button-danger",
      accept: async () => {
        console.log("deleteObject", object)
        console.log("objectIdentifiers", objectIdentifiers(object))
        console.log("modelDefinition", modelDefinition.value)      
        const method = api.actions[service.value][modelDefinition.value.crud.reset]
           || api.actions[service.value][modelDefinition.value.crud.delete]
        await method({
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