<template>
  <slot v-if="blockActive" name="blocked" :block="block">
    <div class="flex items-start p-6 bg-pink-100 rounded-border border border-pink-300 mb-6">
      <i class="pi pi-times-circle text-pink-900 text-2xl mr-4" />
      <div class="mr-4">
        <div class="text-pink-900 font-medium text-xl mb-4 leading-none">Action Blocked</div>
        <p class="m-0 p-0 text-pink-700">
          Your safety is important for us, which is why we block suspicious activities.<br />
          Please try again in:
          <span>
            {{ DateTime.fromISO(block.expire).diff(DateTime.fromMillis(now)).toFormat('hh:mm:ss') }}
          </span>
        </p>
      </div>
    </div>
  </slot>
  <slot v-if="!blockActive && counterActive" name="counter" :counter="counter">
    <div class="flex items-start p-6 bg-yellow-100 rounded-border border border-yellow-300 mb-6">
      <i class="pi pi-check-circle text-yellow-900 text-2xl mr-4"></i>
      <div class="mr-4">
        <div class="text-yellow-900 font-medium text-xl mb-2 leading-none">Attention</div>
        <p class="m-0 p-0 text-yellow-700 leading-normal">
          You have
          <strong v-if="counter.remaining > 1">{{ counter.remaining }} more tries.</strong>
          <strong v-else>one more try.</strong>
        </p>
      </div>
    </div>
  </slot>
  <BlockUI :blocked="blockActive">
    <slot :block="blockActive && block" :captcha="captchaActive && captcha"></slot>
  </BlockUI>
  <div v-if="false">
    <h4>Bans</h4>
    <pre>{{ JSON.stringify(bansState, null, '  ') }}</pre>
    <h4>Counters</h4>
    <pre>{{ JSON.stringify(countersState, null, '  ') }}</pre>
  </div>
</template>

<script setup>
  import BlockUI from 'primevue/blockui'

  const { actions, events } = defineProps({
    actions: {
      type: Array,
      default: []
    },
    events: {
      type: Array,
      default: []
    }
  })

  import { provide, computed } from 'vue'

  import { DateTime } from 'luxon'
  import { currentTime } from "@live-change/frontend-base";
  const nowISO = computed(() => new Date(currentTime.value).toISOString())

  import { live, usePath } from '@live-change/vue3-ssr'
  const path = usePath()

  const [ bansState, countersState ] = await Promise.all([
    live(
      path.security.myActionsBansByTypes({ actions, types: ['captcha', 'block'] })
    ),
    live(
      path.security.myCountersState({ events })
    )
  ])

  const block = computed(() => bansState.value?.find(ban => ban.type == 'block' ) || null)
  const blockActive = computed(
    () => block.value && block.value.expire > nowISO.value
    )

  const captcha = computed(() => bansState.value?.find(ban => ban.type == 'captcha' ) || null)
  const captchaActive = computed(
    () => captcha.value && captcha.value.expire > nowISO.value
  )

  const activeCounters = computed( () => countersState.value?.filter(counter => counter.count) || [] )
  const counter = computed(
    () => activeCounters.value?.reduce(
      (acc, counter) => (!acc || acc.remaining > counter.remaining ) ? counter : acc
      , null)
  )
  const counterActive = computed(
    () => activeCounters.value && counter.value?.remaining < 4
  )

</script>
