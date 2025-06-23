<template>
  <div>
<!--     <h1>Scope Path</h1>
    <pre>pathsPath = {{ pathsPath }}</pre>
    <pre>paths = {{ paths }}</pre>
    <pre>selectedPaths = {{ selectedPaths }}</pre>
    <pre>selectedPathWithElements = {{ selectedPathWithElements }}</pre> -->
    <div v-for="path in selectedPathsWithElements" :key="path">
      <Breadcrumb :model="more ? [...path, 'dupa'] : path"
       :pt="{      
        list: {
          class: 'text-sm flex flex-row flex-wrap gap-2 first:negative-margin-left pl-[1.5rem]'
        },
        item: {
          class: 'first:ml-[-1.5rem]'
        }
       }">
        <template #item="{ item }">          
          <div>
            <slot v-if="typeof item === 'string'" name="more">
              more...            
            </slot>
            <AutoObjectIdentification v-else :objectType="item.objectType" :object="item.object" 
              :link="more || (item.object !== object && item.objectType !== objectType)" />
          </div>
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
    },
    more: {
      type: Boolean,
      default: false
    }
  })
  const { objectType, object, more } = toRefs(props)

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

  const objectPathConfig = inject(`objectPathConfig:${objectType.value}`,
    inject('objectPathConfig', {
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
  )

  console.log('objectPathConfig', objectPathConfig.value)


  const pathsPath = computed(() => objectPathConfig.pathsPath(objectType.value, object.value, objectPathConfig))

  const [paths] = await Promise.all([
    live(pathsPath)
  ])

  const selectedPaths = computed(() => {
    return objectPathConfig.scopeSelector(paths.value)
  })

  const selectedPathsWithElements = computed(
    () => selectedPaths.value.map(scopePath => objectPathConfig.pathElements(scopePath))
  )



</script>

