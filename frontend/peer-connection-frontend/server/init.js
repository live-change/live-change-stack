import App from '@live-change/framework'
const app = App.app()

export default async function(services) {

  const { PublicAccess, Access, AccessRequest, AccessInvitation } = services.accessControl.models

  await PublicAccess.create({
    id: App.encodeIdentifier(['example_Example', 'one']),
    objectType: 'example_Example', object: 'one',
    userRoles: ['speaker'],
    sessionRoles: ['speaker']
  })

}
