<template>
  <div class="rows w-full mt-2">
    <scroll-border placement="top"
                   :load="dataBuckets.loadTop"
                   :canLoad="dataBuckets.canLoadTop" />
    <div v-for="(bucket, bucketIndex) in dataBuckets.buckets" :key="bucket.id"
         class="w-full">
      <div v-for="(row, index) in bucket.data" :key="row.id" :ref="el => bucket.domElements[index] = el"
           class="bg-surface-0 dark:bg-surface-900 shadow-sm w-full">
<!--        {{ JSON.stringify(row) }}-->
        <object-editor :currentData="JSON.stringify(row)"
                       :write="props.write" :remove="props.remove"
                       :dbApi="dbApi" />
      </div>
    </div>
    <scroll-border placement="bottom"
                   :load="dataBuckets.loadBottom"
                   :canLoad="dataBuckets.canLoadBottom" />
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

  const [ dataBuckets ] = await Promise.all([
    rangeBuckets((range, p) => [dbApi, ...JSON.parse(JSON.stringify(read({ range }, dbViewSugar)))])
  ])

</script>

<style scoped>

</style>