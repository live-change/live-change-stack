<template>
  <component v-if="tag" :is="tag" v-on:submit="ev => $emit('submit', ev)">
    <slot v-if="state == 'ready'" v-bind="{ value }" ></slot>
    <slot v-if="state == 'error'" name="error">
      <div class="alert alert-danger" role="alert">error</div>
    </slot>
    <slot v-if="state == 'loading'" name="loading">
    </slot>
  </component>
  <slot v-if="!tag && state == 'ready'" v-bind="{ value }" ></slot>
  <slot v-if="!tag && state == 'error'" name="error">
    <div class="alert alert-danger" role="alert">error</div>
  </slot>
  <slot v-if="!tag && state == 'loading'" name="loading">
  </slot>
</template>

<script>
  export default {
    name: "Observe",
    props: {
      tag :{
        default: ''
      },
      what: {
        required: true
      },
      name: {
      },
      noLoadingZone: {
        type: Boolean
      }
    },
    inject: ['loadingZone'],
    data() {
      return {
      }
    },
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
        if(this.noLoadingZone) return
        if(state == 'ready' && this.loadingTask) {
          this.loadingZone.finished(this.loadingTask)
          this.loadingTask = null
        }
        if(state == 'error') {
          if(!this.loadingTask) {
            this.loadingTask = this.loadingZone.started({ name: this.computedName })
          }
          this.loadingZone.failed(this.loadingTask, this.error)
          this.loadingTask = null
        }
      }
    },
    created() {
      if(this.noLoadingZone) return
      if(this.state != 'ready') {
        this.loadingTask = this.loadingZone.started({ name: this.computedName })
        if(this.error) {
          this.loadingZone.failed(this.loadingTask, this.error)
          this.loadingTask = null
        }
      }
    },
    beforeUnmount() {
      if(this.noLoadingZone) return;
      if(this.loadingTask) {
        this.loadingZone.finished(this.loadingTask)
      }
    }
  }
</script>

<style scoped>

</style>