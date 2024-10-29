<template>
  <suspense v-if="suspense" @pending="handlePending" @resolve="handleResolve" @fallback="handleFallback">
    <template #default>
      <div>
        <slot v-bind="{ isLoading: !!loading.length, loading, errors }"></slot>
        <slot name="loading" v-if="loading.length && !errors.length">
          Loading...
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
  <slot v-else v-bind="{ isLoading: !!loading.length, loading, errors }"></slot>

  <slot name="error" v-if="errors.length" v-bind="{ errors }">
    <h1>Loading errors!</h1>
    <ol>
      <li v-for="error in errors" :key="error.task.name+':'+error.reason" class="error">
        Loading of <b>{{ error.task.name }}</b> failed because of error <b>{{ error.reason }}</b>
      </li>
    </ol>
  </slot>
</template>

<script>
  import { onErrorCaptured, ref, reactive } from 'vue'
  import analytics from './analytics.js'
  import debugLib from 'debug'

  const info = debugLib('loading:info')
  const debug = debugLib('loading:debug')

  export default {
    name: "LoadingZone",
    emits: ['isLoading', 'error'],
    props: {
      suspense: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        loading: [],
        loadingBlockId: 0,
        connectionProblem: false,
        suspenseTask: null,
        r: Math.random()
      }
    },
    setup() {
      const errors = reactive([])
      onErrorCaptured(e => {
        errors.push({ task: { name: 'vue' }, reason: e })
        return true
      })
      return {
        errors
      }
    },
    watch: {
      isLoading(l) {
        this.$emit('isLoading', l)
      }
    },
    computed: {
      isLoading() {
        return this.loading.length > 0
      }
    },
    methods: {
      handlePending() {
        const oldSuspenseTask = this.suspenseTask
        this.suspenseTask = { name: 'View loading' }
        this.loadingStarted(this.suspenseTask)
        if(oldSuspenseTask) this.loadingFinished(oldSuspenseTask)
      },
      handleResolve() {
        let oldSuspenseTask = this.suspenseTask
        this.suspenseTask = null
        if(oldSuspenseTask) this.loadingFinished(oldSuspenseTask)
        setTimeout(() => {
          this.loading = this.loading.slice()
        }, 10)
      },
      handleFallback() {
      },
      loadingStarted(task) {
        if(this.loading.length === 0) {
          analytics.emit('loadingStarted', { task: task.name })
          info('LOADING STARTED!')
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
        debug(`task started ${task.name}`)
        this.loading.push(task)
        if(this.$allLoadingTasks) this.$allLoadingTasks.push(task)
        return task
      },
      loadingFinished(task) {
        let id = this.loading.indexOf(task)
        debug(`task finished ${task.name}`)
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
        debug(`task failed ${task.name} because ${reason}`)
        this.loadingBlockId++
        clearTimeout(this.loadingTimeout)

        this.errors.push({ task, reason })
        analytics.emit('loadingError', { task: task.name, reason })
        let id = this.loading.indexOf(task)
        if(id === -1) {
          this.errors.push({ task, reason: "unknown task "+task.name })
          throw new Error("Task not found")
        }
        this.loading.splice(id, 1)

        if(this.$allLoadingTasks)
          this.$allLoadingTasks.splice(this.$allLoadingTasks.indexOf(task), 1)
        if(this.$allLoadingErrors)
          this.$allLoadingErrors.push({ task, reason })
        this.$emit('error', this.errors)
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
    beforeUnmount() {
      for(let task of this.loading) {
        if(this.$allLoadingTasks)
          this.$allLoadingTasks.splice(this.$allLoadingTasks.indexOf(task), 1)
      }
    }
  }
</script>

<style scoped>

</style>
