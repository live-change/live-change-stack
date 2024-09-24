<template>
  <span>
    <router-link v-if="ownerType === 'user_User' && profileRouteExists"
                 :to="{ name: 'user:profile', params: { user: owner } }"
                 v-ripple
                 :class="inline ? inlineClass : blockClass">
      <Image v-if="userData?.image" :image="userData.image" class="mr-2 border-circle"
             :style="imageStyle"/>
      <img v-else :src="identiconUrl" class="mr-2 border-circle" :style="imageStyle" domResize />
      <span class="text-overflow-ellipsis white-space-nowrap overflow-hidden"
            :class="[ ownerType === 'user_User' ? 'font-medium' : 'font-italic' ]">
        {{ name }}
      </span>
    </router-link>
    <span v-else-if="ownerType === 'email_Email'">
      <i class="pi pi-envelope mr-2 ml-1"
         style="font-size: 1.3rem; margin-right: 0.7rem !important; position: relative; top: 3px;" />
      <span class="text-overflow-ellipsis white-space-nowrap overflow-hidden">
        {{ owner }}
      </span>
    </span>
    <span v-else :class="inline ? inlineClass : blockClass">
      <Image v-if="userData?.image" :image="userData.image" class="mr-2 border-circle"
             :style="imageStyle"/>
      <img v-else :src="identiconUrl" class="mr-2 border-circle" :style="imageStyle" domResize />
      <span class="text-overflow-ellipsis white-space-nowrap overflow-hidden"
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
  const blockClass = "flex align-items-center cursor-pointer text-700 hover:surface-100 border-round p-ripple"
  const inlineImageSize = '1em'
  const blockImageSize = '28px'

  import { toRefs } from "@vueuse/core"
  const { data, inline } = toRefs(props)
  const { ownerType, owner } = props

  import { useRouter } from 'vue-router'
  const router = useRouter()
  const profileRouteExists = router.hasRoute('user:profile')

  import { usePath, live, actions } from '@live-change/vue3-ssr'

  const path = usePath()
  const userIdentificationPath = path.userIdentification.sessionOrUserOwnedIdentification({
    sessionOrUserType: ownerType, sessionOrUser: owner
  })

  const dataPromise = data.value !== undefined ? Promise.resolve(data) :
       live(userIdentificationPath)

  const identiconUrl = `/api/identicon/jdenticon/${ownerType}:${owner}/28.svg`

  import { computed } from 'vue'

  const imageStyle = computed(() => inline
      ? { width: inlineImageSize, height: inlineImageSize }
      : { width: blockImageSize, height: blockImageSize }
  )

  const [ userData ] = await Promise.all([ dataPromise ])

  const nameGeneratorConfig = {
    dictionaries: [/*["anonymous", "unnamed"],*/ colors, animals],
    separator: ' ',
    seed: ownerType + '_' + owner
  }

  const name = computed(() => userData.value?.name
    || ((userData.value?.firstName && userData.value?.lastName)
      ? userData.value?.firstName + ' ' + userData.value?.lastName
      : userData.value?.firstName)
    || props.anonymous
    || uniqueNamesGenerator(nameGeneratorConfig))

</script>

<style scoped>

</style>