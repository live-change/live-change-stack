<template>
  <slot v-bind="{ isWorking: !!working.length, working, errors }"></slot>
  <slot name="working" v-if="working.length && !errors.length">
    Processing...
  </slot>
  <slot name="error" v-if="errors.length" v-bind="{ errors }">
    <h1>Processing errors!</h1>
    <ol>
      <li v-for="error in errors" :key="error.task.name+':'+error.reason" class="error">
        Processing of <b>{{ error.task.name }}</b> failed because of error <b>{{ error.reason }}</b>
      </li>
    </ol>
  </slot>
</template>

<script>
  import analytics from '../logic/analytics.js'
  import debugLib from 'debug'

  const info = debugLib('working:info')
  const debug = debugLib('working:debug')

  export default {
    name: "WorkingZone",
    emits: ['isWorking', 'error'],
    data() {
      return {
        working: [],
        errors: [],
        workingBlockId: 0,
        connectionProblem: false
      }
    },
    watch: {
      isWorking(w) {
        this.$emit('isWorking', w)
      }
    },
    computed: {
      isWorking() {
        return this.working.length > 0
      }
    },
    methods: {
      workingStarted(task) {
        if(this.working.length === 0) {
          analytics.emit('workingStarted', { task: task.name })

          info('WORKING STARTED!')

          const workingBlockId = this.workingBlockId
          this.loagindTimeout = setTimeout(() => {
            if(workingBlockId === this.workingBlockId && this.working.length > 0) {
              this.connectionProblem = true
              analytics.emit('workingError', {
                task: "View working", reason: "connection problem",
                tasks: this.working.map(t => t.name)
              })
            }
          }, 4000)
        }
        debug(`task started ${task.name}`)
        this.working.push(task)
        if(this.$allWorkingTasks) this.$allWorkingTasks.push(task)
        return task
      },
      workingFinished(task) {
        let id = this.working.indexOf(task)
        debug(`task finished ${task.name}`)
        if(id === -1) throw new Error("Task not found")
        this.working.splice(id, 1)

        if(this.$allWorkingTasks)
          this.$allWorkingTasks.splice(this.$allWorkingTasks.indexOf(task), 1)
        if(this.working.length === 0) {
          this.workingBlockId++
          clearTimeout(this.workingTimeout)
          analytics.emit('workingDone', { task: task.name })
          this.$nextTick(this.$router.workingDone)
        }
      },
      workingFailed(task, reason) {
        debug(`task failed ${task.name} because ${reason}`)
        this.workingBlockId++
        clearTimeout(this.workingTimeout)

        this.errors.push({ task, reason })
        analytics.emit('workingError', { task: task.name, reason })

        let id = this.working.indexOf(task)
        if(id === -1) {
          this.errors.push({ task, reason: "unknown task "+task.name })
          throw new Error("Task not found")
        }
        this.working.splice(id, 1)

        if(this.$allWorkingTasks)
          this.$allWorkingTasks.splice(this.$allWorkingTasks.indexOf(task), 1)
        if(this.$allWorkingErrors)
          this.$allWorkingErrors.push({ task, reason })
        this.$emit('error', this.errors)
      },
      addWorkingPromise(name, promise) {
        let task = this.workingStarted({ name, promise })
        promise
            .catch((reason) => {
              console.error("WORKING OF", name, "FAILED", reason)
              this.workingFailed(task, reason)
            })
        promise
            .then((result) => this.workingFinished(task))
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
    },
    beforeUnmount() {
      for(let task of this.working) {
        if(this.$allWorkingTasks)
          this.$allWorkingTasks.splice(this.$allWorkingTasks.indexOf(task), 1)
      }
    }
  }
</script>

<style scoped>

</style>
