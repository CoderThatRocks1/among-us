import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeRoomCode } from '../src/network/peerManager.js'

test('join code normalization is case-insensitive and strips separators', () => {
  assert.equal(normalizeRoomCode('ab-c 12'), 'ABC12')
  assert.equal(normalizeRoomCode('xyz789'), 'XYZ789')
})

test('join codes are truncated to six characters before validation', () => {
  assert.equal(normalizeRoomCode('abc123-extra'), 'ABC123')
  assert.equal(normalizeRoomCode('12-?'), '12')
})
