import reactiveMixin from './lib/reactiveMixin.js'
import reactivePrefetchMixin from './lib/reactivePrefetchMixin.js'
export { live, fetch } from './lib/live.js'
import ReactiveObservableList from './lib/ReactiveObservableList.js'
import RangeBuckets from './lib/RangeBuckets.js'
import freezable from './lib/freezable.js'

const ReactiveDaoVue = {
  install(Vue, options) {
    if(!options || !options.dao) throw new Error("dao option required")
    const dao = options.dao
    Vue.mixin(reactiveMixin(dao))
    Vue.mixin(reactivePrefetchMixin(dao))
  }
}

//// TODO: rename reactive to live
export { ReactiveDaoVue, reactiveMixin, reactivePrefetchMixin, ReactiveObservableList, RangeBuckets, freezable }

export default ReactiveDaoVue
