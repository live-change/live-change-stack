<template>
  <div>
    <div v-if="state == 'ready'">
      <slot :value="what"></slot>
    </div>
    <div v-if="state == 'error'">
      <slot name="error">
        <div class="alert alert-danger" role="alert">error</div>
      </slot>
    </div>
    <div v-if="state == 'loading'">
      <slot name="loading">
      </slot>
    </div>
  </div>
</template>

<script>
  export default {
    name: "Loading",
    props: {
      what: {
      },
      error: {
      },
      name: {
        type: String,
        required: true
      }
    },
    inject: ['loadingZone'],
    data() {
      return {
        state: "loading"
      }
    },
    computed: {
      loaded() {
        return !!this.what
      }
    },
    watch: {
      loaded(def) {
        if(def && this.state == 'loading') {
          this.state = 'ready'
          if(this.loadingTask) {
            this.loadingZone.finished(this.loadingTask)
            this.loadingTask = null
          }
        }
      },
      error(error) {
        if(error && this.state == 'loading') {
          this.state = 'error'
          if(this.loadingTask) {
            this.loadingZone.failed(this.loadingTask, error)
            this.loadingTask = null
          }
        }
      }
    },
    created() {
      if(this.loaded) {
        this.state = 'ready'
        this.$nextTick(this.$router.loadingDone)
      } else {
        this.loadingTask = this.loadingZone.started({ name: this.name })
        if(this.loadingError) {
          this.state = 'error'
          if(this.loadingTask) {
            this.loadingZone.failed(this.loadingTask, this.loadingError)
            this.loadingTask = null
          }
        }
      }
    },
    destroyed() {
      if(this.loadingTask) {
        this.loadingZone.finished(this.loadingTask)
      }
    }
  }
</script>

<style scoped>

</style>