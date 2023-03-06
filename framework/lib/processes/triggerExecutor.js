const KeyBasedExecutionQueues = require('../utils/KeyBasedExecutionQueues.js')
const CommandQueue = require('../utils/CommandQueue.js')
const SingleEmitQueue = require('../utils/SingleEmitQueue.js')
const SplitEmitQueue = require('../utils/SplitEmitQueue.js')

async function startTriggerExecutor(service, config) {
  if(!config.runCommands) return

  service.keyBasedExecutionQueues = service.keyBasedExecutionQueues || new KeyBasedExecutionQueues(r => r.key)

  await service.dao.request(['database', 'createTable'], service.databaseName, 'triggerRoutes').catch(e => 'ok')

  service.triggerQueue = new CommandQueue(service.dao, service.databaseName,
      service.app.splitTriggers ? `${service.name}_triggers` : 'triggers', service.name )
  for (let triggerName in service.triggers) {
    const triggers = service.triggers[triggerName]
    await service.dao.request(['database', 'put'], service.databaseName, 'triggerRoutes',
        { id: triggerName + '=>' + service.name, trigger: triggerName, service: service.name })
    service.triggerQueue.addCommandHandler(triggerName,
      (trig) => Promise.all(triggers.map( trigger => trigger.execute(trig, service) ))
    )
  }

  service.triggerQueue.start()
}

module.exports = startTriggerExecutor
