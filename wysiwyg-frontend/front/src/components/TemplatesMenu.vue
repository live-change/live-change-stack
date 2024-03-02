<template>
  <div>
    <div class="px-2 pb-2">
      <span class="p-input-icon-left w-full flex">
          <i class="pi pi-search flex-shrink-0" />
          <InputText type="text" v-model="searchQuery" placeholder="Search" class="flex-grow-1" v-focus />
      </span>
    </div>
    <div class="overflow-auto" style="max-height: 75vh">
  <!--    <div v-for="i in [1,2,3,4,5,6,7,8,9,10]">-->
        <div v-for="(template, index) in searchResults" :key="template.name"
             class="flex flex-wrap relative cursor-pointer hover:surface-100"
             @click="() => emit('selected', template)" >
          <div class="w-3 ml-2 mr-2 my-1" style="aspect-ratio: 1/1">
            <div class="pointer-events-none w-6 absolute p-1"
                 style="aspect-ratio: 1/1; transform: scale(0.5); transform-origin: 0 0;">
              <ContentView :config="config"
                           :content="{ type: 'doc', content: template.content({ preview: true }) }"
                           style="aspect-ratio: 1/1" />
            </div>
          </div>
          <div class="ml-2">
            <h3>{{ template.name[0].toUpperCase() + template.name.slice(1) }}</h3>
            <p>{{ template.description }}</p>
          </div>
        </div>
  <!--    </div>-->
    </div>
  </div>
</template>

<script setup>
  import InputText from "primevue/inputtext"

  import ContentView from "./ContentView.js"
  import templates from "../tiptap/templates.js"

  import { ref, computed } from 'vue'

  const props = defineProps({
    config: {
      type: Object,
      required: true
    }
  })

  const { config } = props

  const emit = defineEmits(['selected'])

  const searchQuery = ref('')

  const searchResults = computed(() => {
    const query = searchQuery.value.toLowerCase()
    const byName = templates.filter(({ name }) => {
      return name.toLowerCase().includes(query)
    })
    const byDescription = templates.filter(({ description }) => {
      return (description || '').toLowerCase().includes(query)
    }).filter(({ name }) => !byName.find(found => name == found.name))
    return [...byName, ...byDescription]
  })

</script>

<style scoped>

</style>
