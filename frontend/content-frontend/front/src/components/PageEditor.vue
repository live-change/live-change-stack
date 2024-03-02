<template>
<!--  <ContentSettings v-if="pageData" objectType="content_Page" :object="pageId" />-->

  <ContentEditor v-if="pageData"
               objectType="content_Page" :object="pageId"
               :publishTarget="`page `+`${canonicalUrlData.domain ?? '*'}/${canonicalUrlData.path}`"
               contentType="page" purpose="page" />
  <NotFound v-if="pageData === null" />

</template>

<script setup>
  import { NotFound } from "@live-change/url-frontend";

  import ContentSettings from "./ContentSettings.vue"
  import ContentEditor from "./ContentEditor.vue"

  import { computed, watch, ref, onMounted, inject } from 'vue'
  import { toRefs } from "@vueuse/core"

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const props = defineProps({
    pageId: {
      type: String,
      required: true
    },
    class: {},
    style: {}
  })
  const { pageId, class: clazz, style } = toRefs(props)

  import { useApi, path, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const p = path()

  const livePagePath = computed(
    () =>  p.content.page({ page: pageId.value })
  )
  const liveCanonicalUrlPath = computed(
    () =>  p.url.targetOwnedCanonical({ targetType: 'content_Page', target: pageId.value })
  )
  const livePublicAccessPath = computed(
    () =>  p.accessControl.objectOwnedPublicAccess({ objectType: 'content_Page', object: pageId.value })
  )
  const liveMetadataPath = computed(
    () =>  p.content.objectOwnedMetadata({ objectType: 'content_Page', object: pageId.value })
  )

  const [pageData, canonicalUrlData, publicAccessData, metadata] = await Promise.all([
    live(livePagePath),
    live(liveCanonicalUrlPath),
    live(livePublicAccessPath),
    live(liveMetadataPath)
  ]).catch(e => [null, null, null, null])


  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  console.log("WAITING!")
  await sleep(5000)

</script>

<style scoped>

</style>
