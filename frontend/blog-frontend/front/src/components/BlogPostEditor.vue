<template>
  <ContentSettings v-if="objectData" :objectType="objectType" :object="object" />

  <ContentEditor v-if="objectData"
                 :objectType="objectType" :object="object"
                 :publishTarget="`page `+`${canonicalUrlData.domain ?? '*'}/${canonicalUrlData.path}`"
                 contentType="page" purpose="blog-post" />
  <NotFound v-if="objectData === null" />
</template>

<script setup>

  import { NotFound } from "@live-change/url-frontend";

  import { ContentSettings, ContentEditor } from "@live-change/content-frontend"

  import { computed, watch, ref, onMounted, inject } from 'vue'
  import { toRefs } from "@vueuse/core"

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const props = defineProps({
    postId: {
      type: String,
      required: true
    },
    class: {},
    style: {}
  })
  const { postId, class: clazz, style } = toRefs(props)

  const objectType = "blog_Post"
  const object = postId

  import { useApi, path, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const p = path()

  const livePagePath = computed(
    () =>  p.blog.post({ post: object.value })
  )
  const liveCanonicalUrlPath = computed(
    () =>  p.url.canonical({ targetType: objectType, target: object.value })
  )
  const livePublicAccessPath = computed(
    () =>  p.accessControl.publicAccess({ objectType, object: object.value })
  )
  const liveMetadataPath = computed(
    () =>  p.content.metadata({ objectType, object: object.value })
  )

  const [objectData, canonicalUrlData, publicAccessData, metadata] = await Promise.all([
    live(livePagePath),
    live(liveCanonicalUrlPath),
    live(livePublicAccessPath),
    live(liveMetadataPath)
  ]).catch(e => [null, null, null, null])

</script>

<style scoped>

</style>
