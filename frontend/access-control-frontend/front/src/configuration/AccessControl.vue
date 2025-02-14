<template>
  <div>
    <div v-if="myRoles.length > 0">

      <div class="text-center">
        <Button label="Invite with email" icon="pi pi-envelope" class="p-button mb-6"
                @click="inviteDialog = true" :disabled="!canInvite"  />
      </div>

      <InviteDialog v-if="isMounted"
                    :objectType="objectType" :object="object"
                    v-model:visible="inviteDialog"
                    :multiRole="multiRole"
                    :availableRoles="defaultInviteRoles" />

      <AccessRequests :objectType="objectType" :object="object" :multiRole="multiRole"
                      :availableRoles="availableRoles" :disabled="!isAdmin" />

      <AccessInvitations :objectType="objectType" :object="object" :multiRole="multiRole"
                         :availableRoles="availableRoles" :disabled="!isAdmin" />

      <AccessList :objectType="objectType" :object="object" :multiRole="multiRole"
                  :availableRoles="availableRoles"
                  :disabled="!isAdmin" />

      <PublicAccess :objectType="objectType" :object="object" :multiRole="multiRole"
                    :availableSessionRoles="availablePublicSessionRoles ?? availablePublicRoles ?? availableRoles"
                    :availableUserRoles="availablePublicUserRoles ?? availablePublicRoles ?? availableRoles"
                    :availableRequestedRoles="availableRequestedRoles ?? availableRoles"
                    :sessionRolesVisible="sessionRolesVisible"
                    :userRolesVisible="userRolesVisible"
                    :requestedRolesVisible="requestedRolesVisible"
                    :disabled="!isAdmin"
      />
    </div>
    <InsufficientAccess v-else />

  </div>
</template>

<script setup>
  import Button from "primevue/button"

  import InviteDialog from "../invite/InviteDialog.vue"
  import AccessRequests from "./AccessRequests.vue"
  import AccessInvitations from "./AccessInvitations.vue"
  import AccessList from "./AccessList.vue"
  import PublicAccess from "./PublicAccess.vue"
  import InsufficientAccess from "../components/InsufficientAccess.vue"

  const {
    object, objectType, paths,
    availableRoles, availablePublicSessionRoles, availablePublicUserRoles, availableRequestedRoles,
    defaultInviteRoles,
    multiRole,
    sessionRolesVisible, userRolesVisible, requestedRolesVisible, adminRoles
  } = defineProps({
    object: {
      type: String,
      required: true
    },
    objectType: {
      type: String,
      required: true
    },
    paths: {
      type: Object,
      default: () => ({
        session_Session: (p, { session }) => p.userIdentification_Info({ session }),
        user_User: (p, { user }) => p.userIdentification_Info({ user })
      })
    },
    availableRoles: {
      type: Array,
      default: () => ['admin', 'owner', 'moderator', 'writer', 'reader']
    },
    availablePublicRoles: {
      type: Array,
      default: () => ['writer', 'reader']
    },
    availablePublicSessionRoles: {
      type: Array
    },
    availablePublicUserRoles: {
      type: Array
    },
    availableRequestedRoles: {
      type: Array
    },
    defaultInviteRoles: {
      type: Array,
      default: () => ['reader']
    },
    multiRole: {
      type: Boolean,
      default: false
    },
    sessionRolesVisible: {
      type: Boolean,
      default: true
    },
    userRolesVisible: {
      type: Boolean,
      default: true
    },
    requestedRolesVisible: {
      type: Boolean,
      default: true
    },
    adminRoles: {
      type: Array,
      default: () => ['admin', 'owner']
    }
  })

  import { computed, watch, ref, onMounted } from 'vue'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const inviteDialog = ref(false)

  import { path, live } from "@live-change/vue3-ssr"

  const p = path()
  const accessLivePath = computed( () =>
    p.accessControl.myAccessTo({ objectType, object })
  )

  const [ access ] = await Promise.all([
    live(accessLivePath)
  ])

  const myRoles = computed(() => access.value ? access.value.roles : [])

  const isAdmin = computed(() => myRoles.value.find(
    role => adminRoles.includes(role)
  ))
  const canInvite = computed(() => myRoles.value.length > 0)

</script>
