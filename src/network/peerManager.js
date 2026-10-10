import Peer from "peerjs";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PREFIX = "among-stars-";
const MAX_PLAYERS = 10;
const MAX_COORD = { x: 960, y: 620 };
const randomCode = () =>
  Array.from(
    crypto.getRandomValues(new Uint8Array(6)),
    (n) => ALPHABET[n % ALPHABET.length],
  ).join("");
const safeName = (value) =>
  String(value || "Crewmate")
    .trim()
    .slice(0, 18) || "Crewmate";
const clamp = (n, max) =>
  Math.max(25, Math.min(max - 25, Number.isFinite(n) ? n : 25));
const spawn = (index) => ({
  x: 480 + ((index % 3) - 1) * 52,
  y: 308 + (Math.floor(index / 3) - 1) * 52,
});

/** One controller per room. The host owns the lobby and coordinate snapshots. */
export function createHost(name, callbacks = {}) {
  let peer,
    code,
    closed = false,
    started = false,
    tick,
    openTimeout;
  const connections = new Map();
  const players = new Map();
  const localId = "host";
  const publishLobby = () => {
    const state = {
      code,
      players: [...players.values()].map(({ id, name, color }) => ({
        id,
        name,
        color,
      })),
      hostId: localId,
    };
    connections.forEach((conn) => {
      if (conn.open) conn.send({ type: "lobby", state });
    });
    callbacks.onLobby?.(state);
  };
  const remove = (id) => {
    connections.delete(id);
    players.delete(id);
    if (!closed) publishLobby();
  };
  const controller = {
    get id() {
      return localId;
    },
    get code() {
      return code;
    },
    get players() {
      return [...players.values()];
    },
    start() {
      if (started || closed || players.size < 2) return false;
      started = true;
      const ids = [...players.keys()];
      const impostor = ids[Math.floor(Math.random() * ids.length)];
      connections.forEach((conn, id) =>
        conn.send({
          type: "start",
          role: id === impostor ? "impostor" : "crewmate",
        }),
      );
      callbacks.onStart?.(localId === impostor ? "impostor" : "crewmate");
      tick = window.setInterval(() => {
        const snapshot = [...players.values()].map(
          ({ id, name, color, x, y }) => ({ id, name, color, x, y }),
        );
        connections.forEach((conn) => {
          if (conn.open) conn.send({ type: "snapshot", players: snapshot });
        });
        callbacks.onSnapshot?.(snapshot);
      }, 50);
      return true;
    },
    move(x, y) {
      const player = players.get(localId);
      if (player && started) {
        player.x = clamp(x, MAX_COORD.x);
        player.y = clamp(y, MAX_COORD.y);
      }
    },
    close() {
      closed = true;
      window.clearInterval(tick);
      window.clearTimeout(openTimeout);
      connections.forEach((conn) => conn.close());
      connections.clear();
      peer?.destroy();
    },
  };
  const openPeer = (attempt = 0) =>
    new Promise((resolve, reject) => {
      if (closed) return reject(new Error("Room closed"));
      code = randomCode();
      peer = new Peer(PREFIX + code);
      let settled = false;
      openTimeout = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          peer.destroy();
          reject(
            new Error(
              "Room creation timed out. Check your connection and try again.",
            ),
          );
        }
      }, 15000);
      peer.on("open", () => {
        settled = true;
        window.clearTimeout(openTimeout);
        players.set(localId, {
          id: localId,
          name: safeName(name),
          color: "#f8bc5d",
          ...spawn(0),
        });
        publishLobby();
        resolve(controller);
      });
      peer.on("error", (error) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(openTimeout);
          peer.destroy();
          if (error.type === "unavailable-id" && attempt < 3)
            openPeer(attempt + 1).then(resolve, reject);
          else
            reject(
              new Error(
                error.type === "network" || error.type === "server-error"
                  ? "Could not reach the PeerJS signaling service. Check your connection."
                  : error.message,
              ),
            );
        } else callbacks.onError?.(error.message);
      });
      peer.on("disconnected", () => {
        if (!closed)
          callbacks.onError?.(
            "Signaling connection lost. Existing peers may remain connected.",
          );
      });
      peer.on("connection", (conn) => {
        if (closed || started || players.size >= MAX_PLAYERS) {
          conn.on("open", () => conn.close());
          return;
        }
        let id = null;
        conn.on("data", (packet) => {
          if (!packet || typeof packet !== "object") return;
          if (
            packet.type === "hello" &&
            !id &&
            typeof packet.name === "string" &&
            players.size < MAX_PLAYERS
          ) {
            id = conn.peer;
            if (players.has(id)) {
              conn.close();
              return;
            }
            const colors = [
              "#66d7ce",
              "#a998f7",
              "#f27d90",
              "#a2dc84",
              "#f3a776",
              "#88baff",
              "#e7a6d8",
              "#d7d889",
              "#91c5e1",
            ];
            players.set(id, {
              id,
              name: safeName(packet.name),
              color: colors[(players.size - 1) % colors.length],
              ...spawn(players.size),
            });
            connections.set(id, conn);
            publishLobby();
          } else if (
            packet.type === "move" &&
            id &&
            started &&
            typeof packet.x === "number" &&
            typeof packet.y === "number"
          ) {
            const player = players.get(id);
            if (player) {
              player.x = clamp(packet.x, MAX_COORD.x);
              player.y = clamp(packet.y, MAX_COORD.y);
            }
          }
        });
        conn.on("close", () => {
          if (id) remove(id);
        });
        conn.on("error", () => {
          if (id) remove(id);
        });
      });
    });
  return openPeer();
}

