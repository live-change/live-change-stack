import App from '@live-change/framework'
const app = App.app()

export default async function(services) {

  const { Room } = services.videoCall.models

  await Room.create({
    id: '[test-room]',
    name: 'Test Room',
    description: 'This is a test room',
  })

  const { PublicAccess, Access, AccessRequest, AccessInvitation } = services.accessControl.models

  await PublicAccess.create({
    id: App.encodeIdentifier(['videoCall_Room', '[test-room]']),
    objectType: 'Room', object: '[test-room]',
    userRoles: ['speaker'],
    sessionRoles: ['speaker']
  })

}
