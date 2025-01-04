<template>
  <div>

<!--    <h4>identifiers</h4>
    <pre>{{ identifiers }}</pre>

    <h4>definition</h4>
    <pre>{{ modelDefinition }}</pre>

    <h4>object</h4>
    <pre>{{ object }}</pre>-->

    <div class="">
      Service <strong>{{ service }}</strong>
    </div>
    <div class="text-2xl mb-4">
      <strong>{{ model }}</strong>
      <ObjectIdentification
        :objectType="service + '_' + model"
        :object="object.to ?? object.id"
        :data="object"
        class="ml-2"
      />
    </div>

    <AutoView :value="object" :root-value="object" :i18n="i18n" :attributes="attributes"
              :definition="modelDefinition" />

  </div>
</template>

<script setup>

  import AutoView from '../view/AutoView.vue'

  import { ref, computed, onMounted, defineProps, defineEmits, toRefs } from 'vue'
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
    identifiers: {
      type: Object,
      default: []
    },
    draft: {
      type: Boolean,
      default: false
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
  const { service, model, identifiers, draft, attributes, i18n } = toRefs(props)

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

  import viewData from '../../logic/viewData.js'

  const viewDataPromise = viewData({
    service: service.value,
    model: model.value,
    identifiers: identifiers.value,
    path, api
  })

  const [object] = await Promise.all([
    viewDataPromise
  ])

</script>

<style scoped>

</style>