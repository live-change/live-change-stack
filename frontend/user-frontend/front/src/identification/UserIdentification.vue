<template>
  <span>
    <router-link v-if="ownerType === 'user_User' && profileRouteExists"
                 :to="{ name: 'user:profile', params: { user: owner } }"
                 v-ripple
                 :class="inline ? inlineClass : blockClass">
      <Image v-if="userData?.image" :image="userData.image" class="mr-2 rounded-full inline"
             :style="imageStyle"/>
      <img v-else :src="identiconUrl" class="mr-2 rounded-full inline" :style="imageStyle" domResize />
      <span class="text-ellipsis whitespace-nowrap overflow-hidden"
            :class="[ ownerType === 'user_User' ? 'font-medium' : 'font-italic' ]">
        {{ name }}
      </span>
    </router-link>
    <span v-else-if="ownerType === 'email_Email'">
      <i class="pi pi-envelope mr-2 ml-1"
         style="font-size: 1.3rem; margin-right: 0.7rem !important; position: relative; top: 3px;" />
      <span class="text-ellipsis whitespace-nowrap overflow-hidden">
        {{ owner }}
      </span>
    </span>
    <span v-else :class="inline ? inlineClass : blockClass">
      <Image v-if="userData?.image" :image="userData.image" class="mr-2 rounded-full inline"
             :style="imageStyle"/>
      <img v-else :src="identiconUrl" class="mr-2 rounded-full inline" :style="imageStyle" domResize />
      <span class="text-ellipsis whitespace-nowrap overflow-hidden"
            :class="[ ownerType === 'user_User' ? 'font-medium' : 'font-italic' ]">
        {{ name }}
      </span>
    </span>
  </span>
</template>

<script setup>

  import { Image } from "@live-change/image-frontend"
  import { colors, animals, uniqueNamesGenerator } from "unique-names-generator"

  const props = defineProps({
    ownerType: {
      type: String,
      required: true
    },
    owner: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      default: undefined
    },
    inline: {
      type: Boolean,
      default: false
    },
    anonymous: {
      type: String,
      default: ''
    }
  })

  const inlineClass = ""
  const blockClass = "flex items-center cursor-pointer text-surface-700 dark:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-border p-ripple"
  const inlineImageSize = '1em'
  const blockImageSize = '28px'

  import { toRefs } from "@vueuse/core"
  const { data, inline, ownerType, owner } = toRefs(props)

  import { useRouter } from 'vue-router'
  const router = useRouter()
  const profileRouteExists = router.hasRoute('user:profile')

  import { usePath, live, actions } from '@live-change/vue3-ssr'

  const path = usePath()
  const userIdentificationPath = computed(() => ownerType.value && owner.value &&
    path.userIdentification.identification({
      sessionOrUserType: ownerType.value, sessionOrUser: owner.value
    }) || null
  )

  const dataPromise = data.value !== undefined ? Promise.resolve(data) :
       live(userIdentificationPath)

  const identiconUrl = computed(() => `/api/identicon/jdenticon/${ownerType.value}:${owner.value}/28.svg`)

  import { computed } from 'vue'

  const imageStyle = computed(() => inline
      ? { width: inlineImageSize, height: inlineImageSize, verticalAlign: 'middle' }
      : { width: blockImageSize, height: blockImageSize }
  )

  const [ userData ] = await Promise.all([ dataPromise ])

  const name = computed(() => userData.value?.name
    || ((userData.value?.firstName && userData.value?.lastName)
      ? userData.value?.firstName + ' ' + userData.value?.lastName
      : userData.value?.firstName)
    || props.anonymous
    || uniqueNamesGenerator({
      dictionaries: [/*["anonymous", "unnamed"],*/ colors, animals],
      separator: ' ',
      seed: ownerType.value + '_' + owner.value
    }))

</script>

<style scoped>

</style>