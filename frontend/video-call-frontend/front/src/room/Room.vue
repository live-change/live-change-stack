<template>
  <LimitedAccess v-slot="{ authorized }" objectType="videoCall_Room" :object="room" :requiredRoles="requiredRoles">
    <div v-if="!joined" class="surface-card shadow-1 border-round p-3 flex flex-row flex-wrap align-items-center">
      <div class="w-30rem m-1" style="max-width: 80vw">
        <DeviceSelect v-model="selectedDevices" />
      </div>
      <div class="m-3 text-center">
        <h3>Select your media devices, and join.</h3>
        <Button @click="join" icon="pi pi-check" label="Join" />
      </div>
    </div>
    <template v-else>
      <p>JOINED</p>
    </template>
  </LimitedAccess>
</template>

<script setup>
  import { LimitedAccess } from "@live-change/access-control-frontend"
  import { DeviceSelect } from '@live-change/peer-connection-frontend'

  import { defineProps, toRefs, ref, computed } from 'vue'

  const props = defineProps({
    room: {
      type: String,
      required: true
    }
  })

  const { room } = toRefs(props)
  const requiredRoles = ['listener', 'speaker']

  const joined = ref(false)

  const selectedDevices = ref({ })

  const canJoin = computed(() => !!selectedDevices.value.userMedia)

  function join() {
    console.log('Joining room', room.value, selectedDevices.value)
    joined.value = true
  }


</script>

<style scoped>

</style>