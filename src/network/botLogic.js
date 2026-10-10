const CREW_COLORS = ['#ec6958', '#42b9df', '#b6e36d', '#d39bee', '#f5aa52', '#69d4ba', '#f08ab4']

const ROUTES = [
  [{ x: 150, y: 165 }, { x: 535, y: 155 }, { x: 535, y: 500 }, { x: 150, y: 505 }],
  [{ x: 940, y: 155 }, { x: 535, y: 500 }, { x: 150, y: 505 }, { x: 940, y: 500 }],
  [{ x: 535, y: 500 }, { x: 150, y: 165 }, { x: 940, y: 155 }, { x: 535, y: 155 }],
  [{ x: 150, y: 505 }, { x: 940, y: 500 }, { x: 535, y: 155 }, { x: 940, y: 155 }],
]

export function createLocalRoster(playerName = 'Crewmate') {
  const cleanName = String(playerName || 'Crewmate').trim().slice(0, 18) || 'Crewmate'
  const players = [{
    id: 'local-player',
    name: cleanName,
    color: '#fb654f',
    role: 'Crewmate',
    isHost: true,
    isBot: false,
    ready: true,
  }]

  for (let index = 0; index < 4; index += 1) {
    const id = `bot-${index + 1}`
    players.push({
      id,
      name: ['Pip', 'Mochi', 'Orbit', 'Pixel'][index],
      color: CREW_COLORS[(index + 1) % CREW_COLORS.length],
      role: index === 2 ? 'Impostor' : 'Crewmate',
      isHost: false,
      isBot: true,
      ready: true,
      botState: 'walking',
      routeIndex: index % ROUTES.length,
      waypointIndex: 0,
      taskTimer: 0,
    })
  }

  return players
}

export function updateBots(players, deltaSeconds) {
  const delta = Math.min(Math.max(deltaSeconds, 0), 0.06)
  return players.map((player) => {
    if (!player.isBot || player.alive === false) return player

    let taskTimer = Math.max(0, (player.taskTimer || 0) - delta)
    let botState = player.botState || 'walking'
    let waypointIndex = player.waypointIndex || 0
    let x = player.x
    let y = player.y
    const route = ROUTES[player.routeIndex % ROUTES.length]

    if (botState === 'working') {
      if (taskTimer === 0) {
        botState = 'walking'
        waypointIndex = (waypointIndex + 1) % route.length
      }
      return { ...player, x, y, botState, taskTimer, waypointIndex }
    }

    const target = route[waypointIndex % route.length]
    const dx = target.x - x
    const dy = target.y - y
    const distance = Math.hypot(dx, dy)

    if (distance < 13) {
      botState = 'working'
      taskTimer = 2.2 + Math.random() * 2.1
      return { ...player, x: target.x, y: target.y, botState, taskTimer, waypointIndex }
    }

    const speed = player.role === 'Impostor' ? 66 : 54
    const step = Math.min(distance, speed * delta)
    x += (dx / distance) * step
    y += (dy / distance) * step
    return { ...player, x, y, botState, taskTimer, waypointIndex }
  })
}

export function chooseBotVotes(players, localPlayerId) {
  const alive = players.filter((player) => player.alive !== false)
  const votes = {}

  for (const voter of alive.filter((player) => player.isBot)) {
    const suspects = alive.filter((player) => player.id !== voter.id)
    if (!suspects.length) continue

    // Crewmates are a little more likely to notice the one impostor; the impostor
    // tries to blend in by choosing a random crewmate instead.
    let target
    if (voter.role === 'Impostor') {
      target = suspects.filter((player) => player.role !== 'Impostor')
        .sort(() => Math.random() - 0.5)[0]
    } else if (Math.random() < 0.56) {
      target = suspects.find((player) => player.role === 'Impostor')
    }
    if (!target) target = suspects[Math.floor(Math.random() * suspects.length)]
    votes[voter.id] = target.id
  }

  return votes
}
