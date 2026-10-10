import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, AudioLines, CircleHelp, Crosshair, Gamepad2, Headphones, Map as MapIcon, Pause, Radio, Signal, Sparkles, Volume2 } from 'lucide-react'
import EmergencyModal from './EmergencyModal.jsx'
import HUD from './HUD.jsx'
import { chooseBotVotes, updateBots } from '../network/botLogic.js'
import { CORRIDORS, MAP_HEIGHT, MAP_WIDTH, ROOMS, SPAWNS, TASKS, isWalkable } from '../game/map.js'

const PLAYER_COLORS = ['#fb654f', '#4bbfe2', '#b6d971', '#c991e8', '#f5ab57', '#64d7bb', '#ef8dad', '#e8d36a']
const STARFIELD = Array.from({ length: 68 }, (_, index) => ({
  x: (index * 193 + 61) % MAP_WIDTH,
  y: (index * 127 + 39) % MAP_HEIGHT,
  radius: index % 11 === 0 ? 1.5 : 0.7 + (index % 3) * 0.3,
  alpha: 0.12 + (index % 6) * 0.045,
}))

function roundedRect(ctx, x, y, width, height, radius = 9) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}

function drawFloorGrid(ctx, area, alpha = 0.12) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(area.x + 3, area.y + 3, area.w - 6, area.h - 6)
  ctx.clip()
  ctx.strokeStyle = `rgba(160, 199, 211, ${alpha})`
  ctx.lineWidth = 1
  for (let x = area.x + 19; x < area.x + area.w; x += 28) {
    ctx.beginPath()
    ctx.moveTo(x, area.y)
    ctx.lineTo(x, area.y + area.h)
    ctx.stroke()
  }
  for (let y = area.y + 19; y < area.y + area.h; y += 28) {
    ctx.beginPath()
    ctx.moveTo(area.x, y)
    ctx.lineTo(area.x + area.w, y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawConsole(ctx, x, y, width = 39) {
  roundedRect(ctx, x, y, width, 22, 5)
  ctx.fillStyle = '#142632'
  ctx.fill()
  ctx.strokeStyle = 'rgba(139, 204, 215, .27)'
  ctx.lineWidth = 1
  ctx.stroke()
  roundedRect(ctx, x + 5, y + 4, width - 10, 8, 2)
  ctx.fillStyle = '#203e49'
  ctx.fill()
  ctx.fillStyle = '#7be7d0'
  ctx.globalAlpha = 0.82
  ctx.beginPath()
  ctx.arc(x + width - 7, y + 16, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawRoom(ctx, room) {
  const gradient = ctx.createLinearGradient(room.x, room.y, room.x + room.w, room.y + room.h)
  gradient.addColorStop(0, '#20303c')
  gradient.addColorStop(0.52, '#172632')
  gradient.addColorStop(1, '#13222d')
  roundedRect(ctx, room.x, room.y, room.w, room.h, 14)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = '#526875'
  ctx.lineWidth = 3
  ctx.stroke()
  roundedRect(ctx, room.x + 6, room.y + 6, room.w - 12, room.h - 12, 10)
  ctx.strokeStyle = 'rgba(139, 177, 191, .2)'
  ctx.lineWidth = 1
  ctx.stroke()
  drawFloorGrid(ctx, room, 0.075)

  const labelWidth = Math.max(64, room.name.length * 7.2)
  roundedRect(ctx, room.x + 13, room.y + 13, labelWidth, 20, 6)
  ctx.fillStyle = 'rgba(5, 13, 20, .58)'
  ctx.fill()
  ctx.fillStyle = '#8ca5b0'
  ctx.font = '600 9px "DM Mono", monospace'
  ctx.textBaseline = 'middle'
  ctx.fillText(room.name, room.x + 22, room.y + 23)

  drawConsole(ctx, room.x + 16, room.y + room.h - 39, 37)
  drawConsole(ctx, room.x + room.w - 55, room.y + 35, 39)

  ctx.strokeStyle = 'rgba(176, 208, 219, .14)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(room.x + 20, room.y + room.h - 52)
  ctx.lineTo(room.x + room.w - 19, room.y + room.h - 52)
  ctx.stroke()
}

function drawShipMap(ctx, completedTaskIds, time) {
  const background = ctx.createLinearGradient(0, 0, MAP_WIDTH, MAP_HEIGHT)
  background.addColorStop(0, '#111e2b')
  background.addColorStop(0.5, '#0b1622')
  background.addColorStop(1, '#101b28')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)

  for (const star of STARFIELD) {
    ctx.fillStyle = `rgba(154, 206, 222, ${star.alpha})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
    ctx.fill()
  }

  roundedRect(ctx, 21, 49, MAP_WIDTH - 42, MAP_HEIGHT - 75, 24)
  ctx.fillStyle = '#0a141e'
  ctx.fill()
  ctx.strokeStyle = '#354d5b'
  ctx.lineWidth = 3
  ctx.stroke()

  for (const corridor of CORRIDORS) {
    roundedRect(ctx, corridor.x, corridor.y, corridor.w, corridor.h, 10)
    ctx.fillStyle = '#1b2b37'
    ctx.fill()
    ctx.strokeStyle = '#4a6270'
    ctx.lineWidth = 2
    ctx.stroke()
    roundedRect(ctx, corridor.x + 5, corridor.y + 5, corridor.w - 10, corridor.h - 10, 7)
    ctx.strokeStyle = 'rgba(144, 178, 188, .14)'
    ctx.lineWidth = 1
    ctx.stroke()
    drawFloorGrid(ctx, corridor, 0.055)
  }

  for (const room of ROOMS) drawRoom(ctx, room)

  // Airlock lights and subtle directional floor marks give the corridors a little life.
  const pulse = 0.35 + (Math.sin(time / 400) + 1) * 0.16
  for (const [x, y] of [[276, 174], [827, 174], [276, 503], [827, 503], [321, 284], [776, 284]]) {
    ctx.fillStyle = `rgba(105, 226, 201, ${pulse})`
    ctx.beginPath()
    ctx.arc(x, y, 2.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(105, 226, 201, .24)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, 5.2, 0, Math.PI * 2)
    ctx.stroke()
  }

  for (const task of TASKS) {
    const completed = completedTaskIds.includes(task.id)
    const glowRadius = 14 + (Math.sin(time / 260 + task.x) + 1) * 3
    ctx.save()
    ctx.globalAlpha = completed ? 0.35 : 0.28
    ctx.fillStyle = completed ? '#75e2bc' : task.color
    ctx.beginPath()
    ctx.arc(task.x, task.y, glowRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = completed ? '#75e2bc' : task.color
    ctx.beginPath()
    ctx.arc(task.x, task.y, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = completed ? '#a1f1d5' : 'rgba(255,255,255,.82)'
    ctx.lineWidth = 1.3
    ctx.beginPath()
    ctx.arc(task.x, task.y, 8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.font = '500 8px "DM Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = completed ? '#83b7a5' : '#91a8b1'
    ctx.fillText(completed ? 'DONE' : 'TASK', task.x, task.y + 22)
    ctx.textAlign = 'left'
  }

  // Crosshatch accents keep the room edges crisp without making the map noisy.
  ctx.fillStyle = 'rgba(115, 153, 170, .44)'
  for (const [x, y, rotation] of [[39, 321, 0], [1061, 321, 0], [552, 66, Math.PI / 2], [552, 614, Math.PI / 2]]) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    for (let index = 0; index < 3; index += 1) ctx.fillRect(index * 5 - 5, -3, 2, 7)
    ctx.restore()
  }
}

function drawCrewmate(ctx, player, isLocal, time) {
  const x = player.x ?? MAP_WIDTH / 2
  const y = player.y ?? MAP_HEIGHT / 2
  ctx.save()
  ctx.translate(x, y)

  if (isLocal) {
    const ringAlpha = 0.26 + (Math.sin(time / 220) + 1) * 0.12
    ctx.strokeStyle = `rgba(255, 225, 147, ${ringAlpha})`
    ctx.lineWidth = 1.3
    ctx.beginPath()
    ctx.arc(0, 1, 24 + Math.sin(time / 250) * 1.2, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(0, 0, 0, .45)'
  ctx.beginPath()
  ctx.ellipse(0, 16, 17, 5.5, 0, 0, Math.PI * 2)
  ctx.fill()
  if (player.alive === false) {
    ctx.rotate(-Math.PI / 2)
    ctx.globalAlpha = 0.52
  }

  roundedRect(ctx, -19, -9, 13, 26, 5)
  ctx.fillStyle = player.color || '#66cddd'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.2)'
  ctx.lineWidth = 1
  ctx.stroke()

  roundedRect(ctx, -13, -20, 27, 39, 12)
  ctx.fillStyle = player.color || '#66cddd'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.48)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  roundedRect(ctx, -9, 14, 10, 11, 4)
  ctx.fillStyle = player.color || '#66cddd'
  ctx.fill()
  roundedRect(ctx, 4, 14, 10, 11, 4)
  ctx.fill()

  const visor = ctx.createLinearGradient(-2, -16, 13, -3)
  visor.addColorStop(0, '#e4fbff')
  visor.addColorStop(0.42, '#96e4f3')
  visor.addColorStop(1, '#397c9c')
  roundedRect(ctx, -1, -15, 19, 14, 6)
  ctx.fillStyle = visor
  ctx.fill()
  ctx.strokeStyle = 'rgba(235, 253, 255, .9)'
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,.7)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(3, -12)
  ctx.lineTo(9, -12)
  ctx.stroke()

  if (player.alive === false) {
    ctx.rotate(Math.PI / 2)
    ctx.fillStyle = '#f5b3a0'
    ctx.font = '700 7px "DM Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('OUT', 0, 2)
  }

  if (player.botState === 'working' && player.alive !== false) {
    roundedRect(ctx, 12, -31, 25, 12, 4)
    ctx.fillStyle = 'rgba(6, 17, 24, .86)'
    ctx.fill()
    ctx.fillStyle = '#82e5c6'
    ctx.font = '700 7px "DM Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('TASK', 24.5, -25)
  }

  const label = player.name || 'Crewmate'
  ctx.font = isLocal ? '700 10px "Space Grotesk", sans-serif' : '600 10px "Space Grotesk", sans-serif'
  const labelWidth = ctx.measureText(label).width + (isLocal ? 19 : 14)
  roundedRect(ctx, -labelWidth / 2, 28, labelWidth, 17, 5)
  ctx.fillStyle = isLocal ? 'rgba(238, 187, 108, .94)' : 'rgba(5, 13, 20, .82)'
  ctx.fill()
  ctx.strokeStyle = isLocal ? 'rgba(255, 240, 199, .82)' : 'rgba(143, 177, 190, .27)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = isLocal ? '#271b15' : '#d9e3e5'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, isLocal ? 1 : 0, 36.5)
  if (isLocal) {
    ctx.fillStyle = '#7a4c28'
    ctx.beginPath()
    ctx.arc(-labelWidth / 2 + 8, 36.5, 2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawBody(ctx, body, time) {
  ctx.save()
  ctx.translate(body.x, body.y)
  ctx.rotate(-0.2)
  ctx.fillStyle = 'rgba(245, 82, 70, .2)'
  ctx.beginPath()
  ctx.ellipse(0, 2, 26 + Math.sin(time / 260) * 2, 15, 0, 0, Math.PI * 2)
  ctx.fill()
  roundedRect(ctx, -19, -8, 12, 21, 5)
  ctx.fillStyle = body.color || '#bd5865'
  ctx.fill()
  roundedRect(ctx, -13, -13, 28, 20, 10)
  ctx.fillStyle = body.color || '#bd5865'
  ctx.fill()
  ctx.strokeStyle = '#ffc1b1'
  ctx.lineWidth = 1
  ctx.stroke()
  roundedRect(ctx, -1, -10, 16, 10, 5)
  ctx.fillStyle = '#72bdd4'
  ctx.fill()
  ctx.restore()
}

function drawSabotageFog(ctx, player) {
  ctx.fillStyle = 'rgba(3, 6, 12, .76)'
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)
  if (!player) return
  const light = ctx.createRadialGradient(player.x, player.y, 26, player.x, player.y, 200)
  light.addColorStop(0, 'rgba(18, 29, 42, .14)')
  light.addColorStop(0.58, 'rgba(7, 13, 22, .42)')
  light.addColorStop(1, 'rgba(4, 8, 14, .96)')
  ctx.fillStyle = light
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)
  const beam = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, 80)
  beam.addColorStop(0, 'rgba(195, 219, 226, .13)')
  beam.addColorStop(1, 'rgba(195, 219, 226, 0)')
  ctx.fillStyle = beam
  ctx.fillRect(player.x - 80, player.y - 80, 160, 160)
}

function drawWorld(ctx, world, localPlayerId, now) {
  drawShipMap(ctx, world.completedTaskIds, now)
  for (const body of world.bodies) drawBody(ctx, body, now)
  const players = [...world.players].sort((a, b) => (a.y || 0) - (b.y || 0))
  for (const player of players) drawCrewmate(ctx, player, player.id === localPlayerId, now)

  const localPlayer = world.players.find((player) => player.id === localPlayerId)
  if (world.sabotageUntil > Date.now()) drawSabotageFog(ctx, localPlayer)
}

function clockLabel(startedAt, now) {
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function systemChat(text) {
  return { id: `sys-${Date.now()}-${Math.random()}`, text, system: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
}

function chatEntry(player, text) {
  return { id: `msg-${Date.now()}-${Math.random()}`, name: player?.name || 'Crewmate', color: player?.color || '#85dbe1', text, system: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
}

export default function GameCanvas({ mode, initialPlayers, localPlayerId, session, roomCode, networkStatus, onExit, networkPacketRef }) {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const worldRef = useRef(null)
  const keysRef = useRef(new Set())
  const actionRef = useRef({})
  const announceTimerRef = useRef(null)
  const botVoteTimerRef = useRef(null)
  const resolveTimerRef = useRef(null)
  const finalizedRef = useRef(false)
  const meetingRef = useRef(null)
  const votesRef = useRef({})
  const sessionRef = useRef(session)
  sessionRef.current = session

  const [hudSnapshot, setHudSnapshot] = useState({ players: [], localPlayer: null, completedTasks: 0, nearestTask: null, canUse: false, hasBody: false })
  const [meeting, setMeeting] = useState(null)
  const [votes, setVotes] = useState({})
  const [chatMessages, setChatMessages] = useState([])
  const [meetingResult, setMeetingResult] = useState(null)
  const [notice, setNotice] = useState('')
  const [clock, setClock] = useState('00:00')
  const [networkLabel, setNetworkLabel] = useState('LINK STABLE')

  function setActiveMeeting(value) {
    meetingRef.current = value
    setMeeting(value)
  }

  function changeVotes(updater) {
    setVotes((previous) => {
      const next = typeof updater === 'function' ? updater(previous) : updater
      votesRef.current = next
      return next
    })
  }

  function announce(message) {
    setNotice(message)
    window.clearTimeout(announceTimerRef.current)
    announceTimerRef.current = window.setTimeout(() => setNotice(''), 3600)
  }

  function addSystemMessage(text) {
    setChatMessages((current) => [...current, systemChat(text)].slice(-50))
  }

  function addChatMessage(entry) {
    setChatMessages((current) => [...current, entry].slice(-50))
  }

  function openMeeting(reason = 'emergency', callerId = localPlayerId, fromNetwork = false) {
    if (meetingRef.current) return
    const endsAt = Date.now() + 30_000
    const nextMeeting = { caller: callerId, reason, endsAt }
    finalizedRef.current = false
    votesRef.current = {}
    setActiveMeeting(nextMeeting)
    changeVotes({})
    setMeetingResult(null)
    const callerName = worldRef.current?.players.find((player) => player.id === callerId)?.name || 'A crewmate'
    setChatMessages([systemChat(`${callerName} called an emergency meeting.`)])
    if (mode === 'bots') {
      window.clearTimeout(botVoteTimerRef.current)
      botVoteTimerRef.current = window.setTimeout(() => {
        const botVotes = chooseBotVotes(worldRef.current?.players || [], localPlayerId)
        changeVotes((current) => ({ ...current, ...botVotes }))
      }, 1200 + Math.random() * 1000)
    }
    if (mode === 'host' && !fromNetwork) {
      sessionRef.current?.broadcast({ type: 'meeting-open', callerId, reason, endsAt })
    }
  }

  function closeMeeting(fromNetwork = false) {
    if (!meetingRef.current) return
    if (!fromNetwork) {
      if (mode === 'host') sessionRef.current?.broadcast({ type: 'meeting-close' })
      if (mode === 'guest') sessionRef.current?.send({ type: 'meeting-close' })
    }
    window.clearTimeout(resolveTimerRef.current)
    window.clearTimeout(botVoteTimerRef.current)
    finalizedRef.current = false
    setActiveMeeting(null)
    setMeetingResult(null)
    changeVotes({})
    setChatMessages([])
  }

  function finalizeMeeting() {
    if (!meetingRef.current || finalizedRef.current || mode === 'guest') return
    finalizedRef.current = true
    const tally = {}
    Object.values(votesRef.current).forEach((targetId) => {
      tally[targetId] = (tally[targetId] || 0) + 1
    })
    const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1])
    const tied = ranked.length > 1 && ranked[0][1] === ranked[1][1]
    const ejectedId = ranked.length === 0 || tied || ranked[0][0] === 'skip' ? 'skip' : ranked[0][0]
    const result = { ejectedId, tally }
    setMeetingResult(result)
    const world = worldRef.current
    if (world && ejectedId !== 'skip') {
      world.players = world.players.map((player) => player.id === ejectedId ? { ...player, alive: false } : player)
    }
    if (mode === 'host') sessionRef.current?.broadcast({ type: 'meeting-result', result })
  }

  function handleVote(targetId) {
    if (!meetingRef.current || meetingResult || votesRef.current[localPlayerId]) return
    const next = { ...votesRef.current, [localPlayerId]: targetId }
    votesRef.current = next
    setVotes(next)
    if (mode === 'guest') sessionRef.current?.send({ type: 'meeting-vote', targetId })
  }

  function sendChat(text) {
    const player = worldRef.current?.players.find((item) => item.id === localPlayerId)
    const entry = chatEntry(player, text)
    addChatMessage(entry)
    const packet = { type: 'meeting-chat', entry }
    if (mode === 'host') sessionRef.current?.broadcast(packet)
    if (mode === 'guest') sessionRef.current?.send(packet)
  }

  function completeTask() {
    const world = worldRef.current
    if (!world) return
    const player = world.players.find((item) => item.id === localPlayerId)
    if (!player || player.alive === false) return announce('You cannot use a console while out of action.')
    if (player.role === 'Impostor') return announce('No tasks for you. Stay convincing.')

    const playerCompletedTaskIds = player.completedTaskIds || []
    const target = TASKS
      .filter((task) => (player.assignedTaskIds || TASKS.slice(0, 3).map((item) => item.id)).includes(task.id) && !playerCompletedTaskIds.includes(task.id))
      .map((task) => ({ ...task, distance: Math.hypot(task.x - player.x, task.y - player.y) }))
      .filter((task) => task.distance < 88)
      .sort((a, b) => a.distance - b.distance)[0]
    if (!target) return announce('Move near one of your glowing task stations to use it.')
    if ((player.tasksDone || 0) >= 3) return announce('All of your assigned tasks are complete.')

    const completedTaskIds = [...playerCompletedTaskIds, target.id]
    const tasksDone = Math.min(3, (player.tasksDone || 0) + 1)
    world.completedTaskIds = [...new Set([...world.completedTaskIds, target.id])]
    world.players = world.players.map((item) => item.id === localPlayerId ? { ...item, tasksDone, completedTaskIds } : item)
    announce(`Task complete: ${target.label}. Good work, crew.`)
    if (mode === 'guest') sessionRef.current?.send({ type: 'player-update', x: player.x, y: player.y, tasksDone, completedTaskIds })
  }

  function callMeeting() {
    const player = worldRef.current?.players.find((item) => item.id === localPlayerId)
    if (!player || player.alive === false) return announce('You cannot call a meeting while out of action.')
    if (mode === 'guest') sessionRef.current?.send({ type: 'meeting-call', callerId: localPlayerId, reason: 'emergency' })
    else openMeeting('emergency', localPlayerId)
  }

  function reportBody() {
    const world = worldRef.current
    const player = world?.players.find((item) => item.id === localPlayerId)
    if (!world || !player) return
    const index = world.bodies.findIndex((body) => Math.hypot(body.x - player.x, body.y - player.y) < 82)
    if (index < 0) return announce('No body in range. Keep searching.')
    world.bodies.splice(index, 1)
    if (mode === 'guest') sessionRef.current?.send({ type: 'body-report', reporterId: localPlayerId })
    else openMeeting('body report', localPlayerId)
  }

  function sabotage() {
    const world = worldRef.current
    const player = world?.players.find((item) => item.id === localPlayerId)
    if (!player || player.role !== 'Impostor') return announce('Only the impostor can sabotage the ship.')
    world.sabotageUntil = Date.now() + 8500
    announce('Lights sabotaged. Keep moving while the crew scrambles.')
    const packet = { type: 'sabotage' }
    if (mode === 'host') sessionRef.current?.broadcast(packet)
    if (mode === 'guest') sessionRef.current?.send(packet)
  }

  function handleNetworkPacket(packet, from) {
    const world = worldRef.current
    if (!world || !packet) return

    if (mode === 'host' && packet.type === 'player-update') {
      const player = world.players.find((item) => item.id === from)
      if (!player || player.alive === false) return
      if (Number.isFinite(packet.x) && Number.isFinite(packet.y) && isWalkable(packet.x, packet.y, 4)) {
        world.players = world.players.map((item) => item.id === from ? {
          ...item,
          x: packet.x,
          y: packet.y,
          tasksDone: Math.max(0, Math.min(3, Number(packet.tasksDone) || item.tasksDone || 0)),
          completedTaskIds: Array.isArray(packet.completedTaskIds) ? packet.completedTaskIds.filter((id) => TASKS.some((task) => task.id === id)) : item.completedTaskIds,
        } : item)
        if (Array.isArray(packet.completedTaskIds)) {
          world.completedTaskIds = [...new Set([...world.completedTaskIds, ...packet.completedTaskIds.filter((id) => TASKS.some((task) => task.id === id))])]
        }
      }
      return
    }

    if (mode === 'host' && packet.type === 'player-left') {
      world.players = world.players.filter((player) => player.id !== packet.id)
      return
    }

    if (mode === 'guest' && packet.type === 'world-state') {
      const localPlayer = world.players.find((player) => player.id === localPlayerId)
      world.players = packet.players.map((player) => player.id === localPlayerId && localPlayer ? { ...player, x: localPlayer.x, y: localPlayer.y } : player)
      world.completedTaskIds = packet.completedTaskIds || []
      world.sabotageUntil = packet.sabotageUntil || 0
      return
    }

    if (packet.type === 'meeting-call' && mode === 'host') {
      openMeeting(packet.reason || 'emergency', from)
      return
    }

    if (packet.type === 'meeting-open' && mode === 'guest') {
      if (meetingRef.current) return
      const endsAt = packet.endsAt || Date.now() + 30_000
      const nextMeeting = { caller: packet.callerId, reason: packet.reason, endsAt }
      finalizedRef.current = false
      votesRef.current = {}
      setActiveMeeting(nextMeeting)
      changeVotes({})
      setMeetingResult(null)
      const callerName = world.players.find((player) => player.id === packet.callerId)?.name || 'A crewmate'
      setChatMessages([systemChat(`${callerName} called an emergency meeting.`)])
      return
    }

    if (packet.type === 'meeting-chat') {
      if (packet.entry) addChatMessage(packet.entry)
      if (mode === 'host') sessionRef.current?.broadcast(packet, from)
      return
    }

    if (packet.type === 'meeting-vote' && mode === 'host') {
      if (!world.players.some((player) => player.id === from && player.alive !== false)) return
      changeVotes((current) => ({ ...current, [from]: packet.targetId }))
      return
    }

    if (packet.type === 'vote-update' && mode === 'guest') {
      votesRef.current = packet.votes || {}
      setVotes(packet.votes || {})
      return
    }

    if (packet.type === 'meeting-result' && mode === 'guest') {
      finalizedRef.current = true
      setMeetingResult(packet.result)
      const ejectedId = packet.result?.ejectedId
      if (ejectedId && ejectedId !== 'skip') world.players = world.players.map((player) => player.id === ejectedId ? { ...player, alive: false } : player)
      return
    }

    if (packet.type === 'meeting-close') {
      if (mode === 'host') sessionRef.current?.broadcast(packet, from)
      closeMeeting(true)
      return
    }

    if (packet.type === 'sabotage') {
      if (mode === 'host') {
        const sender = world.players.find((player) => player.id === from)
        if (sender?.role !== 'Impostor') return
        sessionRef.current?.broadcast(packet, from)
      }
      world.sabotageUntil = Date.now() + 8500
      announce('Lights sabotaged. Watch who disappears into the dark.')
      return
    }

    if (packet.type === 'body-report' && mode === 'host') {
      openMeeting('body report', from)
    }
  }

  // The app owns the PeerJS event listener; expose the current game handler to it.
  useEffect(() => {
    if (networkPacketRef) networkPacketRef.current = handleNetworkPacket
    return () => {
      if (networkPacketRef?.current === handleNetworkPacket) networkPacketRef.current = null
    }
  }, [handleNetworkPacket, networkPacketRef])

  actionRef.current = {
    use: completeTask,
    meeting: callMeeting,
    report: reportBody,
    sabotage,
  }

  useEffect(() => {
    const spawnPlayers = initialPlayers.map((player, index) => {
      const spawn = SPAWNS[index % SPAWNS.length]
      return {
        ...player,
        color: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length],
        x: Number.isFinite(player.x) ? player.x : spawn.x,
        y: Number.isFinite(player.y) ? player.y : spawn.y,
        tasksDone: player.tasksDone || 0,
        assignedTaskIds: player.assignedTaskIds || Array.from({ length: 3 }, (_, taskIndex) => TASKS[(index * 2 + taskIndex) % TASKS.length].id),
        completedTaskIds: player.completedTaskIds || [],
        alive: player.alive !== false,
      }
    })
    const localIsPresent = spawnPlayers.some((player) => player.id === localPlayerId)
    if (!localIsPresent) spawnPlayers.unshift({ id: localPlayerId, name: 'Crewmate', color: PLAYER_COLORS[0], role: 'Crewmate', x: SPAWNS[0].x, y: SPAWNS[0].y, alive: true, tasksDone: 0, assignedTaskIds: TASKS.slice(0, 3).map((task) => task.id), completedTaskIds: [] })
    worldRef.current = {
      players: spawnPlayers,
      completedTaskIds: [],
      bodies: [],
      sabotageUntil: 0,
      startedAt: performance.now(),
      lastHudAt: 0,
      lastSyncAt: 0,
      nextIncidentAt: Date.now() + 39_000,
    }
    setHudSnapshot({ players: spawnPlayers, localPlayer: spawnPlayers.find((player) => player.id === localPlayerId), completedTasks: 0, nearestTask: null, canUse: false, hasBody: false })

    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage) return undefined
    const context = canvas.getContext('2d')
    let animationFrame
    let lastTime = performance.now()
    let canvasWidth = 0
    let canvasHeight = 0
    let pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

    function resizeCanvas() {
      const bounds = stage.getBoundingClientRect()
      canvasWidth = bounds.width
      canvasHeight = bounds.height
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(canvasWidth * pixelRatio))
      canvas.height = Math.max(1, Math.floor(canvasHeight * pixelRatio))
      canvas.style.width = `${canvasWidth}px`
      canvas.style.height = `${canvasHeight}px`
    }

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(stage)
    resizeCanvas()

    function updateHud(world, now) {
      const localPlayer = world.players.find((player) => player.id === localPlayerId)
      if (!localPlayer) return
      const localTaskIds = localPlayer.assignedTaskIds || TASKS.slice(0, 3).map((task) => task.id)
      const localCompletedTaskIds = localPlayer.completedTaskIds || []
      const nearbyTask = TASKS
        .filter((task) => localTaskIds.includes(task.id) && !localCompletedTaskIds.includes(task.id))
        .map((task) => ({ ...task, distance: Math.hypot(task.x - localPlayer.x, task.y - localPlayer.y) }))
        .filter((task) => task.distance < 92)
        .sort((a, b) => a.distance - b.distance)[0] || null
      const hasBody = world.bodies.some((body) => Math.hypot(body.x - localPlayer.x, body.y - localPlayer.y) < 82)
      setHudSnapshot({
        players: world.players,
        localPlayer,
        completedTasks: localPlayer.tasksDone || 0,
        nearestTask: nearbyTask,
        canUse: Boolean(nearbyTask) && localPlayer.role !== 'Impostor' && localPlayer.alive !== false && (localPlayer.tasksDone || 0) < 3,
        hasBody,
      })
      setClock(clockLabel(world.startedAt, now))
    }

    function frame(now) {
      animationFrame = requestAnimationFrame(frame)
      const world = worldRef.current
      if (!world) return
      const delta = Math.min((now - lastTime) / 1000, 0.06)
      lastTime = now
      const isMeetingOpen = Boolean(meetingRef.current)

      if (!isMeetingOpen) {
        if (mode === 'bots') world.players = updateBots(world.players, delta)
        const localPlayer = world.players.find((player) => player.id === localPlayerId)
        if (localPlayer && localPlayer.alive !== false) {
          let dx = 0
          let dy = 0
          const keys = keysRef.current
          if (keys.has('w') || keys.has('arrowup')) dy -= 1
          if (keys.has('s') || keys.has('arrowdown')) dy += 1
          if (keys.has('a') || keys.has('arrowleft')) dx -= 1
          if (keys.has('d') || keys.has('arrowright')) dx += 1
          const magnitude = Math.hypot(dx, dy) || 1
          dx = (dx / magnitude) * 188 * delta
          dy = (dy / magnitude) * 188 * delta
          const nextX = Math.max(35, Math.min(MAP_WIDTH - 35, localPlayer.x + dx))
          const nextY = Math.max(58, Math.min(MAP_HEIGHT - 37, localPlayer.y + dy))
          let x = localPlayer.x
          let y = localPlayer.y
          if (isWalkable(nextX, nextY, 12)) {
            x = nextX
            y = nextY
          } else {
            if (isWalkable(nextX, y, 12)) x = nextX
            if (isWalkable(x, nextY, 12)) y = nextY
          }
          if (x !== localPlayer.x || y !== localPlayer.y) {
            world.players = world.players.map((player) => player.id === localPlayerId ? { ...player, x, y } : player)
          }
        }

        if (mode === 'bots' && Date.now() >= world.nextIncidentAt && !world.bodies.length) {
          const impostor = world.players.find((player) => player.isBot && player.role === 'Impostor' && player.alive !== false)
          const target = world.players.filter((player) => player.isBot && player.role !== 'Impostor' && player.alive !== false).sort(() => Math.random() - 0.5)[0]
          if (impostor && target) {
            world.players = world.players.map((player) => player.id === target.id ? { ...player, alive: false } : player)
            world.bodies.push({ id: `body-${now}`, x: target.x, y: target.y, color: target.color, playerId: target.id })
          }
          world.nextIncidentAt = now + 35_000
        }
      }

      if (context && canvasWidth && canvasHeight) {
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
        context.clearRect(0, 0, canvasWidth, canvasHeight)
        context.scale(canvasWidth / MAP_WIDTH, canvasHeight / MAP_HEIGHT)
        drawWorld(context, world, localPlayerId, now)
      }

      if (mode === 'host' && now - world.lastSyncAt >= 50) {
        world.lastSyncAt = now
        sessionRef.current?.broadcast({
          type: 'world-state',
          players: world.players,
          completedTaskIds: world.completedTaskIds,
          sabotageUntil: world.sabotageUntil,
        })
      } else if (mode === 'guest' && now - world.lastSyncAt >= 50) {
        world.lastSyncAt = now
        const localPlayer = world.players.find((player) => player.id === localPlayerId)
        if (localPlayer) sessionRef.current?.send({ type: 'player-update', x: localPlayer.x, y: localPlayer.y, tasksDone: localPlayer.tasksDone || 0, completedTaskIds: world.completedTaskIds })
      }

      if (now - world.lastHudAt >= 220) {
        world.lastHudAt = now
        updateHud(world, now)
      }
    }

    animationFrame = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.clearTimeout(announceTimerRef.current)
      window.clearTimeout(botVoteTimerRef.current)
      window.clearTimeout(resolveTimerRef.current)
    }
  }, [initialPlayers, localPlayerId, mode])

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target
      const tagName = target?.tagName?.toLowerCase()
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) return
      const key = event.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault()
        keysRef.current.add(key)
      }
      if (event.repeat) return
      if (key === 'e') actionRef.current.use?.()
      if (key === 'r') actionRef.current.report?.()
      if (key === 'q') actionRef.current.sabotage?.()
      if (key === ' ' || key === 'spacebar') {
        event.preventDefault()
        actionRef.current.meeting?.()
      }
    }
    const onKeyUp = (event) => keysRef.current.delete(event.key.toLowerCase())
    const onBlur = () => keysRef.current.clear()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useEffect(() => {
    if (mode === 'guest' || !meeting || meetingResult) return undefined
    const aliveCount = worldRef.current?.players.filter((player) => player.alive !== false).length || 0
    const votedCount = Object.keys(votes).filter((id) => worldRef.current?.players.some((player) => player.id === id && player.alive !== false)).length
    if (aliveCount > 0 && votedCount >= aliveCount) {
      resolveTimerRef.current = window.setTimeout(finalizeMeeting, 850)
      return () => window.clearTimeout(resolveTimerRef.current)
    }
    return undefined
  }, [mode, meeting, votes, meetingResult])

  useEffect(() => {
    if (!meeting || meetingResult || mode === 'guest') return undefined
    const delay = Math.max(0, meeting.endsAt - Date.now())
    resolveTimerRef.current = window.setTimeout(finalizeMeeting, delay)
    return () => window.clearTimeout(resolveTimerRef.current)
  }, [meeting, meetingResult, mode, votes])

  useEffect(() => {
    if (mode !== 'host' || !meeting) return
    sessionRef.current?.broadcast({ type: 'vote-update', votes })
  }, [mode, meeting, votes])

  useEffect(() => {
    const status = String(networkStatus || '').toLowerCase()
    const interrupted = /lost|interrupt|closed|failed|disconnect|could not/.test(status)
    setNetworkLabel(mode === 'bots' || !interrupted ? 'LINK STABLE' : 'LINK INTERRUPTED')
  }, [mode, networkStatus])

  useEffect(() => () => {
    if (networkPacketRef?.current) networkPacketRef.current = null
    window.clearTimeout(announceTimerRef.current)
    window.clearTimeout(botVoteTimerRef.current)
    window.clearTimeout(resolveTimerRef.current)
  }, [networkPacketRef])

  const localPlayer = hudSnapshot.localPlayer
  const nearbyTask = hudSnapshot.nearestTask
  const stageStatus = mode === 'bots' ? 'BOT SIMULATION' : mode === 'host' ? `ROOM ${roomCode || session?.roomCode || ''}` : `JOINED ${roomCode || session?.roomCode || ''}`

  return (
    <main className="game-shell">
      <header className="game-topbar">
        <button className="game-brand" onClick={onExit} aria-label="Return to menu"><span className="brand-mark"><span /><span /><span /></span><span>ORBITAL<span> / </span>SUSPECTS</span></button>
        <div className="game-breadcrumb"><span>FLIGHT DECK</span><b>/</b><span>STATION N-07</span><i /></div>
        <div className="game-top-right"><span className="connection-pill"><span className="live-pulse" /> {networkLabel}</span><span className="stage-tag"><Radio size={12} /> {stageStatus}</span><button className="game-exit" onClick={onExit}><ArrowLeft size={15} /><span>EXIT GAME</span></button></div>
      </header>

      <div className="game-content">
        <section className="game-stage-column">
          <div className="game-stage-heading"><div><span className="stage-overline"><MapIcon size={12} /> NAVIGATION CHART // SECTOR 07</span><h1>Station <span>N-07</span></h1></div><div className="stage-live"><span /> LIVE FEED <b>●</b></div></div>
          <div className="canvas-frame">
            <div className="canvas-frame-top"><span><span className="frame-dot" /> STATION MAP <i>·</i> LIVE RENDER</span><span>COORD <b>07 : 14 : {clock.replace(':', ' : ')}</b></span></div>
            <div className="canvas-stage" ref={stageRef}><canvas ref={canvasRef} role="img" aria-label="Top-down view of Station N-07 and the crew" />
              <div className="canvas-map-tag"><span className="mini-scan"><Crosshair size={13} /></span><span><b>DEEP SPACE</b><small>SECTOR 07 / DECK A</small></span></div>
              <div className="canvas-coordinate">X 04.17.22<br />Y 83.06.09</div>
              <div className="canvas-compass">N<span>↑</span></div>
              <div className="canvas-help"><span><span className="keyboard-chip">W</span><span className="keyboard-chip">A</span><span className="keyboard-chip">S</span><span className="keyboard-chip">D</span> MOVE</span><i /><span><span className="keyboard-chip">E</span> USE STATION</span></div>
            </div>
            <div className="canvas-frame-bottom"><span><span className="bottom-led" /> SYSTEM MAP ONLINE</span><span><span className="bottom-key">WASD</span> MOVE <i /> <span className="bottom-key">E</span> TASK <i /> <span className="bottom-key">SPACE</span> MEETING</span><span className="frame-footer-right"><Sparkles size={12} /> {mode === 'bots' ? 'LOCAL INSTANCE' : 'PEER LINK ACTIVE'}</span></div>
          </div>
          <div className="game-tip"><CircleHelp size={15} /><span>{localPlayer?.role === 'Impostor' ? 'Blend in. Your actions are the only thing that can give you away.' : 'Stay on the move, finish your tasks, and trust your instincts.'}</span><button onClick={() => announce('WASD to move · E to use stations · Space to call a meeting.')}><span>CONTROLS</span><ArrowUpRight size={13} /></button></div>
        </section>

        <HUD localPlayer={localPlayer} players={hudSnapshot.players} completedTasks={hudSnapshot.completedTasks} taskCount={3} nearestTask={nearbyTask} hasBody={hudSnapshot.hasBody} canUse={hudSnapshot.canUse} notice={notice} mode={mode} onUse={completeTask} onReport={reportBody} onMeeting={callMeeting} onSabotage={sabotage} clock={clock} />
      </div>

      <footer className="game-footer"><span>ORBITAL SUSPECTS <i>·</i> PROTOTYPE</span><span><span className="footer-pulse" /> ZERO TRUST ENVIRONMENT</span><span>VERSION 01.04 <i>·</i> BROWSER BUILD</span></footer>

      {meeting && <EmergencyModal players={hudSnapshot.players} localPlayerId={localPlayerId} caller={meeting.caller} votes={votes} chatMessages={chatMessages} result={meetingResult} endsAt={meeting.endsAt} onVote={handleVote} onSendChat={sendChat} onClose={() => closeMeeting(false)} />}
      <div className="game-toast" aria-live="polite">{notice ? <><AudioLines size={13} /> {notice}</> : null}</div>
      <span className="sr-only"><Headphones /><Volume2 /><Pause /><Gamepad2 /></span>
    </main>
  )
}
