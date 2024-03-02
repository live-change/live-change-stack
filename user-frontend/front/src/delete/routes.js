export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:delete', path: prefix + 'delete',
      component: () => import("./Delete.vue") }),
    route({ name: 'user:deleteFinished', path: prefix + 'delete-finished',
      component: () => import("./DeleteFinished.vue") }),
    route({ name: 'user:deleteFeedbackSent', path: prefix + 'delete-feedback-sent',
      component: () => import("./DeleteFeedbackSent.vue") }),

  ]
}

export default routes
