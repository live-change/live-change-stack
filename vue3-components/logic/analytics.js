import mitt from "mitt"

const analytics = mitt()

function useAnalytics() {
  return analytics
}

function installRouterAnalytics(router) {
  router.afterEach((to, from) => {
    if(typeof window === 'undefined') return
    analytics.emit('pageView', { ...to })
  })
}

export { analytics, useAnalytics, installRouterAnalytics }
export default analytics
