import ObservableValue from "./ObservableValue.js"
import ObservablePromiseProxy from "./ObservablePromiseProxy.js"
import ObservableError from "./ObservableError.js"
import Debug from "debug"
const debug = Debug("reactive-dao")

const errorMapper = e => ''+(e.stack || e.message || (typeof e == 'object' ? JSON.stringify(e) : e))

class SimpleDao {

  constructor(defn) {
    this.defn = defn
  }

  observable(what) {
    let ret
    try {
      const source = this.defn.values[what[1]]
      if(!source) throw new Error(`source ${what[1]} is not defined`)
      ret = source.observable(...(what.slice(2)))
      if (ret.observe) return ret
      if (ret.then) return new ObservablePromiseProxy(ret, errorMapper)
    } catch(e) {
      debug('ERROR ON OBSERVE',  what)
      debug(e)
      return new ObservableError(errorMapper(e))
    }
    return new ObservableValue(ret)
  }

  get(what) {
    const source = this.defn.values[what[1]]
    if(!source) throw new Error(`source ${what[1]} is not defined`)
    return source.get(...(what.slice(2)))
  }

  request(what, ...args) {
    let method = this.defn.methods[what[1]]
    if(!method) throw new Error("methodNotFound")
    let res = method(...(what.slice(2).concat(args)))
    if(res && res.then) return res
    return Promise.resolve(res)
  }

  requestWithSettings(settings, what, ...args) {
    // ignore settings for local dao
    return this.request(what, ...args)
  }

}

export default SimpleDao
