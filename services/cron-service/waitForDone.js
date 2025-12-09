import App from '@live-change/framework'
const app = App.app()


export default function createWaitingFunction(definition) {
  const Task = definition.foreignModel('task', 'Task')
  const RunState = definition.foreignModel('cron', 'RunState')

  return async function waitForDone(jobType, job, {triggerService, trigger}) {
    if(typeof job !== 'string') job = App.encodeIdentifier(job.ownerType, job.owner, job.topicType, job.topic)
    const runState = App.encodeIdentifier([jobType, job])
    return new Promise((resolve, reject) => {    
      let done = false    
      const taskObservations = new Map()
      function addTaskObservation(taskId) {
        const observable = Task.observable(taskId)
        if(!observable) return
        const observer = {
          set: (value) => {
            if(done) return
            if(!value) return updateTasks()
            if(value.state === 'done' || value.state === 'failed') updateTasks()        
          }
        }
        taskObservations.set(taskId, { observable, observer })
        observable.observe(observer)
      }
      async function updateTasks() {
        if(done) return
        const runningTasks = Array.from(taskObservations.values())
          .filter(observation => observation.observable.getValue().state !== 'done' && observation.observable.getValue().state !== 'failed')
        if(runningTasks.length === 0) {
          //await RunState.delete(runState)
          await triggerService({ service: 'cron', type: 'cron_deleteRunState' }, {
            runState
          })
          if(done) return          
          return finish()
        }
      }
      const runStateObservable = RunState.observable(runState)
      const runStateObserver = {
        set: (value) => {        
          if(done) return
          if(!value) return finish()
          if(value.tasks) {
            for(const taskId of value.tasks) {
              addTaskObservation(taskId)
            }
          }
        }
      }
      runStateObservable.observe(runStateObserver)
      function finish() {
        if(done) return
        done = true
        runStateObservable.unobserve(runStateObserver)
        resolve()
      }
    })
  }
}
