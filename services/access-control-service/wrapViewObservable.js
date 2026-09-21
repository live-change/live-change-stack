import { ObservableValue, ObservableProxy, ObservablePromiseProxy } from '@live-change/dao'

function safeDispose(observable) {
  if (!observable) return
  if (observable.isDisposed && observable.isDisposed()) return
  try {
    if (typeof observable.dispose === 'function') observable.dispose()
  } catch {
    // already torn down
  }
}

/**
 * Wrap a view.observable with access-control rolesPath on app.dao.
 * Extracted so contract tests can mock app.dao / access without booting App.
 */
export function wrapViewObservable({
  access,
  app,
  oldObservable,
  view,
  config,
  viewName
}) {
  return (...args) => {
    const [ properties, context ] = args
    const { client } = context
    const { objectType, object } = properties
    const objects = [].concat(
      config.objects ? config.objects(properties) :
        ((objectType && object) ? [{ objectType, object }] : [])
    )
    if (objects.length === 0) {
      console.warn(
        'no objects for ' + (viewName || 'view') +
        ' access control to work - only global roles will be checked'
      )
    }

    const rolesPath = access.accessPath(client, objects)

    const errorObservable = new ObservableValue()
    errorObservable.handleError('notAuthorized')

    const observableProxy = new ObservableProxy(null)

    let valueObservable
    let accessible
    let rolesObserved = false

    const rolesObservable = app.dao.observable(rolesPath)
    const rolesObserver = () => {
      const accessObject = rolesObservable.getValue()
      const newAccessible = accessObject ? access.testRoles(config.roles, accessObject.roles) : false
      if (newAccessible !== accessible) {
        const previousValue = valueObservable
        if (newAccessible === true) {
          valueObservable = oldObservable.apply(view, args)
          if (valueObservable && valueObservable.then) {
            valueObservable = new ObservablePromiseProxy(valueObservable)
          }
        } else {
          valueObservable = undefined
        }
        observableProxy.setTarget(newAccessible ? valueObservable : errorObservable)
        if (previousValue && previousValue !== valueObservable) safeDispose(previousValue)
        accessible = newAccessible
      }
    }
    rolesObservable.observe(rolesObserver)
    rolesObserved = true

    const oldDispose = observableProxy.dispose.bind(observableProxy)
    const oldRespawn = observableProxy.respawn.bind(observableProxy)
    observableProxy.dispose = () => {
      if (rolesObserved) {
        try {
          rolesObservable.unobserve(rolesObserver)
        } catch {
          // already torn down
        }
        rolesObserved = false
      }
      oldDispose()
      safeDispose(valueObservable)
    }
    observableProxy.respawn = () => {
      if (!rolesObserved) {
        rolesObservable.observe(rolesObserver)
        rolesObserved = true
      }
      oldRespawn()
    }
    return observableProxy
  }
}
