<template>
  <div class="rows w-full mt-2">
    <div v-for="(row, index) in dataRows" :key="row.id"
         class="surface-0 shadow-1 w-full">
      <!--        {{ JSON.stringify(row) }}-->
      <object-editor :currentData="JSON.stringify(row)"
                     :write="props.write" :remove="props.remove"
                     :dbApi="dbApi" />
    </div>
  </div>
</template>

<script setup>

  import { path, live, actions, api, rangeBuckets, reverseRange } from '@live-change/vue3-ssr'
  import ScrollBorder from 'vue3-scroll-border'
  import ObjectEditor from "./ObjectEditor.vue"

  import { dbViewSugar } from "./dbSugar.js"

  const props = defineProps({
    dbApi: {
      type: String,
      default: 'serverDatabase'
    },
    read: {
      type: Function,
      required: true
    },
    write: {
      type: Function,
      default: null
    },
    remove: {
      type: Function,
      default: null
    }
  })

  const { dbApi, read } = props

  const [ dataRows ] = await Promise.all([
    live({
      what: [dbApi, ...JSON.parse(JSON.stringify(read({ }, dbViewSugar)))]
    })
  ])

</script>

<style scoped>

</style>