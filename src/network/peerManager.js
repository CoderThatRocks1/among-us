import Peer from 'peerjs'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function normalizeRoomCode(value = '') {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

function makeRoomCode() {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')
}

function safeName(value) {
  const name = String(value || 'Crewmate').trim().replace(/[<>]/g, '').slice(0, 18)
  return name || 'Crewmate'
}

function waitForPeer(peer, timeout = 16000) {
  return new Promise((resolve, reject) => {
    let settled = false
    const cleanup = () => {
      clearTimeout(timer)
      peer.off('open', onOpen)
      peer.off('error', onError)
    }
    const finish = (callback, value) => {
      if (settled) return
      settled = true
      cleanup()
      callback(value)
    }
    const onOpen = (id) => finish(resolve, id)
    const onError = (error) => finish(reject, error)
    const timer = setTimeout(() => {
      finish(reject, new Error('The PeerJS signalling service did not respond in time.'))
    }, timeout)
    peer.on('open', onOpen)
    peer.on('error', onError)
  })
}

function waitForConnection(connection, timeout = 18000) {
  return new Promise((resolve, reject) => {
    let settled = false
    const cleanup = () => {
      clearTimeout(timer)
      connection.off('open', onOpen)
      connection.off('error', onError)
    }
    const finish = (callback, value) => {
      if (settled) return
      settled = true
      cleanup()
      callback(value)
    }
    const onOpen = () => finish(resolve, connection)
    const onError = (error) => finish(reject, error)
    const timer = setTimeout(() => {
      finish(reject, new Error('The room did not answer. Check the code and try again.'))
    }, timeout)
    connection.on('open', onOpen)
    connection.on('error', onError)
  })
}

function unavailableId(error) {
  return error?.type === 'unavailable-id' || /unavailable|already taken/i.test(error?.message || '')
}

function peerErrorMessage(error) {
  if (error?.type === 'peer-unavailable') return 'We could not find that room. Double-check the six-character code.'
  if (error?.type === 'network' || error?.type === 'server-error') return 'PeerJS could not reach its signalling service. Check your connection and try again.'
  if (error?.type === 'unavailable-id') return 'That room code is already in use. Please try again.'
  return error?.message || 'The connection could not be created. Please try again.'
}

export async function createHost({ onPacket = () => {}, onStatus = () => {} } = {}) {
  let peer
  let roomCode
  let lastError

  for (let attempt = 0; attempt < 5; attempt += 1) {
    roomCode = makeRoomCode()
    peer = new Peer(roomCode, { debug: 0 })
    try {
      roomCode = await waitForPeer(peer)
      break
    } catch (error) {
      lastError = error
      peer.destroy()
      if (!unavailableId(error) || attempt === 4) {
        throw new Error(peerErrorMessage(error))
      }
      peer = null
    }
  }

  if (!peer) throw new Error(peerErrorMessage(lastError))

  const connections = new Map()
  let closed = false

  peer.on('connection', (connection) => {
    const peerId = connection.peer
    connections.set(peerId, connection)
    let welcomed = false

    connection.on('data', (packet) => {
      if (!packet || typeof packet !== 'object') return
      if (!welcomed && packet.type === 'hello') {
        welcomed = true
        onPacket({
          type: 'player-joined',
          player: { id: peerId, name: safeName(packet.name), ready: false, isHost: false },
        }, peerId)
        return
      }
      onPacket(packet, peerId)
    })

    connection.on('close', () => {
      connections.delete(peerId)
      if (welcomed) onPacket({ type: 'player-left', id: peerId }, peerId)
    })

    connection.on('error', (error) => {
      onStatus({ type: 'connection-error', message: peerErrorMessage(error) })
    })
  })

  peer.on('disconnected', () => {
    if (!closed) onStatus({ type: 'disconnected', message: 'Lost the room connection. Rejoin to keep playing.' })
  })

  peer.on('error', (error) => {
    onStatus({ type: 'error', message: peerErrorMessage(error) })
  })

  return {
    role: 'host',
    selfId: roomCode,
    roomCode,
    send(peerId, packet) {
      const connection = connections.get(peerId)
      if (connection?.open) connection.send(packet)
    },
    broadcast(packet, exceptPeerId) {
      for (const [peerId, connection] of connections) {
        if (peerId !== exceptPeerId && connection.open) connection.send(packet)
      }
    },
    disconnect(peerId) {
      const connection = connections.get(peerId)
      if (!connection) return
      connections.delete(peerId)
      connection.close()
    },
    close() {
      if (closed) return
      closed = true
      for (const connection of connections.values()) connection.close()
      connections.clear()
      peer.destroy()
    },
  }
}

export async function joinRoom(roomCodeValue, { name, onPacket = () => {}, onStatus = () => {} } = {}) {
  const roomCode = normalizeRoomCode(roomCodeValue)
  if (roomCode.length !== 6) throw new Error('Room codes are six characters long.')

  const peer = new Peer(undefined, { debug: 0 })
  let connection
  let handshakePeerError
  try {
    const selfId = await waitForPeer(peer)
    const peerFailure = new Promise((_, reject) => {
      handshakePeerError = (error) => reject(error)
      peer.on('error', handshakePeerError)
    })
    connection = peer.connect(roomCode, { reliable: true, serialization: 'json' })
    connection.on('data', (packet) => {
      if (packet && typeof packet === 'object') onPacket(packet, roomCode)
    })
    connection.on('close', () => onStatus({ type: 'disconnected', message: 'The host closed the room.' }))
    connection.on('error', (error) => onStatus({ type: 'connection-error', message: peerErrorMessage(error) }))
    await Promise.race([waitForConnection(connection), peerFailure])
    peer.off('error', handshakePeerError)
    connection.send({ type: 'hello', name: safeName(name) })

    peer.on('disconnected', () => onStatus({ type: 'disconnected', message: 'Lost the room connection. Rejoin to keep playing.' }))
    peer.on('error', (error) => onStatus({ type: 'error', message: peerErrorMessage(error) }))

    let closed = false
    return {
      role: 'guest',
      selfId,
      roomCode,
      send(packet) {
        if (connection?.open) connection.send(packet)
      },
      broadcast(packet) {
        if (connection?.open) connection.send(packet)
      },
      close() {
        if (closed) return
        closed = true
        connection?.close()
        peer.destroy()
      },
    }
  } catch (error) {
    if (handshakePeerError) peer.off('error', handshakePeerError)
    connection?.close()
    peer.destroy()
    throw new Error(peerErrorMessage(error))
  }
}
