<template>
  <div>
    <div v-for="(bucket, bucketIndex) in urlsBuckets.buckets" :key="bucket.id">
      <div v-for="(url, index) in bucket.data"
           :key="url.id"
           :ref="el => bucket.domElements[index] = el"
           class="mb-1">
<!--        <pre>{{ JSON.stringify(url, null, '  ') }}</pre>-->
        <div class="flex flex-row align-items-center">
          <div class="flex-shrink-0 mr-2">
            <i class="pi pi-globe text-2xl" />
          </div>
          <div class="flex flex-row flex-grow-1 flex-wrap">
            <div class="py-1 flex-grow-0">
              <router-link :to="urlLink(url)">{{ urlLink(url) }}</router-link>
            </div>
            <div v-if="url.type == 'redirect'" class="flex flex-row align-items-center">
              <div class="flex-shrink-0 mr-2 ml-5">
                <i class="pi pi-arrow-right text-2xl" />
              </div>
              <div class="py-1 flex-grow-0">
                <router-link :to="urlLink(url.canonical)">{{ urlLink(url.canonical) }}</router-link>
              </div>
            </div>
          </div>
          <div class="ml-2">
            <router-link v-if="editButtons" :to="editorRoute(targetType, url.target)" class="no-underline">
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-warning mb-1" />
            </router-link>
          </div>
        </div>
      </div>
    </div>
    <scroll-border placement="bottom"
                   :load="urlsBuckets.loadBottom"
                   :canLoad="urlsBuckets.canLoadBottom" />
  </div>
</template>

<script setup>
  import ScrollBorder from 'vue3-scroll-border'
  import Button from "primevue/button"

  const props = defineProps({
    targetType: {
      type: String,
      required: true
    },
    urlPrefix: {
      type: String,
      default: '/'
    },
    domain: {
      type: String,
      default: null
    },
    editButtons: {
      type: Boolean,
      default: false
    },
    editorRoute: {
      type: Function,
      default: (objectType, object) => {
        const [service, type] = objectType.split('_')
        const prop = type[0].toLowerCase()+type.slice(1)
        return { name: `${service}:${prop}Editor`, params: { [prop+'Id']: object }}
      }
    }
  })

  import { toRefs } from "@vueuse/core"
  const { targetType, urlPrefix, domain, editButtons, editorRoute } = toRefs(props)

  import { computed } from 'vue'
  import { path, live, actions, api, rangeBuckets, reverseRange } from '@live-change/vue3-ssr'
  import {useHost} from "@live-change/frontend-base";
  const urlApi = actions().url

  const urlPathBaseFunction = computed(() => domain.value
    ? (range, p) => p.url.urlsByTargetTypeAndDomain({targetType: targetType.value, domain: domain.value, ...range})
    : (range, p) => {
      console.log("P", p, "RANGE", range)
      return p.url.urlsByTargetType({targetType: targetType.value, ...range})
    }
  )

  const urlPathFunction = computed(() => (range, p) => urlPathBaseFunction.value(range, p)
    .with(url => url.type.$switch({
      'canonical': null,
      'redirect': p.url.canonical({ targetType: targetType.value, target: url.target })
    }).$bind('canonical'))
    //.with(url => p.accessControl.myAccessTo({ objectType: targetType, object: url.target }).bind('access'))
  )

  /*const [ urls ] = await Promise.all([
    live(computed(() => urlPathFunction.value({ limit: 1000 })))
  ])*/

  const [ urlsBuckets ] = await Promise.all([
    rangeBuckets(
      (range, p) => urlPathFunction.value(range, p),
      { bucketSize: 20 }
    )
  ])

  const urlDomain = useHost()

  function urlLink(url) {
    let prefix = urlPrefix.value
    if(url.domain && url.domain != urlDomain) {
      //const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:'
      const port = typeof window !== 'undefined' ? window.location.port : ''
      prefix = '//' + url.domain + (port ? ':' + port : '') + urlPrefix.value
    }
    return prefix + url.path
  }

</script>

<style scoped>

</style>
