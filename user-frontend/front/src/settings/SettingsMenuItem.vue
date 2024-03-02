<template>
  <li class="block">
    <router-link :to="{ name }"
                 :class="route.name == name ? 'text-blue-500' : 'text-700'"
                 v-ripple
                 class="flex align-items-center cursor-pointer p-3 hover:surface-100
                          border-round transition-colors transition-duration-150 p-ripple no-underline">
      <i class="pi mr-2" :class="'pi-'+icon"></i>
      <span class="font-medium">{{ label }}</span>
    </router-link>
  </li>
</template>

<script setup>

  import { useRoute } from 'vue-router'
  const route = useRoute()


  const { name, label, icon } = defineProps({
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    }
  })

</script>
