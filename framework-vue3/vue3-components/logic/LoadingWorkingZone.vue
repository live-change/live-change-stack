<template>
  <suspense v-if="suspense">
    <template #default>
      <div>
        <slot v-bind="{ isLoading: !!loading.length, loading, isWorking: !!working.length, working, errors: allErrors }"></slot>
        <slot name="loading" v-if="loading.length && !loadingErrors.length">
          Loading...
        </slot>
        <slot name="working" v-if="working.length && !workingErrors.length">
          Processing...
        </slot>
      </div>
    </template>
    <template #fallback>
      <div>
        <slot name="loading">
          Loading...
        </slot>
        <div style="display: none">SUSPEND FALLBACK</div>
      </div>
    </template>
  </suspense>
  <div v-else>
    <slot v-bind="{ isLoading: !!loading.length, loading, isWorking: !!working.length, working, errors: allErrors }"></slot>
    <slot name="loading" v-if="loading.length && !loadingErrors.length">
      Loading...
    </slot>
    <slot name="working" v-if="working.length && !workingErrors.length">
      Processing...
    </slot>
  </div>

  <slot name="error" v-if="allErrors.length" v-bind="{ errors: allErrors, loadingErrors, workingErrors }">
    <h1 v-if="loadingErrors.length">Loading errors!</h1>
    <ol v-if="loadingErrors.length">
      <li v-for="error in loadingErrors" :key="'loading:'+error.task.name+':'+error.reason" class="error">
        Loading of <b>{{ error.task.name }}</b> failed because of error <b>{{ error.reason }}</b>
      </li>
    </ol>
    <h1 v-if="workingErrors.length">Processing errors!</h1>
    <ol v-if="workingErrors.length">
      <li v-for="error in workingErrors" :key="'working:'+error.task.name+':'+error.reason" class="error">
        Processing of <b>{{ error.task.name }}</b> failed because of error <b>{{ error.reason }}</b>
      </li>
    </ol>
  </slot>
</template>

