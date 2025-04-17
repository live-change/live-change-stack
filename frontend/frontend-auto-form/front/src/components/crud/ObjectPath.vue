<template>
  <div>
<!--     <h1>Scope Path</h1>
    <pre>pathsPath = {{ pathsPath }}</pre>
    <pre>paths = {{ paths }}</pre>
    <pre>selectedPaths = {{ selectedPaths }}</pre>
    <pre>selectedPathWithElements = {{ selectedPathWithElements }}</pre> -->
    <div v-for="path in selectedPathsWithElements" :key="path">
      <Breadcrumb :model="path">
        <template #item="{ item }">          
          <AutoObjectIdentification :objectType="item.objectType" :object="item.object" 
            :link="item.object !== object && item.objectType !== objectType" />
        </template>
      </Breadcrumb>
    </div>
  </div>
</template>

<script setup>

  import Breadcrumb from 'primevue/breadcrumb'
  import AutoObjectIdentification from './AutoObjectIdentification.vue'
  import { ref, computed, onMounted, defineProps, toRefs, inject } from 'vue'
  const props = defineProps({
    objectType: {
      type: String,
      required: true
    },
    object: { 
      type: String,
      required: true
    }
  })
  const { objectType, object } = toRefs(props)

  import { usePath, live } from '@live-change/vue3-ssr'
  const path = usePath()

  function longest(scopePaths) {
    return scopePaths.sort((a, b) => b.intermediate.length - a.intermediate.length).at(0)
  }

  function longestByType(scopePaths) {
    const scopePathsByType = new Map()
    for(const scopePath of scopePaths) {
      const type = scopePath.scopeType
      if(!scopePathsByType.has(type)) scopePathsByType.set(type, [])
      scopePathsByType.get(type).push(scopePath)
    }
    const result = []
    for(const type of scopePathsByType.keys()) {
      result.push(longest(scopePathsByType.get(type)))
    }
    return result
  }

  function scopePathElements(path) {    
    const {objectType, object, scopeType, scope, intermediate} = path
    const root = { objectType: scopeType, object: scope, }
    const elements = [root]
    for(let i = 0; i < intermediate.length; i+=2) {
      const propertyName = intermediate[i]
      elements[elements.length - 1].toProperty = propertyName
      const objectInfo = intermediate[i+1]
      if(objectInfo) {
        const separatorPosition = objectInfo.indexOf(':')
        const objectType = JSON.parse(objectInfo.substring(0, separatorPosition))
        const object = JSON.parse(objectInfo.substring(separatorPosition + 1))
        elements.push({ objectType, object, propertyFrom: propertyName })
      } else {
        elements.push({ objectType, object, propertyFrom: propertyName })
      }
    }   
    return elements
  }

  const scopePathConfig = inject('scopePathConfig', {
    scopeType: undefined,
    scope: undefined,
    scopeSelector: longestByType,
    pathsPath: (objectType, object, config) => path.scope.objectScopePaths({
      objectType, object,
      scopeType: config.scopeType,
      scope: config.scope
    }),
    pathElements: scopePathElements
  })

  const pathsPath = computed(() => scopePathConfig.pathsPath(objectType.value, object.value, scopePathConfig))

  const [paths] = await Promise.all([
    live(pathsPath)
  ])

  const selectedPaths = computed(() => {
    return scopePathConfig.scopeSelector(paths.value)
  })

  const selectedPathsWithElements = computed(
    () => selectedPaths.value.map(scopePath => scopePathConfig.pathElements(scopePath))
  )



</script>

