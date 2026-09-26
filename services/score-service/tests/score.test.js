import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import App from '@live-change/framework'
import { startScoreTestServer, trigger } from './helpers.js'
import { generateAnyId } from '@live-change/relations-plugin/src/idGeneration.js'

const app = App.app()
let server

before(async () => {
  server = await startScoreTestServer()
  assert.ok(server.url)
})

function scoreService() {
  return server.apiServer.services.services.find(s => s.name == 'score')
}

function user(id) {
  return {
    recipientType: 'user_User',
    recipient: id
  }
}

async function createCause(type, name) {
  if(type == 'profile') {
    return await trigger(app, 'scoreTest', 'scoreTest_createProfileUnlock', { name })
  }
  if(type == 'invite') {
    return await trigger(app, 'scoreTest', 'scoreTest_createInvite', { name })
  }
  return await trigger(app, 'scoreTest', 'scoreTest_createBonus', { name })
}

async function record(recipient, causeType, cause) {
  return await trigger(app, 'score', 'recordScore', {
    ...user(recipient),
    causeType,
    cause
  })
}

async function getCounter(recipient, topic) {
  const id = generateAnyId(['recipient', 'topic'], {
    ...user(recipient),
    topicType: 'score_Counter',
    topic
  }, { hashId: true })
  return await scoreService().models.ScoreCounter.get(id)
}

async function getRank(recipient, topic = 'total') {
  const id = generateAnyId(['recipient', 'topic'], {
    ...user(recipient),
    topicType: 'score_Counter',
    topic
  })
  return await scoreService().models.RankEntry.get(id)
}

test('first recordScore creates event, credits, and counters', async () => {
  const cause = await createCause('profile', 'name-a')
  const eventId = await record('alice', 'scoreTest_ProfileUnlock', cause)
  const event = await scoreService().models.ScoreEvent.get(eventId)
  assert.ok(event)
  assert.equal(event.score, 10)
  assert.equal(event.category, 'profile')
  const total = await getCounter('alice', 'total')
  const profile = await getCounter('alice', 'profile')
  assert.equal(total.score, 10)
  assert.equal(profile.score, 10)
  const rank = await getRank('alice')
  assert.ok(rank)
  assert.equal(rank.position, 1)
  assert.equal(rank.score, 10)
})

test('second recordScore with the same recipient and cause does not double', async () => {
  const cause = await createCause('profile', 'name-b')
  await record('bob', 'scoreTest_ProfileUnlock', cause)
  await record('bob', 'scoreTest_ProfileUnlock', cause)
  const total = await getCounter('bob', 'total')
  assert.equal(total.score, 10)
})

test('unknown causeType throws', async () => {
  await assert.rejects(
    () => record('carol', 'scoreTest_Unknown', 'missing'),
    /unknownCauseType/
  )
})

test('three people 10, 30, 20 get positions 2, 1, 3', async () => {
  const aCause = await createCause('profile', 'pos-a')
  const bCause = await createCause('invite', 'pos-b')
  const cCause = await createCause('bonus', 'pos-c')
  await record('p10', 'scoreTest_ProfileUnlock', aCause)
  await record('p30', 'scoreTest_Invite', bCause)
  await record('p20', 'scoreTest_Bonus', cCause)
  const r10 = await getRank('p10')
  const r30 = await getRank('p30')
  const r20 = await getRank('p20')
  assert.ok(r30.position < r20.position)
  assert.ok(r20.position < r10.position)
})

test('equal scores get consecutive positions, earlier tieBreak stays higher', async () => {
  const first = await createCause('profile', 'tie-1')
  const second = await createCause('profile', 'tie-2')
  const lower = await createCause('profile', 'tie-low')
  await record('tie-early', 'scoreTest_ProfileUnlock', first)
  await record('tie-late', 'scoreTest_ProfileUnlock', second)
  const bonus = await createCause('bonus', 'tie-bonus')
  await record('tie-low', 'scoreTest_Bonus', bonus)
  const early = await getRank('tie-early')
  const late = await getRank('tie-late')
  const low = await getRank('tie-low')
  assert.equal(early.score, late.score)
  assert.ok(early.position < late.position)
  assert.ok(low.score > early.score)
  assert.ok(low.position < early.position)
})

test('rebuildRank fixes dense positions from score order', async () => {
  await trigger(app, 'score', 'score_setRankEntry', {
    ...user('rebuild-high'),
    topicType: 'score_Counter',
    topic: 'total',
    score: 90,
    position: 7,
    tieBreak: new Date('2026-01-01T00:00:00.000Z')
  })
  await trigger(app, 'score', 'score_setRankEntry', {
    ...user('rebuild-mid'),
    topicType: 'score_Counter',
    topic: 'total',
    score: 50,
    position: 7,
    tieBreak: new Date('2026-01-02T00:00:00.000Z')
  })
  await trigger(app, 'score', 'score_setRankEntry', {
    ...user('rebuild-low'),
    topicType: 'score_Counter',
    topic: 'total',
    score: 5,
    position: 1,
    tieBreak: new Date('2026-01-03T00:00:00.000Z')
  })
  await trigger(app, 'score', 'rebuildRank', {
    topicType: 'score_Counter',
    topic: 'total'
  })
  const high = await getRank('rebuild-high')
  const mid = await getRank('rebuild-mid')
  const low = await getRank('rebuild-low')
  assert.equal(high.position, 1)
  assert.equal(mid.position, 2)
  assert.ok(low.position > mid.position)
})

test('second credit raises the person and shifts the passed one by 1', async () => {
  const first = await createCause('profile', 'jump-a')
  const second = await createCause('invite', 'jump-b')
  const extra = await createCause('invite', 'jump-a-invite')
  await record('jumper', 'scoreTest_ProfileUnlock', first)
  await record('leader', 'scoreTest_Invite', second)
  const beforeJumper = await getRank('jumper')
  const beforeLeader = await getRank('leader')
  assert.ok(beforeLeader.position < beforeJumper.position)
  await record('jumper', 'scoreTest_Invite', extra)
  const afterJumper = await getRank('jumper')
  const afterLeader = await getRank('leader')
  assert.equal(afterJumper.score, 40)
  assert.ok(afterJumper.position < afterLeader.position)
  assert.equal(afterLeader.position, beforeLeader.position + 1)
})

test('parallel recordScore on the same board leaves unique dense positions', async () => {
  const causes = await Promise.all([
    createCause('profile', 'par-1'),
    createCause('invite', 'par-2'),
    createCause('bonus', 'par-3')
  ])
  await Promise.all([
    record('par-a', 'scoreTest_ProfileUnlock', causes[0]),
    record('par-b', 'scoreTest_Invite', causes[1]),
    record('par-c', 'scoreTest_Bonus', causes[2])
  ])
  const a = await getRank('par-a')
  const b = await getRank('par-b')
  const c = await getRank('par-c')
  const scores = [a, b, c]
  const positions = scores.map(row => row.position).sort((x, y) => x - y)
  assert.equal(new Set(positions).size, 3)
  const byScore = [...scores].sort((x, y) => y.score - x.score || x.position - y.position)
  assert.ok(byScore[0].position < byScore[1].position)
  assert.ok(byScore[1].position < byScore[2].position)
})

test('profile counter is not ranked', async () => {
  const cause = await createCause('profile', 'profile-only')
  await record('profile-only', 'scoreTest_ProfileUnlock', cause)
  const profileRank = await getRank('profile-only', 'profile')
  assert.equal(profileRank, null)
  const profile = await getCounter('profile-only', 'profile')
  assert.equal(profile.score, 10)
})
