<template>
  <slot v-if="url && accessible" :url="url" :target="url.target" :class="clazz" :style="style">
    <div class="w-full bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <h2>Url resolved:</h2>
      <pre>{{ JSON.stringify(url, null, "  ") }}</pre>
    </div>
  </slot>
  <slot v-else-if="url" name="notAuthorized" :path="urlPath" :class="clazz" :style="style"
        :target="url.target" :access="url.access">
    <NotAuthorized />
  </slot>
  <slot v-else name="notFound" :path="urlPath" :class="clazz" :style="style">
    <NotFound />
  </slot>
</template>

<script setup>

  import Button from "primevue/button"

  import NotFound from "./NotFound.vue"
  import NotAuthorized from "./NotAuthorized.vue"

  import { computed, watch, ref, onMounted } from 'vue'
  import { toRefs } from "@vueuse/core"
  import { useHost } from "@live-change/frontend-base"

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const props = defineProps({
    path: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      default: 'content_Page'
    },
    requiredRoles: {
      type: Array,
      default: () => ['reader']
    },
    fetchMore: {
      type: Array,
      default: () => []
    },
    class: {},
    style: {}
  })
  const { path: urlPath, targetType, fetchMore, class: clazz, style, requiredRoles } = toRefs(props)

  const urlDomain = useHost()

  import { path, live } from '@live-change/vue3-ssr'
  import { useRouter, useRoute } from 'vue-router'
  const router = useRouter()
  const route = useRoute()

  const p = path()

  const liveUrlPath = (targetType, domain, urlPath, more) => {
    let fetchPath = p.url.urlsByTargetAndPath({ targetType, domain, path: urlPath })
      //.with(url => p.url.targetOwnedCanonical({ targetType, target: url.target }).bind('canonical'))
      .with(url => url.type.$switch({
        'canonical': null,
        'redirect': p.url.canonical({ targetType, target: url.target })
      }).$bind('canonical'))
      .with(url => p.accessControl.myAccessTo({ objectType: targetType, object: url.target }).bind('access'))
    for (let fetch of more) {
      fetchPath = fetchPath.with(url => fetch(url))
    }
    return fetchPath
  }

  const livePathWithDomain = computed(
    () => liveUrlPath(targetType.value, urlDomain, urlPath.value, fetchMore.value)
  )
  const livePathWithoutDomain = computed(
    () => liveUrlPath(targetType.value, '', urlPath.value, fetchMore.value)
  )

  const [domainUrls, globalUrls] = await Promise.all([
    live(livePathWithDomain),
    live(livePathWithoutDomain)
  ])
  console.log("OK!", domainUrls.value, globalUrls.value)
  const url = computed(() => {
    if(domainUrls.value.length > 0) return domainUrls.value[0]
    if(globalUrls.value.length > 0) return globalUrls.value[0]
    return null
  })
  console.log("RESOLVED", url.value)
  const accessible = computed(() => {
    if(!(requiredRoles?.value?.length)) return true
    if(!url.value) return undefined
    const clientRoles = url.value.access?.roles ?? []
    for(const requiredRolesOption of requiredRoles.value) {
      if((Array.isArray(requiredRolesOption) ? requiredRolesOption : [requiredRolesOption])
        .every(role => clientRoles.includes(role))
      ) return true
    }
  })

  if(typeof window != 'undefined') {
    watch(() => url && isMounted.value, async () => {
      if (url.value) {
        if (url.value.type == 'redirect') {
          const canonical = url.value.canonical
          const next = {
            name: route.name,
            params: {
              path: canonical.path,
            },
            hash: route.hash,
            query: route.query
          }
          if (canonical.domain && url.value.canonical.domain != urlDomain) {
            const href = router.resolve(next).href
            window.location.href = `${document.location.protocol}//${canonical.domain}${href}`
          } else {
            router.push(next)
          }
        }
      }
    })
  }

</script>

<style scoped>

</style>
