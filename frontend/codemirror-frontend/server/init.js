import App from '@live-change/framework'

export default async function init(services) {
  console.log('codemirror-frontend init')

  const { PublicAccess } = services.accessControl.models
  await PublicAccess.create({
    id: App.encodeIdentifier(['Example', 'demo']),
    objectType: 'Example',
    object: 'demo',
    sessionRoles: ['writer']
  })
}
