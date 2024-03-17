import App from '@live-change/framework'
const app = App.app()

export default async function(services) {

  await app.dao.request(['database', 'createDatabase', 'testDb'])
  await app.dao.request(['database', 'createTable', 'testDb', 'testTable1'])
  for(let i = 0; i < 100; i++) {
    await app.dao.request(['database', 'put', 'testDb', 'testTable1', {
      id: app.generateUid(),
      number: i,
      text: 'test_'+i,
      created: Date.now()
    }])
  }

}
