<template>
  <div class="page">
    <NavBar />

    <div class="content-container" v-if="!multiRow && !footer" id="main-scroll">
      <div class="page-row">
        <aside v-if="hasLeftSlot">
          <slot name="left"></slot>
        </aside>
        <main>
          <slot></slot>
        </main>
        <aside v-if="hasRightSlot">
          <slot name="right"></slot>
        </aside>
      </div>
    </div>
    <div class="content-container" v-if="!multiRow && footer" id="main-scroll">
      <div class="page-over-footer">
        <div class="page-row">
          <aside v-if="hasLeftSlot">
            <slot name="left"></slot>pm
          </aside>
          <main>
            <slot></slot>
          </main>
          <aside v-if="hasRightSlot">
            <slot name="right"></slot>
          </aside>
        </div>
      </div>
      <Footer>
      </Footer>
    </div>

    <div class="content-container" v-if="multiRow && !footer" id="main-scroll">
      <slot></slot>
    </div>

    <div class="content-container" v-if="multiRow && footer" id="main-scroll">
      <div class="page-over-footer">
        <slot></slot>
      </div>
      <Footer>
      </Footer>
    </div>

  </div>
</template>

<script>
  import LoadingZone from '@/components/LoadingZone.vue'
  import WorkingZone from '@/components/WorkingZone.vue'

  import NavBar from "./NavBar.vue"
  import Footer from "./Footer.vue"

  import api from "api"
  import i18n from "i18n"

  export default {
    name: "Page",
    components: { NavBar, Footer, LoadingZone, WorkingZone },
    props: {
      footer: {
        type: Boolean,
        default: true
      },
      injectLoading: {
        type: Boolean,
        default: true
      },
      multiRow: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        displayVersionMismatch: false
      }
    },
    computed: {
      i18n() {
        return i18n().system
      },
      hasLeftSlot () {
        return !!this.$slots.left
      },
      hasRightSlot () {
        return !!this.$slots.right
      }
    },
    mounted() {
      this.displayVersionMismatch = true
    },
    methods: {
      reload() {
        document.location.reload()
      }
    }
  }
</script>

<style scoped>

</style>
