<template>
  <li>
    <router-link
      :to="to"
      v-ripple
      v-bind="$attrs"
      class="flex px-6 py-2 items-center
             text-surface-600 hover:text-surface-900 hover:bg-surface-100
             dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800
             font-medium border-round cursor-pointer p-ripple no-underline
             transition-colors duration-300 ease-in-out"
    >
      <i :class="[icon, 'mr-3']"></i>
      <span><slot /></span>
    </router-link>
  </li>
</template>

<script>
  export default {
    inheritAttrs: false
  }
</script>

<script setup>
  defineProps({
    to: {
      type: [String, Object],
      required: true
    },
    icon: {
      type: String,
      required: true
    }
  })
</script>
