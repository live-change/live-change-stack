const {createUser} = require("@live-change/user-frontend/server/init-functions.js");
const App = require('@live-change/framework')
const app = App.app()

module.exports = async function(services) {
  async function createPost(postId) {
    const documentId = App.encodeIdentifier(['blog_Post', postId])
    const snapshotId = App.encodeIdentifier([documentId, (0).toFixed().padStart(10, '0')])

    const documentContent = {
      "type": "doc",
      "content": [].concat(new Array(2).fill(
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "test"
            },
            {
              "type": "text",
              "marks": [
                {
                  "type": "bold"
                }
              ],
              "text": "est"
            }
          ]
        }
      ))
    }
    const documentTime = new Date()

    await services.blog.models.Post.create({
      id: postId
    })

    await services.prosemirror.models.Document.create({
      id: documentId,
      ownerType: 'blog_Post',
      owner: postId,
      type: 'page',
      purpose: 'blog_Post',
      version: 1,
      content: documentContent,
      created: documentTime,
      lastModified: documentTime
    })
    await services.prosemirror.models.Snapshot.create({
      id: snapshotId,
      document: documentId,
      version: 1,
      content: documentContent,
      timestamp: documentTime,
    })

    await services.content.models.Content.create({
      id: documentId,
      objectType: 'blog_Post',
      object: postId,
      snapshot: snapshotId
    })
  }

  const user1 = await createUser(services,
    'Test User 1', 'test1@test.com', 'Testy123', 'u1', ['writer', 'administrator'])

  await createPost('one')

  await services.accessControl.models.PublicAccess.create({
    id: App.encodeIdentifier(['blog_Post', 'one']),
    objectType: 'blog_Post',
    object: 'one',
    sessionRoles: ['reader']  .concat(['writer'])
  })
  await services.accessControl.models.Access.create({
    id: App.encodeIdentifier(['user_User', user1.id, 'blog_Post', 'one']),
    sessionOrUserType: 'user_User', sessionOrUser: user1.id,
    objectType: 'blog_Post', object: 'one',
    roles: ['writer']
  })

  await services.url.models.Canonical.create({
    id: App.encodeIdentifier(['blog_Post', 'one']),
    domain: '',
    path: 'test',
    targetType: 'blog_Post',
    target: 'one'
  })
  await services.url.models.Redirect.create({
    id: app.generateUid(),
    domain: 'localhost:8001',
    path: 'test-redirect',
    targetType: 'blog_Post',
    target: 'one'
  })

  await services.content.models.Metadata.create({
    id: App.encodeIdentifier(['blog_Post', 'one']),
    objectType: 'blog_Post',
    object: 'one',
    title: 'Test Page',
    description: 'Test Description',
    "og": {
      "locale": "en_US",
      "localeAlternate": [],
      "type": "website",
      "music": {
        "song": [],
        "album": [],
        "musician": [],
        "creator": []
      },
      "video": {
        "actor": [],
        "director": [],
        "writer": [],
        "tag": []
      },
      "article": {
        "author": [],
        "tag": []
      },
      "profile": {},
      "book": {
        "author": [],
        "tag": []
      }
    }
  })

  await createPost('two')

  await services.url.models.Canonical.create({
    id: App.encodeIdentifier(['blog_Post', 'two']),
    domain: '',
    path: 'test2',
    targetType: 'blog_Post',
    target: 'two'
  })
}
