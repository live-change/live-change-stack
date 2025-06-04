<template>
  <div class="w-full lg:w-8/12 md:w-11/12">
    <div v-for="serviceWithModels of editableModelsByService"
         class="bg-surface-0 dark:bg-surface-900 p-4 shadow-sm rounded-border">
      <div class="text-xl mb-2">
        Service <strong>{{ serviceWithModels.name }}</strong>
      </div>
      <div v-for="model of serviceWithModels.models" class="mb-2 ml-4">
        <div class="mb-1 flex flex-row flex-wrap items-center justify-between">
          <div class="text-xl flex flex-row items-center mr-6">
            <strong>{{ model.name }}</strong>
            <span class="mx-1">model</span>
            <div v-for="relation of model.relations">
              <span class="mr-1">-</span>
              <span>{{ relation.name }}</span>
  <!--            <span v-if="relation.config.what"></span>-->
            </div>
          </div>
          <div class="mt-2 md:mt-0">
            <router-link :to="listRoute(serviceWithModels.name, model)" class="no-underline">
              <Button icon="pi pi-list" severity="primary" label="List" class="mr-2" />
            </router-link>
            <router-link :to="createRoute(serviceWithModels.name, model)" class="no-underline">
              <Button icon="pi pi-plus" severity="warning" :label="'Create new '+model.name" />
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

  import { ref, computed, onMounted, defineProps, toRefs } from 'vue'

  const props = defineProps({
    serviceName: {
      type: String,
      default: undefined
    },
  })
  const { serviceName } = toRefs(props)

  import { useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  import { getServiceModelsWithRelation, typedRelationsTypes, anyRelationsTypes } from '../logic/relations.js'

  const allRelationsTypes = typedRelationsTypes.concat(anyRelationsTypes).concat(['entity'])

  const editableModelsByService = computed(() => {
    const results = []
    for(const [currentServiceName, service] of Object.entries(api.services)) {
      if(serviceName.value && currentServiceName !== serviceName.value) continue
      const models = getServiceModelsWithRelation(service, 'autoCrud')
      if(models.length === 0) continue
      const result = {
        name: currentServiceName,
        models: models.map(model => ({
          name: model.name,
          relations: allRelationsTypes.filter(relation => model[relation]).map(relation => ({
            name: relation,
            config: model[relation]
          })),
          model
        }))
      }
      results.push(result)
    }
    return results
  })

  function createRoute(serviceName, model) {
    return {
      name: 'auto-form:create',
      params: {
        serviceName,
        modelName: model.name
      }
    }
  }

  function listRoute(serviceName, model) {
    return {
      name: 'auto-form:list',
      params: {
        serviceName,
        modelName: model.name,
      }
    }
  }

</script>

<style scoped>

</style>