<script>
  import { onErrorCaptured, reactive, computed } from 'vue'
  import analytics from './analytics.js'
  import debugLib from 'debug'

  const loadingInfo = debugLib('loading:info')
  const loadingDebug = debugLib('loading:debug')
  const workingInfo = debugLib('working:info')
  const workingDebug = debugLib('working:debug')

  export default {
    name: "LoadingWorkingZone",
    emits: ['isLoading', 'isWorking', 'error'],
    props: {
      suspense: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        loading: [],
        working: [],
        loadingBlockId: 0,
        workingBlockId: 0,
        connectionProblem: false,
        r: Math.random()
      }
    },
    setup() {
      const loadingErrors = reactive([])
      const workingErrors = reactive([])
      
      onErrorCaptured(e => {
        loadingErrors.push({ task: { name: 'vue' }, reason: e })
        return true
      })
      
      const allErrors = computed(() => [...loadingErrors, ...workingErrors])
      
      return {
        loadingErrors,
        workingErrors,
        allErrors
      }
    },
    watch: {
      isLoading(l) {
        this.$emit('isLoading', l)
      },
      isWorking(w) {
        this.$emit('isWorking', w)
      }
    },
    computed: {
      isLoading() {
        return this.loading.length > 0
      },
      isWorking() {
        return this.working.length > 0
      }
    },
    methods: {
      loadingStarted(task) {
        if(this.loading.length === 0) {
          analytics.emit('loadingStarted', { task: task.name })
          loadingInfo('LOADING STARTED!')
          const loadingBlockId = this.loadingBlockId
          this.loadingTimeout = setTimeout(() => {
            if(loadingBlockId === this.loadingBlockId && this.loading.length > 0) {
              this.connectionProblem = true
              analytics.emit('loadingError', {
                task: 'View loading', reason: "connection problem",
                tasks: this.loading.map(t => t.name)
              })
            }
          }, 4000)
        }
        loadingDebug(`task started ${task.name}`)
        this.loading.push(task)
        if(this.$allLoadingTasks) this.$allLoadingTasks.push(task)
        return task
      },
      loadingFinished(task) {
        let id = this.loading.indexOf(task)
        loadingDebug(`task finished ${task.name}`)
        if(id === -1) throw new Error("Task not found")
        this.loading.splice(id, 1)

        if(this.$allLoadingTasks)
          this.$allLoadingTasks.splice(this.$allLoadingTasks.indexOf(task), 1)
        if(this.loading.length === 0) {
          this.loadingBlockId++
          clearTimeout(this.loadingTimeout)
          analytics.emit('loadingDone', { task: task.name })
          this.$nextTick(this.$router.loadingDone)
        }
      },
      loadingFailed(task, reason) {
        loadingDebug(`task failed ${task.name} because ${reason}`)
        this.loadingBlockId++
        clearTimeout(this.loadingTimeout)

        this.loadingErrors.push({ task, reason })
        analytics.emit('loadingError', { task: task.name, reason })
        let id = this.loading.indexOf(task)
        if(id === -1) {
          this.loadingErrors.push({ task, reason: "unknown task "+task.name })
          throw new Error("Task not found")
        }
        this.loading.splice(id, 1)

        if(this.$allLoadingTasks)
          this.$allLoadingTasks.splice(this.$allLoadingTasks.indexOf(task), 1)
        if(this.$allLoadingErrors)
          this.$allLoadingErrors.push({ task, reason })
        this.$emit('error', this.allErrors)
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
      },
      workingStarted(task) {
        if(this.working.length === 0) {
          analytics.emit('workingStarted', { task: task.name })
          workingInfo('WORKING STARTED!')
          const workingBlockId = this.workingBlockId
          this.workingTimeout = setTimeout(() => {
            if(workingBlockId === this.workingBlockId && this.working.length > 0) {
              this.connectionProblem = true
              analytics.emit('workingError', {
                task: "View working", reason: "connection problem",
                tasks: this.working.map(t => t.name)
              })
            }
          }, 4000)
        }
        workingDebug(`task started ${task.name}`)
        this.working.push(task)
        if(this.$allWorkingTasks) this.$allWorkingTasks.push(task)
        return task
      },
      workingFinished(task) {
        let id = this.working.indexOf(task)
        workingDebug(`task finished ${task.name}`)
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
        workingDebug(`task failed ${task.name} because ${reason}`)
        this.workingBlockId++
        clearTimeout(this.workingTimeout)

        this.workingErrors.push({ task, reason })
        analytics.emit('workingError', { task: task.name, reason })

        let id = this.working.indexOf(task)
        if(id === -1) {
          this.workingErrors.push({ task, reason: "unknown task "+task.name })
          throw new Error("Task not found")
        }
        this.working.splice(id, 1)

        if(this.$allWorkingTasks)
          this.$allWorkingTasks.splice(this.$allWorkingTasks.indexOf(task), 1)
        if(this.$allWorkingErrors)
          this.$allWorkingErrors.push({ task, reason })
        this.$emit('error', this.allErrors)
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
        loadingZone: {
          started: (task) => this.loadingStarted(task),
          finished: (task) => this.loadingFinished(task),
          failed: (task, reason) => this.loadingFailed(task, reason),
          addPromise: (name, promise) => this.addLoadingPromise(name, promise)
        },
        workingZone: {
          started: (task) => this.workingStarted(task),
          finished: (task) => this.workingFinished(task),
          failed: (task, reason) => this.workingFailed(task, reason),
          addPromise: (name, promise) => this.addWorkingPromise(name, promise)
        }
      }
    },
    beforeUnmount() {
      for(let task of this.loading) {
        if(this.$allLoadingTasks)
          this.$allLoadingTasks.splice(this.$allLoadingTasks.indexOf(task), 1)
      }
      for(let task of this.working) {
        if(this.$allWorkingTasks)
          this.$allWorkingTasks.splice(this.$allWorkingTasks.indexOf(task), 1)
      }
      clearTimeout(this.loadingTimeout)
      clearTimeout(this.workingTimeout)
    }
  }
</script>

<style scoped>

</style>
