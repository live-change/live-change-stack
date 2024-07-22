<template>
  <Dialog header="Permissions" v-model:visible="model.visible" modal>
    <template #header>
      <div class="flex flex-row align-items-center">
        <i class="pi pi-unlock mr-2" />
        <h3>{{ title }}</h3>
      </div>
    </template>
    <template #default>
      <slot name="introduction" />
      <div class="mt-2">
        <div v-for="permission in Object.entries(model.permissions)" class="flex flex-row align-items-center mb-2">
          <i :class="permissionIcons[permission[0]]" />
          <div class="ml-2">{{ permission[0] }}: </div>
          <div v-if="permission[1] === 'granted'" class="ml-1 font-semibold text-green-400">
            {{ permission[1] }}
          </div>
          <div v-else-if="permission[1] === 'denied'" class="ml-1 font-semibold text-red-400">
            {{ permission[1] }}
          </div>
          <div v-else class="ml-1 font-semibold">{{ permission[1] }}</div>
        </div>
      </div>
    </template>
    <template #footer>
      <slot name="buttons" :permissions="model.permissions" />
    </template>
<!--

    <div class="permissions-state">
      <div class="permission-state card" v-for="permissionState in permissionsState">
        <div class="permission-state-icon">
          <img :src="permissionIcons[permissionState.name][+(permissionState.state!=='denied')]">
        </div>
        <div class="permission-description">
          <p class="permission-name">{{ i18n.permissions[permissionState.name] }}</p>
          <p>{{ i18n.state }} <span class="permission-state-name">{{ i18n.states[permissionState.state] }}</span></p>
        </div>
      </div>
    </div>
    <div class="buttons permissions-buttons">
      <button v-for="button in buttons" class="button" type="button"
              :disabled="button.hasOwnProperty('needPermissions')
              ? (button.needPermissions && !isOk) || (!button.needPermissions && isOk)
              : false"
              @click="() => { $emit(button.event); $emit('close') }">
        <span>{{ button.name }}</span>
      </button>
    </div>
-->

  </Dialog>
</template>

<script setup>
  const permissionIcons = {
    camera: 'pi pi-camera',
    microphone: 'pi pi-microphone'
  }

  import { defineProps, defineModel, defineEmits, toRefs, ref, computed, watch } from 'vue'
  import { useInterval } from '@vueuse/core'

  const props = defineProps({
    title: {
      type: String
    },
    introduction: {
      type: String
    },
    buttons: {
      type: Array
    },
    requiredPermissions: {
      type: Array
    },
    autoClose: {
      type: Boolean
    }
  })
  const { title, closeable, introduction, buttons, requiredPermissions, autoClose } = toRefs(props)

  const model = defineModel({
    required: true,
    type: Object,
    properties: {
      visible: {
        type: Boolean
      },
      permissions: {
        type: Object
      }
    }
  })

  const emit = defineEmits(['ok'])

  watch(() => JSON.stringify(requiredPermissions.value), async value => {
    if(typeof window === 'undefined') return
    console.log("requiredPermissions", value)

    for(const requiredPermission of JSON.parse(value)) {
      console.log("check permission", requiredPermission)
      const permissionState = await navigator.permissions.query(requiredPermission)
      const state = permissionState ? permissionState.state : "unknown"
      model.value = {
        ...model.value,
        permissions: {
          ...model.value.permissions,
          [requiredPermission.name]: state
        }
      }
      if(permissionState) {
        permissionState.onchange = () => {
          model.value = {
            ...model.value,
            permissions: {
              ...model.value.permissions,
              [requiredPermission.name]: permissionState.state
            }
          }
        }
      }
    }
  }, { immediate: true })

  //useInterval(updatePermissionsState, 300)
  const isOk = computed(() => {
    if(!model.value.permissions) return false
    return Object.values(model.value.permissions).every(state => state !== 'denied')
  })

  watch(isOk, ok => {
    if(ok && autoClose) {
      model.value = {
        ...model.value,
        visible: false
      }
      emit('ok', model.value.permissions)
    }
  })

</script>

<style scoped>

</style>