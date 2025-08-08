<template>
  <div>

    <div v-if="object">
      <ObjectPath :objectType="service + '_' + model" :object="object.to ?? object.id" class="mb-6" />

      <div class="bg-surface-0 dark:bg-surface-900 p-4 shadow-sm rounded-border mb-6">

        <div class="">
          Service <strong>{{ service }}</strong>
        </div>
        <div class="flex flex-row flex-wrap justify-between align-items-top">
          <div class="text-2xl mb-6">
            <strong class="mr-2">{{ model }}</strong>
            <ObjectIdentification
              :objectType="service + '_' + model"
              :object="object.to ?? object.id"
              :data="object"
              class=""
            />
          </div>
          <div class="flex flex-row flex-wrap justify-between align-items-top gap-2">
            <Button label="Access" icon="pi pi-key" class="p-button mb-6" @click="showAccessControl" />
            <router-link :to="editRoute">
              <Button label="Edit" icon="pi pi-pencil" class="p-button mb-6" />
            </router-link>
          </div>
        </div>

        <AutoView :value="object" :root-value="object" :i18n="i18n" :attributes="attributes"
                  :definition="modelDefinition" />

      </div>

      <div class="flex flex-row flex-wrap gap-2">
        <div v-if="connectedActions" 
                class="bg-surface-0 dark:bg-surface-900 p-4 shadow-sm rounded-border mb-6 flex-1 flex-grow">
          <div class="text-xl mb-3">
            Actions
          </div>
          <div class="flex flex-row flex-wrap gap-2">
            <div v-for="action of connectedActions" class="mb-0">
              <!-- <pre>{{ action }}</pre> -->
              <router-link :to="actionRoute(action)">
                <Button :label="action.label" icon="pi pi-play" class="p-button mb-0" />
              </router-link>
            </div>
          </div>
        </div>
        <div v-if="connectedPages" 
                class="bg-surface-0 dark:bg-surface-900 p-4 shadow-sm rounded-border mb-6 flex-1 flex-grow">
          <div class="text-xl mb-3">
            Pages
          </div>
          <div class="flex flex-row flex-wrap gap-2">
            <div v-for="page of connectedPages" class="mb-0">
              <!-- <pre>{{ action }}</pre> -->
              <router-link :to="pageRoute(page)">
                <Button :label="page.label" icon="pi pi-external-link" class="p-button mb-0" />
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <div v-for="preparedRelation of visibleObjectRelations" class="mb-6">
        <ModelSingle :service="preparedRelation.service" :model="preparedRelation.model"
                     :views="preparedRelation.views">
          <template #header>
            <div class="text-xl">
              <ObjectIdentification
                :objectType="service + '_' + model"
                :object="object.to ?? object.id"
                :data="object"
                class="mr-2"
              />
              <span class="mr-2 font-medium">{{ model }}'s</span>
              <span class="font-bold">{{ preparedRelation.model }}</span>:
            </div>
          </template>
        </ModelSingle>
      </div>

      <div v-for="preparedRelation of visibleRangeRelations" class="mb-6">
        <ModelList :service="preparedRelation.service" :model="preparedRelation.model"
                   :views="preparedRelation.views">
          <template #header>
            <div class="text-xl">
              <ObjectIdentification
                :objectType="service + '_' + model"
                :object="object.to ?? object.id"
                :data="object"
                class="mr-2"
              />
              <span class="mr-2 font-medium">{{ model }}'s</span>
              <span class="font-bold">{{ pluralize(preparedRelation.model) }}</span>:
            </div>
          </template>
        </ModelList>
      </div>

      <Dialog v-model:visible="accessControlDialog"
              :modal="true">
        <template #header>
          <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium">
            Access Control
          </div>
        </template>
        <AccessControl
          :objectType="objectType" :object="object.to ?? object.id"
          :availableRoles="accessControlRoles"
          :availablePublicRoles="accessControlRoles"
          :defaultInviteRoles="accessControlRoles.slice(0, 1)"
          :adminRoles="['admin', 'owner']"
        />
      </Dialog>

    </div>
    <NotFound v-else />

    <div class="bg-surface-0 dark:bg-surface-900 p-4 shadow-sm rounded-border">

<!--       <pre>visibleRangeRelations = {{ visibleRangeRelations }}</pre>
      <pre>preparedRelations = {{ preparedRelations }}</pre>

      <div v-if="backwardRelations">
        <h4>Backward relations</h4>
        <pre>{{
            backwardRelations.map(
              ({ from, relation, what }) => ({ from: from.serviceName + '_' + from.name, relation, what })
            )
        }}</pre>
      </div>
      <pre>accessControlRoles = {{ accessControlRoles }}</pre> -->
      
    <pre>id = {{ id }}</pre>

    <pre>definition = {{ modelDefinition }}</pre>

    <pre>object = {{ object }}</pre>

    </div>


  </div>
