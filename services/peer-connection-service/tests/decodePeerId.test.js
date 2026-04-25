import test from 'node:test'
import assert from 'node:assert/strict'
import { decodePeerId } from '../decodePeerId.js'

test('decodePeerId: four segments, channel without colon', () => {
  const r = decodePeerId('room_Room:chanId:sessA:inst1')
  assert.equal(r.channelType, 'room_Room')
  assert.equal(r.channel, 'chanId')
  assert.equal(r.peerSession, 'sessA')
  assert.equal(r.instance, 'inst1')
})

test('decodePeerId: channel contains colons', () => {
  const r = decodePeerId('t:a:b:c:d:e:f')
  assert.equal(r.channelType, 't')
  assert.equal(r.channel, 'a:b:c:d')
  assert.equal(r.peerSession, 'e')
  assert.equal(r.instance, 'f')
})

test('decodePeerId: rejects fewer than four segments', () => {
  assert.throws(() => decodePeerId('a:b:c'), /invalid peer id/)
})
