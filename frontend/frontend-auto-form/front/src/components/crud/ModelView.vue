<template>
  <div>

<!--    <h4>identifiers</h4>
    <pre>{{ identifiers }}</pre>

    <h4>definition</h4>
    <pre>{{ modelDefinition }}</pre>

    <h4>object</h4>
    <pre>{{ object }}</pre>-->

    <div v-if="object">
      <div class="surface-card p-3 shadow-1 border-round mb-4">

        <div class="">
          Service <strong>{{ service }}</strong>
        </div>
        <div class="flex flex-row flex-wrap justify-content-between align-items-top">
          <div class="text-2xl mb-4">
            <strong>{{ model }}</strong>
            <ObjectIdentification
              :objectType="service + '_' + model"
              :object="object.to ?? object.id"
              :data="object"
              class="ml-2"
            />
          </div>
          <Button label="Access" icon="pi pi-key" class="p-button mb-4" @click="showAccessControl" />
        </div>

        <AutoView :value="object" :root-value="object" :i18n="i18n" :attributes="attributes"
                  :definition="modelDefinition" />

      </div>

      <div v-for="preparedRelation of visibleObjectRelations" class="mb-4">
        <ModelSingle :service="preparedRelation.service" :model="preparedRelation.model"
                   :identifiers="preparedRelation.identifiers">
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

      <div v-for="preparedRelation of visibleRangeRelations" class="mb-4">
        <ModelList :service="preparedRelation.service" :model="preparedRelation.model"
                   :identifiers="preparedRelation.identifiers" :view="preparedRelation.view">
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
          <div class="text-900 text-3xl font-medium">
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

    <div class="surface-card p-3 shadow-1 border-round">

      <pre>{{ preparedRelations }}</pre>

      <div v-if="backwardRelations">
        <h4>Backward relations</h4>
        <pre>{{
            backwardRelations.map(
              ({ from, relation, what }) => ({ from: from.serviceName + '_' + from.name, relation, what })
            )
        }}</pre>
      </div>

    </div>

    <pre>{{ accessControlRoles }}</pre>

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
    attributes: {
      type: Object,
      default: () => ({})
    },
    i18n: {
      type: String,
      default: ''
    }
  })
  const { service, model, identifiers, attributes, i18n } = toRefs(props)

  const emit = defineEmits(['saved', 'draftSaved', 'draftDiscarded', 'saveError', 'created' ])

  import AutoObjectIdentification from './AutoObjectIdentification.vue'
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

  import { getForwardRelations, getBackwardRelations, anyRelationsTypes, prepareObjectRelations } from '../../logic/relations.js'
  const forwardRelations = computed(() => getForwardRelations(modelDefinition.value, () => true, api))
  const backwardRelations = computed(() => getBackwardRelations(modelDefinition.value,  api))

  import viewData from '../../logic/viewData.js'

  const viewDataPromise = viewData({
    service: service.value,
    model: model.value,
    identifiers: identifiers.value,
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

  const visibleRangeRelations = computed(() => preparedRelations.value.filter(preparedRelation => {
    if(preparedRelation.view && preparedRelation.access.value[preparedRelation.view]) return true
    if(preparedRelation.access.value.range) return true
    return false
  }))

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

</script>

<style scoped>

</style>