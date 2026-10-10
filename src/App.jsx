import { useEffect, useRef, useState } from 'react'
import GameCanvas from './components/GameCanvas.jsx'
import Lobby from './components/Lobby.jsx'
import MainMenu from './components/MainMenu.jsx'
import { createLocalRoster } from './network/botLogic.js'
import { createHost, joinRoom, normalizeRoomCode } from './network/peerManager.js'

const PLAYER_COLORS = ['#fb654f', '#4bbfe2', '#b6d971', '#c991e8', '#f5ab57', '#64d7bb', '#ef8dad', '#e8d36a']

function readSavedName() {
  try {
    return localStorage.getItem('orbital-suspects-callsign') || 'Nova'
  } catch {
    return 'Nova'
  }
}

function createGameRoster(players) {
  const roster = players.map((player, index) => ({
    ...player,
    color: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length],
    role: 'Crewmate',
    ready: true,
    alive: true,
    tasksDone: 0,
  }))
  const impostorIndex = Math.floor(Math.random() * Math.max(roster.length, 1))
  if (roster[impostorIndex]) roster[impostorIndex] = { ...roster[impostorIndex], role: 'Impostor' }
  return roster
}

export default function App() {
  const [view, setView] = useState('menu')
  const [mode, setMode] = useState(null)
  const [playerName, setPlayerName] = useState(readSavedName)
  const [roomCode, setRoomCode] = useState('')
  const [players, setPlayers] = useState([])
  const [gamePlayers, setGamePlayers] = useState([])
  const [localPlayerId, setLocalPlayerId] = useState(null)
  const [session, setSession] = useState(null)
  const [busyAction, setBusyAction] = useState('')
  const [error, setError] = useState('')
  const [networkStatus, setNetworkStatus] = useState('')

  const sessionRef = useRef(null)
  const playersRef = useRef(players)
  const playerNameRef = useRef(playerName)
  const networkPacketRef = useRef(null)
  const gamePacketRef = useRef(null)
  const pendingLobbyUpdateRef = useRef(null)
  const pendingJoinErrorRef = useRef('')

  playersRef.current = players
  playerNameRef.current = playerName

  useEffect(() => {
    try {
      localStorage.setItem('orbital-suspects-callsign', playerName.trim().slice(0, 18) || 'Nova')
    } catch {
      // The game remains usable in private browsing when storage is unavailable.
    }
  }, [playerName])

  function replacePlayers(nextPlayers) {
    playersRef.current = nextPlayers
    setPlayers(nextPlayers)
  }

  function handleNetworkPacket(packet, from) {
    if (!packet) return

    if (packet.type === 'room-full' || packet.type === 'room-in-progress') {
      const message = packet.type === 'room-full' ? 'That room already has eight players.' : 'That mission has already launched.'
      pendingJoinErrorRef.current = message
      if (sessionRef.current?.role === 'guest') {
        const currentSession = sessionRef.current
        sessionRef.current = null
        currentSession.close()
        setSession(null)
        setMode(null)
        setError(message)
        setNetworkStatus('')
        setView('menu')
      }
      return
    }

    if (packet.type === 'player-joined' && mode !== 'guest') {
      const current = playersRef.current
      if (current.some((player) => player.id === packet.player.id)) return
      if (view === 'game') {
        sessionRef.current?.send(packet.player.id, { type: 'room-in-progress' })
        sessionRef.current?.disconnect?.(packet.player.id)
        return
      }
      if (current.length >= 8) {
        sessionRef.current?.send(packet.player.id, { type: 'room-full' })
        sessionRef.current?.disconnect?.(packet.player.id)
        return
      }
      const next = [...current, {
        ...packet.player,
        color: PLAYER_COLORS[current.length % PLAYER_COLORS.length],
        ready: false,
        isHost: false,
      }]
      replacePlayers(next)
      const lobbyUpdate = { type: 'lobby-update', players: next, roomCode }
      sessionRef.current?.send(packet.player.id, lobbyUpdate)
      sessionRef.current?.broadcast(lobbyUpdate, packet.player.id)
      setNetworkStatus(`${packet.player.name} joined the room.`)
      return
    }

    if (packet.type === 'player-left') {
      const next = playersRef.current.filter((player) => player.id !== packet.id)
      replacePlayers(next)
      if (mode === 'host') sessionRef.current?.broadcast({ type: 'lobby-update', players: next, roomCode })
      if (view === 'game') gamePacketRef.current?.(packet, from)
      setNetworkStatus('A crewmate disconnected.')
      return
    }

    if (packet.type === 'player-ready' && mode === 'host') {
      const next = playersRef.current.map((player) => player.id === from ? { ...player, ready: Boolean(packet.ready) } : player)
      replacePlayers(next)
      sessionRef.current?.broadcast({ type: 'lobby-update', players: next, roomCode })
      return
    }

    if (packet.type === 'lobby-update') {
      // A fast host can answer the hello packet before joinRoom() returns. Keep
      // that snapshot until the guest session has been installed in App state.
      if (sessionRef.current?.role !== 'host') {
        pendingLobbyUpdateRef.current = packet
        if (sessionRef.current?.role === 'guest') {
          replacePlayers(packet.players || [])
          if (packet.roomCode) setRoomCode(packet.roomCode)
          setNetworkStatus('Connected to host · waiting for launch')
        }
      }
      return
    }

    if (packet.type === 'game-start') {
      const roster = packet.players || []
      replacePlayers(roster)
      setGamePlayers(roster)
      setLocalPlayerId(sessionRef.current?.selfId || localPlayerId)
      setNetworkStatus('Mission in progress')
      setView('game')
      return
    }

    if (view === 'game') gamePacketRef.current?.(packet, from)
  }

  networkPacketRef.current = handleNetworkPacket

  function startBotMatch() {
    setError('')
    setNetworkStatus('')
    sessionRef.current?.close()
    sessionRef.current = null
    setSession(null)
    const roster = createLocalRoster(playerNameRef.current.trim() || 'Nova')
    replacePlayers(roster)
    setGamePlayers(roster)
    setMode('bots')
    setLocalPlayerId('local-player')
    setRoomCode('')
    setView('game')
  }

  async function handleCreateRoom() {
    if (busyAction) return
    setBusyAction('create')
    setError('')
    setNetworkStatus('Contacting the PeerJS signalling network…')
    try {
      const createdSession = await createHost({
        onPacket: (packet, from) => networkPacketRef.current?.(packet, from),
        onStatus: (status) => {
          if (status.message) setNetworkStatus(status.message)
          if (status.type === 'error' || status.type === 'disconnected') setError(status.message)
        },
      })
      sessionRef.current = createdSession
      setSession(createdSession)
      const hostPlayer = {
        id: createdSession.selfId,
        name: playerNameRef.current.trim() || 'Nova',
        color: PLAYER_COLORS[0],
        isHost: true,
        ready: true,
        role: 'Crewmate',
      }
      replacePlayers([hostPlayer])
      setGamePlayers([])
      setLocalPlayerId(createdSession.selfId)
      setRoomCode(createdSession.roomCode)
      setMode('host')
      setNetworkStatus('Room open · waiting for your crew')
      setView('lobby')
    } catch (connectionError) {
      setError(connectionError.message || 'Could not create a room. Please try again.')
      setNetworkStatus('')
    } finally {
      setBusyAction('')
    }
  }

  async function handleJoinRoom() {
    if (busyAction) return
    const normalizedCode = normalizeRoomCode(roomCode)
    if (normalizedCode.length !== 6) {
      setError('Enter the six-character code shared by your host.')
      return
    }
    setBusyAction('join')
    setError('')
    pendingLobbyUpdateRef.current = null
    pendingJoinErrorRef.current = ''
    setNetworkStatus('Connecting directly to the host…')
    try {
      const joinedSession = await joinRoom(normalizedCode, {
        name: playerNameRef.current.trim() || 'Nova',
        onPacket: (packet, from) => networkPacketRef.current?.(packet, from),
        onStatus: (status) => {
          if (status.message) setNetworkStatus(status.message)
          if (status.type === 'error' || status.type === 'disconnected') setError(status.message)
        },
      })
      const earlyJoinError = pendingJoinErrorRef.current
      pendingJoinErrorRef.current = ''
      if (earlyJoinError) {
        joinedSession.close()
        throw new Error(earlyJoinError)
      }
      sessionRef.current = joinedSession
      setSession(joinedSession)
      const guestPlayer = {
        id: joinedSession.selfId,
        name: playerNameRef.current.trim() || 'Nova',
        color: PLAYER_COLORS[1],
        isHost: false,
        ready: false,
        role: 'Crewmate',
      }
      const initialLobby = pendingLobbyUpdateRef.current?.players || [guestPlayer]
      pendingLobbyUpdateRef.current = null
      replacePlayers(initialLobby)
      setGamePlayers([])
      setLocalPlayerId(joinedSession.selfId)
      setRoomCode(joinedSession.roomCode)
      setMode('guest')
      setNetworkStatus('Connected · syncing with the host…')
      setView('lobby')
    } catch (connectionError) {
      setError(connectionError.message || 'Could not join that room. Check the code and try again.')
      setNetworkStatus('')
    } finally {
      setBusyAction('')
    }
  }

  function startRoomGame() {
    if (mode !== 'host') return
    const roster = createGameRoster(playersRef.current)
    replacePlayers(roster)
    setGamePlayers(roster)
    setNetworkStatus('Mission in progress')
    sessionRef.current?.broadcast({ type: 'game-start', players: roster })
    setView('game')
  }

  function toggleReady(ready) {
    if (mode !== 'guest') return
    const next = playersRef.current.map((player) => player.id === localPlayerId ? { ...player, ready } : player)
    replacePlayers(next)
    sessionRef.current?.send({ type: 'player-ready', ready })
  }

  function leaveRoom() {
    const currentSession = sessionRef.current
    sessionRef.current = null
    currentSession?.close()
    gamePacketRef.current = null
    setSession(null)
    replacePlayers([])
    setGamePlayers([])
    setMode(null)
    setLocalPlayerId(null)
    setRoomCode('')
    setError('')
    setNetworkStatus('')
    setView('menu')
  }

  useEffect(() => () => {
    sessionRef.current?.close()
  }, [])

  if (view === 'lobby') {
    return <Lobby code={roomCode} players={players} myId={localPlayerId} isHost={mode === 'host'} status={networkStatus} onStart={startRoomGame} onLeave={leaveRoom} onReady={toggleReady} />
  }

  if (view === 'game') {
    return <GameCanvas mode={mode || 'bots'} initialPlayers={gamePlayers.length ? gamePlayers : players} localPlayerId={localPlayerId || 'local-player'} session={session} roomCode={roomCode} networkStatus={networkStatus} networkPacketRef={gamePacketRef} onExit={leaveRoom} />
  }

  return <MainMenu
    playerName={playerName}
    setPlayerName={(value) => setPlayerName(value.slice(0, 18))}
    roomCode={roomCode}
    setRoomCode={setRoomCode}
    onPlay={startBotMatch}
    onCreateRoom={handleCreateRoom}
    onJoinRoom={handleJoinRoom}
    busy={Boolean(busyAction)}
    busyAction={busyAction}
    error={error}
    status={networkStatus}
  />
}
