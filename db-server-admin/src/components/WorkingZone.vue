<template>
  <div class="working-zone">
    <div class="content" :class="{ working: working.length }">
      <slot></slot>
    </div>
    <div class="loader-main" v-if="working.length || errors.length">
      <slot name="working" v-if="working.length && !errors.length">
        <div class="loading-overlay">
          <div class="card loading-card">
            <div class="cube-spinner">
              <div class="cube1"></div>
              <div class="cube2"></div>
            </div>
            <span class="loading-text" v-if="connectionProblem">Connection problem :/</span>
            <span class="loading-text" v-else>Processing...</span>
          </div>
        </div>
      </slot>
      <slot name="error" v-if="errors.length">
        <InternalServerError taskType="Processing" :errors="errors" />
      </slot>
    </div>
  </div>
</template>

<script>
  import analytics from "analytics"
  import InternalServerError from "./errors/InternalServerError"
  const info = require('debug')('working:info')
  const debug = require('debug')('working:debug')

  export default {
    name: "WorkingZone",
    components: { InternalServerError },
    data() {
      return {
        working: [],
        errors: [],
        workingBlockId: 0,
        connectionProblem: false
      }
    },
    computed: {

    },
    methods: {
      workingStarted(task) {
        if(this.working.length == 0) {
          analytics.workingStarted()
          info('WORKING STARTED!')

          const workingBlockId = this.workingBlockId
          this.workingTimeout = setTimeout(() => {
            if(workingBlockId == this.workingBlockId && this.working.length > 0) {
              this.connectionProblem = true
              analytics.workingError({
                task: "Command processing", reason: "connection problem",
                tasks: this.working.map(t => t.name)
              })
            }
          }, 4000)
        }
        debug(`task started ${task.name}`)
        this.working.push(task)
        return task
      },
      workingFinished(task) {
        let id = this.working.indexOf(task)
        debug(`task finished ${task.name}`)
        if(id == -1) throw new Error("Task not found")
        this.working.splice(id, 1)
        if(this.working.length == 0) {
          this.workingBlockId++
          clearTimeout(this.workingTimeout)
          this.connectionProblem = false
          analytics.workingDone()
          info('WORKING DONE!')
        }
      },
      workingFailed(task, reason) {
        debug(`task failed ${task.name} because ${reason}`)
        this.workingBlockId++
        clearTimeout(this.workingTimeout)

        this.errors.push({ task, reason })
        analytics.workingError({ task: task.name, reason })

        let id = this.working.indexOf(task)
        if(id == -1) {
          this.errors.push({ task, reason: "unknown task "+task.name })
          throw new Error("Task not found")
        }
        this.working.splice(id, 1)
      },
      addWorkingPromise(name, promise) {
        let task = this.workingStarted({ name, promise })
        promise
          .then((result) => this.workingFinished(task))
        promise
          .catch((reason) => {
            this.workingFailed(task, reason)
          })
        return promise
      }
    },
    provide() {
      return {
        workingZone: {
          started: (task) => this.workingStarted(task),
          finished: (task) => this.workingFinished(task),
          failed: (task, reason) => this.workingFailed(task, reason),
          addPromise: (name, promise) => this.addWorkingPromise(name, promise)
        }
      }
    }
  }
</script>

<style scoped>

</style>
