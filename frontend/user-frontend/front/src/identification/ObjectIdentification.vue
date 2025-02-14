<template>
  <UserIdentification v-if="objectType === 'session_Session' || objectType === 'user_User'"
                      :ownerType="objectType" :owner="object"
                      :data="data" :inline="inline" />
  <span v-else><strong>{{ objectType }}</strong>: {{ object }}</span>
</template>

<script setup>

  import { UserIdentification } from '../../../index.js'

  const props = defineProps({
    objectType: {
      type: String,
      required: true
    },
    object: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      default: null
    },
    inline: {
      type: Boolean,
      default: false
    }
  })

  import { toRefs } from "@vueuse/core"
  const { objectType, object, data, inline } = toRefs(props)

</script>

<style scoped>

</style>