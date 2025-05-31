<template>
<pre>{{ schema }}</pre>
</template>

<script setup>

  import { schemaFromDefinition } from "../../logic/schema.js"
  import { defineProps, toRefs, computed, getCurrentInstance } from "vue"

  const props = defineProps({
    definition: {
      type: Object,
      required: true,
    }
  })

  const { definition } = toRefs(props)

  const appContext = getCurrentInstance().appContext

  const schema = computed(() => schemaFromDefinition(definition.value, undefined, undefined, appContext))

</script>