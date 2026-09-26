import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import App from '@live-change/framework'
import { startAchievementTestServer, trigger } from './helpers.js'
import { generateAnyId } from '@live-change/relations-plugin/src/idGeneration.js'

const app = App.app()
let server

before(async () => {
  server = await startAchievementTestServer()
  assert.ok(server.url)
})

function achievementService() {
  return server.apiServer.services.services.find(s => s.name == 'achievement')
}

function scoreService() {
  return server.apiServer.services.services.find(s => s.name == 'score')
}

function user(id) {
  return {
    recipientType: 'user_User',
    recipient: id
  }
}

async function setProgress(recipient, metric, value) {
  return await trigger(app, 'achievement', 'setProgress', {
    ...user(recipient),
    metric,
    value
  })
}

async function getProgress(recipient, metric) {
  const id = generateAnyId(['recipient', 'topic'], {
    ...user(recipient),
    topicType: 'achievement_Metric',
    topic: metric
  })
  return await achievementService().models.Progress.get(id)
}

async function getUnlock(recipient, code) {
  const id = generateAnyId(['recipient', 'topic'], {
    ...user(recipient),
    topicType: 'achievement_Code',
    topic: code
  }, { hashId: true })
  return await achievementService().models.Unlock.get(id)
}

async function getScoreEvent(recipient, cause) {
  const id = generateAnyId(['recipient', 'cause'], {
    ...user(recipient),
    causeType: 'achievement_Unlock',
    cause
  }, { hashId: true })
  return await scoreService().models.ScoreEvent.get(id)
}

async function getTotal(recipient) {
  const id = generateAnyId(['recipient', 'topic'], {
    ...user(recipient),
    topicType: 'score_Counter',
    topic: 'total'
  }, { hashId: true })
  return await scoreService().models.ScoreCounter.get(id)
}

test('setProgress 1 on profile-name creates progress, unlock, and 10 score', async () => {
  const result = await setProgress('alice', 'profile-name', 1)
  const progress = await getProgress('alice', 'profile-name')
  assert.equal(progress.value, 1)
  const unlock = await getUnlock('alice', 'profile-name')
  assert.ok(unlock)
  assert.equal(unlock.score, 10)
  assert.equal(unlock.category, 'profile')
  assert.equal(result.unlocks[0], unlock.id)
  const event = await getScoreEvent('alice', unlock.id)
  assert.ok(event)
  assert.equal(event.score, 10)
  assert.equal(event.cause, unlock.id)
  const total = await getTotal('alice')
  assert.equal(total.score, 10)
})

test('second SET 1 does not double unlock or score', async () => {
  await setProgress('bob', 'profile-name', 1)
  await setProgress('bob', 'profile-name', 1)
  const total = await getTotal('bob')
  assert.equal(total.score, 10)
  const listed = await achievementService().models.Unlock.sortedIndexRangeGet(
    'byRecipient',
    ['user_User', 'bob']
  )
  assert.equal(listed.length, 1)
})

test('SET invites 5 unlocks 1 and 5, not a missing 10, for 30 points', async () => {
  await setProgress('carol', 'invites', 5)
  const one = await getUnlock('carol', 'invites-1')
  const five = await getUnlock('carol', 'invites-5')
  const ten = await getUnlock('carol', 'invites-10')
  assert.ok(one)
  assert.ok(five)
  assert.equal(ten, null)
  const total = await getTotal('carol')
  assert.equal(total.score, 30)
  const eventOne = await getScoreEvent('carol', one.id)
  const eventFive = await getScoreEvent('carol', five.id)
  assert.equal(eventOne.cause, one.id)
  assert.equal(eventFive.cause, five.id)
})

test('second SET invites 5 does not change the sum', async () => {
  await setProgress('dave', 'invites', 5)
  await setProgress('dave', 'invites', 5)
  const total = await getTotal('dave')
  assert.equal(total.score, 30)
})

test('metric without definitions only stores Progress', async () => {
  await setProgress('erin', 'custom-stat', 3)
  const progress = await getProgress('erin', 'custom-stat')
  assert.equal(progress.value, 3)
  const listed = await achievementService().models.Unlock.sortedIndexRangeGet(
    'byRecipient',
    ['user_User', 'erin']
  )
  assert.equal(listed.length, 0)
  const total = await getTotal('erin')
  assert.equal(total, null)
})

test('unlockAchievement with unknown code throws', async () => {
  await assert.rejects(
    () => trigger(app, 'achievement', 'unlockAchievement', {
      ...user('frank'),
      code: 'not-a-code'
    }),
    /unknownAchievement/
  )
})
