import net from 'node:net'

export const READY_TIMEOUT_MS = 120000
export const READY_POLL_MS = 2000

export async function waitForServerReady(url: string): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS
  while(Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if(res.ok) return
    } catch {
      // Not ready yet.
    }
    await new Promise(resolve => setTimeout(resolve, READY_POLL_MS))
  }
  throw new Error(`Server at ${url} did not become ready within ${READY_TIMEOUT_MS}ms`)
}

export async function firstFreePort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if(!address || typeof address === 'string') {
        server.close(() => reject(new Error('Could not get free port')))
        return
      }
      const port = address.port
      server.close(error => {
        if(error) return reject(error)
        resolve(port)
      })
    })
  })
}

type TestServerShape = {
  apiServer: {
    services: {
      services: Array<{
        name: string
        models: Record<string, any>
        views: Record<string, unknown>
        actions: Record<string, unknown>
        triggers: Record<string, unknown>
      }>
    }
  }
}

export function createTestEnvHelpers(server: TestServerShape) {
  function haveService(name: string) {
    const service = server.apiServer.services.services.find(s => s.name === name)
    if(!service) throw new Error('service ' + name + ' not found')
    return service
  }

  function haveModel(serviceName: string, modelName: string) {
    const service = haveService(serviceName)
    const model = service.models[modelName]
    if(!model) throw new Error('model ' + modelName + ' not found')
    return model
  }

  function haveView(serviceName: string, viewName: string) {
    const service = haveService(serviceName)
    const view = service.views[viewName]
    if(!view) throw new Error('view ' + viewName + ' not found')
    return view
  }

  function haveAction(serviceName: string, actionName: string) {
    const service = haveService(serviceName)
    const action = service.actions[actionName]
    if(!action) throw new Error('action ' + actionName + ' not found')
    return action
  }

  function haveTrigger(serviceName: string, triggerName: string) {
    const service = haveService(serviceName)
    const trigger = service.triggers[triggerName]
    if(!trigger) throw new Error('trigger ' + triggerName + ' not found')
    return trigger
  }

  async function grabObject(serviceName: string, modelName: string, id: string) {
    const model = haveModel(serviceName, modelName)
    return await model.get(id)
  }

  return {
    haveService,
    haveModel,
    haveView,
    haveAction,
    haveTrigger,
    grabObject
  }
}
