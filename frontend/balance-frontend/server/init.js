import { createUser } from "@live-change/user-service/init-functions.js"
import App from '@live-change/framework'
const app = App.app()

export default async function(services) {

  const testUser = await createUser(services,
    'Test User', 'test@test.com', 'Testy123', 'u1', ['writer'])

}
