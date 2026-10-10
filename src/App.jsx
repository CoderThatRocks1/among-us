import { useRef, useState } from "react";
import MainMenu from "./components/MainMenu";
import Lobby from "./components/Lobby";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import EmergencyModal from "./components/EmergencyModal";
import { Icon } from "./components/Icons";
import { BOT_NAMES, BOT_COLORS, TASKS } from "./network/botLogic";
import { createHost, joinHost } from "./network/peerManager";

export default function App() {
  const [name, setName] = useState(
    () => localStorage.getItem("among-stars-name") || "",
  );
  const [joinCode, setJoinCode] = useState("");
  const [screen, setScreen] = useState("menu");
  const [mode, setMode] = useState("bots");
  const [roomId, setRoomId] = useState("you");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lobby, setLobby] = useState(null);
  const [players, setPlayers] = useState([]);
  const [role, setRole] = useState("crewmate");
  const [completed, setCompleted] = useState([]);
  const [nearby, setNearby] = useState(-1);
  const [meeting, setMeeting] = useState(false);
  const roomRef = useRef(null);
  const generation = useRef(0);
  const identity = name.trim().slice(0, 18) || "Crewmate";
  const rememberName = () => localStorage.setItem("among-stars-name", identity);
  const leave = () => {
    generation.current++;
    roomRef.current?.close();
    roomRef.current = null;
    setScreen("menu");
    setLobby(null);
    setRoomId("you");
    setPlayers([]);
    setCompleted([]);
    setNearby(-1);
    setMeeting(false);
    setError("");
    setBusy(false);
  };
  const callbacks = (token) => ({
    onLobby: (state) => {
      if (generation.current === token) setLobby(state);
    },
    onStart: (assigned) => {
      if (generation.current === token) {
        setRole(assigned);
        setCompleted([]);
        setScreen("game");
      }
    },
    onSnapshot: (snapshot) => {
      if (generation.current === token) setPlayers(snapshot);
    },
    onError: (message) => {
      if (generation.current === token) setError(message);
    },
  });
  const connect = async (type) => {
    rememberName();
    setError("");
    setBusy(true);
    const token = ++generation.current;
    try {
      const room =
        type === "host"
          ? await createHost(identity, callbacks(token))
          : await joinHost(joinCode, identity, callbacks(token));
      if (token !== generation.current) {
        room.close();
        return;
      }
      roomRef.current = room;
      setRoomId(room.id);
      setMode("multi");
      setScreen("lobby");
    } catch (err) {
      if (token === generation.current)
        setError(err.message || "Connection failed. Please try again.");
    } finally {
      if (token === generation.current) setBusy(false);
    }
  };
  const playBots = () => {
    rememberName();
    setError("");
    setCompleted([]);
    setNearby(-1);
    setRole("crewmate");
    setMode("bots");
    setRoomId("you");
    setScreen("game");
  };
  const useTask = () => {
    if (nearby >= 0 && !completed.includes(nearby)) {
      setCompleted((old) => [...old, nearby]);
      setNearby(-1);
    }
  };
  const botParticipants = [
    { id: "you", name: identity, color: "#f8bc5d" },
    ...BOT_NAMES.map((bot, i) => ({
      id: `bot-${i}`,
      name: bot,
      color: BOT_COLORS[i],
    })),
  ];
  return (
    <div className="app-shell">
      <div className="stars stars-one" />
      <div className="stars stars-two" />
      {screen === "menu" && (
        <MainMenu
          name={name}
          setName={setName}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          onBots={playBots}
          onCreate={() => connect("host")}
          onJoin={() => connect("guest")}
          busy={busy}
          error={error}
        />
      )}
      {screen === "lobby" && (
        <Lobby
          state={lobby}
          isHost={roomId === "host"}
          onStart={() => roomRef.current?.start()}
          onLeave={leave}
          error={error}
        />
      )}
      {screen === "game" && (
        <div className="game-page page-enter">
          <HUD
            role={role}
            completed={completed.length}
            total={TASKS.length}
            nearbyTask={nearby < 0 ? null : TASKS[nearby]}
            onUse={useTask}
            onMeeting={() => setMeeting(true)}
            onLeave={leave}
            mode={mode}
          />
          <div className="game-content">
            <div className="game-title-row">
              <div>
                <div className="section-index">
                  03 <span>—</span> THE MISSION
                </div>
                <h1>
                  STAY <span>SHARP.</span>
                </h1>
              </div>
              <p>
                {mode === "bots"
                  ? "Four bots. One mystery. Keep moving."
                  : "Stay connected. Your crew is out there."}
              </p>
            </div>
            <GameCanvas
              key={mode + roomId}
              mode={mode}
              localId={roomId}
              name={identity}
              color={
                lobby?.players.find((p) => p.id === roomId)?.color || "#f8bc5d"
              }
              players={players}
              completed={completed}
              onMove={(x, y) => roomRef.current?.move(x, y)}
              onNearbyTask={setNearby}
              paused={meeting}
            />
            <div className="game-bottom-note">
              <span>
                <Icon name="bolt" size={15} />{" "}
                {completed.length === TASKS.length
                  ? "All tasks complete! Nice work, crewmate."
                  : nearby >= 0
                    ? `Nearby: ${TASKS[nearby].label} — press USE`
                    : "Find glowing task markers around the ship."}
              </span>
              <span>
                {mode === "bots"
                  ? "BOT SIMULATION ACTIVE"
                  : `ROOM ${lobby?.code || ""}`}
              </span>
            </div>
            {error && (
              <div role="alert" className="error-banner">
                <Icon name="alert" size={17} />
                {error}
              </div>
            )}
          </div>
          {meeting && (
            <EmergencyModal
              participants={botParticipants}
              onClose={() => setMeeting(false)}
            />
          )}
        </div>
      )}
      {screen === "menu" && (
        <div className="floating-symbol" aria-hidden="true">
          <Icon name="shield" size={19} />
        </div>
      )}
    </div>
  );
}
