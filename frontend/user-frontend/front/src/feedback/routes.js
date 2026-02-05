
export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [

    route({ name: 'user:email:feedbackReceived', path: '/_email/feedbackReceived/:contact/:json', props: true,
      meta: { raw: true, lightMode: true }, component: () => import("./email/FeedbackEmail.vue") }),

  ]
}

export default routes