export function joinHost(roomCode, name, callbacks = {}) {
  const code = String(roomCode).trim().toUpperCase();
  if (!new RegExp(`^[${ALPHABET}]{6}$`).test(code))
    return Promise.reject(new Error("Enter a valid 6-character room code."));
  return new Promise((resolve, reject) => {
    const peer = new Peer();
    let conn,
      closed = false,
      settled = false,
      timeout;
    const fail = (message) => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timeout);
        peer.destroy();
        reject(new Error(message));
      } else if (!closed) callbacks.onError?.(message);
    };
    const controller = {
      get id() {
        return peer.id;
      },
      get code() {
        return code;
      },
      start() {
        return false;
      },
      move(x, y) {
        if (conn?.open)
          conn.send({
            type: "move",
            x: clamp(x, MAX_COORD.x),
            y: clamp(y, MAX_COORD.y),
          });
      },
      close() {
        closed = true;
        window.clearTimeout(timeout);
        conn?.close();
        peer.destroy();
      },
    };
    timeout = window.setTimeout(
      () => fail("Connection timed out. Check the room code and try again."),
      15000,
    );
    peer.on("open", () => {
      conn = peer.connect(PREFIX + code, { reliable: true });
      conn.on("open", () => {
        conn.send({ type: "hello", name: safeName(name) });
      });
      conn.on("data", (packet) => {
        if (!packet || typeof packet !== "object") return;
        if (
          packet.type === "lobby" &&
          packet.state?.players &&
          Array.isArray(packet.state.players)
        ) {
          callbacks.onLobby?.(packet.state);
          if (!settled) {
            settled = true;
            window.clearTimeout(timeout);
            resolve(controller);
          }
        } else if (packet.type === "start")
          callbacks.onStart?.(
            packet.role === "impostor" ? "impostor" : "crewmate",
          );
        else if (packet.type === "snapshot" && Array.isArray(packet.players))
          callbacks.onSnapshot?.(packet.players);
      });
      conn.on("close", () => fail("The host closed the room."));
      conn.on("error", () => fail("Could not connect to this room."));
    });
    peer.on("error", (error) =>
      fail(
        error.type === "peer-unavailable"
          ? "Room not found. Check the code and make sure the host is online."
          : error.message,
      ),
    );
  });
}