</template>

<script setup>

  import AutoView from '../view/AutoView.vue'
  import ModelList from './ModelList.vue'
  import ModelSingle from './ModelSingle.vue'

  import { NotFound } from "@live-change/url-frontend"
  import { AccessControl } from "@live-change/access-control-frontend"

  import pluralize from 'pluralize'
  import { ref, computed, onMounted, defineProps, defineEmits, toRefs } from 'vue'
  import { RangeViewer, injectComponent, InjectComponent } from "@live-change/vue3-components"

  import ObjectPath from './ObjectPath.vue'

  const props = defineProps({
    service: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    attributes: {
      type: Object,
      default: () => ({})
    },
    i18n: {
      type: String,
      default: ''
    }
  })
  const { service, model, id, attributes, i18n } = toRefs(props)

  const emit = defineEmits(['saved', 'draftSaved', 'draftDiscarded', 'saveError', 'created' ])

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

  const modelDefinition = computed(() => {
    return api.services?.[service.value]?.models?.[model.value]
  })

  const connectedActions = computed(() => {
    const srcActions = modelDefinition.value?.connectedActions
    if(!srcActions) return null
    return Object.values(srcActions).map(action => {      
      const config = {
        service: service.value,
        ...action        
      }
      const actionDefinition = api.getServiceDefinition(config.service).actions[config.name]
      if(!actionDefinition) throw new Error("Action " + config.service + "_" + config.name + " definition not found")
      const label = actionDefinition.label ?? action.label ?? actionDefinition.name 
      return {
        ...config,
        definition: actionDefinition,
        label
      }
    })
  })

  const connectedPages = computed(() => {
    const srcPages = modelDefinition.value?.connectedPages
    if(!srcPages) return null
    return Object.values(srcPages).map(page => {
      return {
        ...page,
        label: page.label ?? page.name
      }
    })
  })

  import { getForwardRelations, getBackwardRelations, anyRelationsTypes, prepareObjectRelations } 
    from '../../logic/relations.js'
  const forwardRelations = computed(() => getForwardRelations(modelDefinition.value, () => true, api))
  const backwardRelations = computed(() => getBackwardRelations(modelDefinition.value,  api))

  import viewData from '../../logic/viewData.js'

  const viewDataPromise = viewData({
    service: service.value,
    model: model.value,
    id: id.value,
    path, api
  })

  const [{ data: object, error }] = await Promise.all([
    viewDataPromise
  ])

  console.log("GOT OBJECT", object, "ERROR", error)

  const objectType = computed(() => service.value + '_' + model.value)

  const preparedRelations = computed(() => {
    if(!object.value) return []
    return prepareObjectRelations(objectType.value, object.value.to ?? object.value.id, api)
  })

  const visibleRangeRelations = computed(() => preparedRelations.value
    .filter(preparedRelation => !preparedRelation.singular)
    .map(preparedRelation => {
      const accessibleViews = preparedRelation.views.filter(view => preparedRelation.access.value[view.name])
      if(accessibleViews.length === 0) return null
      return {
        ...preparedRelation,
        views: accessibleViews
      }
    })
    .filter(x => x !== null)
  )

  const visibleObjectRelations = computed(() => preparedRelations.value.filter(preparedRelation => {
    if(!preparedRelation.singular) return false
    if(!preparedRelation.access.value.read) return false
    return true
  }))

  const accessControlConfig = computed(() => modelDefinition.value?.autoCrud?.accessControl)
  const accessControlDialog = ref(false)
  function showAccessControl() {
    accessControlDialog.value = true
  }
  const accessControlRoles = computed(() => modelDefinition.value?.accessRoles ?? [])

  const editRoute = computed(() => ({
    name: 'auto-form:edit',
    params: {
      serviceName: service.value,
      modelName: model.value,
      id: id.value
    }
  }))

  function actionRoute(action) {
    const myType = service.value + '_' + model.value
    const parameterName = action.objectParameter ?? 
      Object.entries(action.definition.properties).find(([key, value]) => value.type === myType)?.[0] ??
      Object.keys(action.definition.properties)?.[0]

    if(parameterName) {
      const parametersJson = JSON.stringify({
        [parameterName]: object.value.to ?? object.value.id
      })
      return {
        name: 'auto-form:actionParameters',
        params: {
          serviceName: action.service,
          actionName: action.name,
          parametersJson
        }
      }
    }
    return {
      name: 'auto-form:action',
      params: {
        serviceName: action.service,
        actionName: action.name
      }
    }
  }

  function pageRoute(page) {
    const modelName = model.value
    const modelProperty = modelName[0].toLowerCase() + modelName.slice(1)
    return {
      name: page.name,
      params: {
        ...page.params,
        [modelProperty]: object.value.to ?? object.value.id
      }
    }
  }
</script>

<style scoped>

</style>