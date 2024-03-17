import ReactiveDao from "@live-change/dao"

export default function(service, app) {
  for(let viewName in service.views) {
    const view = service.views[viewName]
    if(view.fetch) {
      if(!view.observable) view.observable = async (...args) => {
        try {
          const data = await view.fetch(...args)
          return new ReactiveDao.ObservableValue(data)
        } catch(error) {
          console.error(error)
        }
      }
      if(!view.get) view.get = async (...args) => {
        const path = await view.fetch(...args)
        return path
      }
    }
  }
  for(let viewName in service.internalViews) {
    const view = service.internalViews[viewName]
    if(view.fetch) {
      if(!view.observable) view.observable = async (...args) => {
        try {
          const data = await view.fetch(...args)
          return new ReactiveDao.ObservableValue(data)
        } catch(error) {
          console.error(error)
        }
      }
      if(!view.get) view.get = async (...args) => {
        const path = await view.fetch(...args)
        return path
      }
    }
  }
}