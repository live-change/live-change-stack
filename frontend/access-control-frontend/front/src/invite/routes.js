
export function routes(config = {}) {
  const { prefix = '/', route = (r) => r } = config

  return [
    route({ name: 'accessControl:email:invite', path: '/_email/inviteWithMessage/:contact/:json',
      props: true, meta: { raw: true }, component: () => import("./InviteEmail.vue") }),
  ]
}

export default routes
