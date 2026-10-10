import test from 'node:test'
import assert from 'node:assert/strict'
import { createLocalRoster, chooseBotVotes, updateBots } from '../src/network/botLogic.js'
import { normalizeRoomCode } from '../src/network/peerManager.js'

test('local roster starts with one player and four bots, with one impostor', () => {
  const roster = createLocalRoster('  Nova  ')
  assert.equal(roster.length, 5)
  assert.equal(roster[0].name, 'Nova')
  assert.equal(roster.filter((player) => player.isBot).length, 4)
  assert.equal(roster.filter((player) => player.role === 'Impostor').length, 1)
  assert.equal(roster[0].role, 'Crewmate')
})

test('bots follow their current waypoint and preserve their state machine fields', () => {
  const bot = { ...createLocalRoster()[1], x: 510, y: 330, waypointIndex: 0, routeIndex: 0 }
  const [updated] = updateBots([bot], 0.05)
  assert.notEqual(updated.x, bot.x)
  assert.notEqual(updated.y, bot.y)
  assert.equal(updated.id, bot.id)
  assert.equal(updated.botState, 'walking')
})

test('only living bots vote, and no bot votes for itself', () => {
  const roster = createLocalRoster('Nova').map((player, index) => ({ ...player, alive: index !== 2 }))
  const votes = chooseBotVotes(roster, roster[0].id)
  const aliveBots = roster.filter((player) => player.isBot && player.alive)
  assert.equal(Object.keys(votes).length, aliveBots.length)
  for (const bot of aliveBots) {
    assert.notEqual(votes[bot.id], bot.id)
    assert.ok(roster.some((player) => player.id === votes[bot.id] && player.alive))
  }
})

test('room code normalization removes punctuation and limits input to six characters', () => {
  assert.equal(normalizeRoomCode(' ab-12 c9 xyz '), 'AB12C9')
  assert.equal(normalizeRoomCode('!@#$'), '')
})
