const test = require('blue-tape')
const testServerDao = require('./testServerDao.js')
const { Path } = require("../index.js")

const users = (params) => new Path(['users', params])
const user = (params) => new Path(['user', params])
const avatar = (params) => new Path(['avatar', params])
const tasks = (params) => new Path(['tasks', params])
const deleteTask = (params) => ['tasks', params]

const clean = x => JSON.parse(JSON.stringify(x))

test("Path", t => {
  t.plan(4)

  t.test("single user query", t => {
    t.plan(1)
    const path = user({ user: '123' })
    t.deepEqual(clean(path), { what: [ 'user', { user: '123' } ] })
  })

  t.test("all users with avatars", t => {
    t.plan(1)
    const path = users({ }).with(u => avatar({ user: u.id }))
    t.deepEqual(clean(path), {"what":["users",{}],"more":[{"schema":[["avatar",{"object":{"user":{"property":"id"}}}]]}]})
  })

  t.test("all tasks with authors and observers with avatars", t => {
    t.plan(1)
    const userWithAvatar = (id) => user({ user: id }).with(u => avatar({ id: u.id }))
    const path = tasks({ })
        .with(task => userWithAvatar(task.author))
        .with(task => userWithAvatar(task.observers))
    t.deepEqual(clean(path), { "what": [ "tasks",  {} ], "more": [
        {
          "schema": [["user", { "object": { "user": { "property": "author" } } } ]],
          "more": [
            { "schema": [["avatar", {"object": {"id": {"property": "id"}}}]] }
          ]
        },
        {
          "schema": [["user", {"object": {"user": {"property": "observers"}}}]],
          "more": [
              {"schema": [["avatar", {"object": {"id": {"property": "id"}}}]]}
          ]
        }
      ]})
  })

  t.test("tasks with delete actions", t => {
    t.plan(1)
    const path = tasks({ }).action(task => deleteTask({ task: task.id }))
    t.deepEqual(clean(path), {"what":["tasks",{}],"actions":[
        {"path":["tasks"],"params":{"object":{"task":{"property":"id"}}}}
      ]})
  })

})

test.onFinish(() => process.exit(0))
