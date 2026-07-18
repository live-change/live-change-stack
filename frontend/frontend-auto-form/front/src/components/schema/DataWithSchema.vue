<template>
<pre>
#### {{ prefix }} Data Schema

{{ JSON.stringify(schema, null, 2) }}


#### {{ prefix }} Data:

{{ JSON.stringify(clearData, null, 2) }}
</pre>
</template>

<script setup>

  import { computed, toRefs, defineProps, getCurrentInstance } from 'vue'

  const props = defineProps({
    data: {
      type: Object,
      required: true,
    },
    prefix: {
      type: String,
      default: ''
    }
  })
  const { data } = toRefs(props)

  import { getSchemaFromData, cleanData } from "../../logic/schema.js"

  const appContext = getCurrentInstance().appContext

  const schema = computed(() => data.value ? getSchemaFromData(data.value, appContext) : 'error - no data')
  const clearData = computed(() => cleanData(data.value))

</script>

<style scoped>

</style>