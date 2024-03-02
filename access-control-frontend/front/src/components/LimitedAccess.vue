<template>
  <slot v-if="!hidden && !authorized" name="blocked" :authorized="authorized" :roles="accessRoles" :accesses="accesses">
    <InsufficientAccess />
  </slot>
  <BlockUI v-if="!hidden && !(contentHidden && !authorized)" :blocked="!authorized">
    <slot :authorized="authorized" :roles="accessRoles" :accesses="accesses"></slot>
  </BlockUI>
  <slot v-if="authorized && hidden" :roles="accessRoles" :accesses="accesses"></slot>
  <slot v-if="!authorized && hidden" name="alternative" :roles="accessRoles" :accesses="accesses"></slot>
</template>

<script setup>

  import BlockUI from 'primevue/blockui'

  import InsufficientAccess from "./InsufficientAccess.vue"

  const props = defineProps({
    objectType: {
      type: String,
      default: null
    },
    object: {
      type: String,
      default: null
    },
    objects: {
      type: Array,
      default: () => []
    },
    requiredRoles: {
      type: Array,
      default: () => []
    },
    hidden: {
      type: Boolean,
      default: false
    },
    contentHidden: {
      type: Boolean,
      default: false
    }
  })

  import { toRefs } from '@vueuse/core'
  import { computed } from 'vue'
  import { live, path } from '@live-change/vue3-ssr'

  const { objectType, object, objects, requiredRoles } = toRefs(props)

  const allObjects = computed(() =>
    ((objectType.value && object.value) ? [{ objectType: objectType.value, object: object.value }] : [])
      .concat(objects.value || [])
  )

  const p = path()
  const accessesLivePath = computed( () =>
    p.accessControl.myAccessesTo({ objects: allObjects.value })
  )

  const [ accesses ] = await Promise.all([
    live(accessesLivePath)
  ])

  const accessRoles = computed(() => {
    const accessesList = accesses.value.slice()
    const firstAccess = accessesList.shift()
    let roles = firstAccess.roles
    for(const access of accessesList) {
      roles = roles.filter(role => access.roles.includes(role))
    }
    return roles
  })

  const authorized = computed(() => {
    const clientRoles = accessRoles.value
    if(requiredRoles.value.length == 0) return true
    for(const requiredRolesOption of requiredRoles.value) {
      if((Array.isArray(requiredRolesOption) ? requiredRolesOption : [requiredRolesOption])
        .every(role => clientRoles.includes(role))
      ) return true
    }
    return false
  })

</script>

<style scoped>

</style>
