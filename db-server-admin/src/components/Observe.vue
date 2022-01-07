<template>
  <component :is="tag">
    <slot v-bind="{ value }" v-if="state == 'ready'"></slot>
    <slot name="error" v-if="state == 'error'">
      <div class="alert alert-danger" role="alert">error</div>
    </slot>
    <slot name="loading" v-if="state == 'loading'">
    </slot>
  </component>
</template>

<script>
  export default {
    name: "Observe",
    props: {
      tag: {
        default: 'div'
      },
      what: {
      },
      name: {
      },
      noLoadingZone: {
        type: Boolean
      }
    },
    inject: ['loadingZone'],
    reactive: {
      value() { return this.what }
    },
    computed: {
      computedName() {
        if(this.name) return this.name
        return JSON.stringify(this.what)
      },
      error() {
        return this.valueError
      },
      state() {
        if(this.error) return "error"
        if(this.value === undefined) return "loading"
        return "ready"
      }
    },
    watch: {
      state(state) {
        if(this.noLoadingZone) return;
        if(state == 'ready' && this.loadingTask) {
          this.loadingZone.finished(this.loadingTask)
          this.loadingTask = null
        }
        if(state == 'error' && this.loadingTask) {
          this.loadingZone.failed(this.loadingTask, this.error)
          this.loadingTask = null
        }
      }
    },
    created() {
      if(this.noLoadingZone) return;
      if(this.state != 'ready') {
        this.loadingTask = this.loadingZone.started({ name: this.computedName })
        if(this.error) {
          this.loadingZone.failed(this.loadingTask, this.loadingError)
          this.loadingTask = null
        }
      }
    },
    beforeDestroy() {
      if(this.noLoadingZone) return;
      if(this.loadingTask) {
        this.loadingZone.finished(this.loadingTask)
      }
    }
  }
</script>

<style scoped>

</style>