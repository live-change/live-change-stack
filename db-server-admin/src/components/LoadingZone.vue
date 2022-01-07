<template>
  <div class="loading-zone">
    <div class="content" :class="{ loading: loading.length }">
      <slot></slot>
    </div>
    <div class="loader-main" v-if="loading.length || errors.length">
      <slot name="loading" v-if="loading.length && !errors.length">
        <div class="loading-overlay">
          <div class="card loading-card">
            <div class="cube-spinner">
              <div class="cube1"></div>
              <div class="cube2"></div>
            </div>
            <span class="loading-text" v-if="connectionProblem" v-html="i18n.connectionProblem"></span>
            <span class="loading-text" v-else v-html="i18n.loading"></span>
          </div>
        </div>
      </slot>
      <slot name="error" v-if="errors.length">
        <InternalServerError taskType="Loading" :errors="errors" />
      </slot>
    </div>
  </div>
</template>

<script>
  import analytics from "analytics"
  import InternalServerError from "./errors/InternalServerError.vue"
  import i18n from "i18n"

  const info = require('debug')('loading:info')
  const debug = require('debug')('loading:debug')

  let allLoadingTasks = []
  let allLoadingErrors = []
  if(typeof window != 'undefined') {
    window.allLoadingTasks = allLoadingTasks
    window.allLoadingErrors = allLoadingErrors
  }

  export default {
    name: "LoadingZone",
    components: { InternalServerError },
    data() {
      return {
        loading: [],
        errors: [],
        loadingBlockId: 0,
        connectionProblem: false
      }
    },
    computed: {
      i18n() {
        return i18n().system
      },
    },
    methods: {
      loadingStarted(task) {
        if(this.loading.length == 0) {
          analytics.loadingStarted()
          info('LOADING STARTED!')

          const loadingBlockId = this.loadingBlockId
          this.loagindTimeout = setTimeout(() => {
            if(loadingBlockId == this.loadingBlockId && this.loading.length > 0) {
              this.connectionProblem = true
              analytics.workingError({
                task: "View loading", reason: "connection problem",
                tasks: this.loading.map(t => t.name)
              })
            }
          }, 4000)
        }
        debug(`task started ${task.name}`)
        this.loading.push(task)
        allLoadingTasks.push(task)
        return task
      },
      loadingFinished(task) {
        let id = this.loading.indexOf(task)
        debug(`task finished ${task.name}`)
        if(id == -1) throw new Error("Task not found")
        this.loading.splice(id, 1)
        allLoadingTasks.splice(allLoadingTasks.indexOf(task), 1)
        if(this.loading.length == 0) {
          this.loadingBlockId++
          clearTimeout(this.loadingTimeout)
          analytics.loadingDone()
          this.$nextTick(this.$router.loadingDone)
        }
      },
      loadingFailed(task, reason) {
        debug(`task failed ${task.name} because ${reason}`)
        this.loadingBlockId++
        clearTimeout(this.loadingTimeout)

        this.errors.push({ task, reason })
        analytics.loadingError({ task: task.name, reason })

        let id = this.loading.indexOf(task)
        if(id == -1) {
          this.errors.push({ task, reason: "unknown task "+task.name })
          throw new Error("Task not found")
        }
        this.loading.splice(id, 1)

        allLoadingTasks.splice(allLoadingTasks.indexOf(task), 1)
        allLoadingErrors.push({ task, reason })
      },
      addLoadingPromise(name, promise) {
        let task = this.loadingStarted({ name, promise })
        promise
          .catch((reason) => {
            console.error("LOADING OF", name, "FAILED", reason)
            this.loadingFailed(task, reason)
          })
        promise
          .then((result) => this.loadingFinished(task))
        return promise
      }
    },
    provide() {
      return {
        loadingZone: {
          started: (task) => this.loadingStarted(task),
          finished: (task) => this.loadingFinished(task),
          failed: (task, reason) => this.loadingFailed(task, reason),
          addPromise: (name, promise) => this.addLoadingPromise(name, promise)
        }
      }
    },
    beforeDestroy() {
      for(let task of this.loading) {
        allLoadingTasks.splice(allLoadingTasks.indexOf(task), 1)
      }
    }
  }
</script>

<style scoped>

</style>
