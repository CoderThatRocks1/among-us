import { Icon } from "./Icons";

export default function HUD({
  role,
  completed,
  total,
  nearbyTask,
  onUse,
  onMeeting,
  onLeave,
  mode,
}) {
  return (
    <>
      <div className="game-topbar">
        <div className="game-brand">
          <span className="brand-mark">✳</span> AMONG <span>STARS</span>
        </div>
        <div className="game-center-label">
          <span className="live-dot" />{" "}
          {mode === "bots" ? "SOLO MISSION" : "LIVE CREW MISSION"}
        </div>
        <button className="game-exit" onClick={onLeave}>
          EXIT <Icon name="close" size={16} />
        </button>
      </div>
      <div className="game-hud">
        <div className="hud-left">
          <span className="hud-eyebrow">YOUR ROLE</span>
          <span
            className={"role-tag " + (role === "impostor" ? "impostor" : "")}
          >
            {role === "impostor" ? "◆ IMPOSTOR" : "✳ CREWMATE"}
          </span>
          <span className="hud-task">
            TASKS{" "}
            <b>
              {completed}/{total}
            </b>
          </span>
          <div className="progress-track">
            <span
              style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="hud-controls">
          <button
            className="hud-button"
            onClick={onMeeting}
            disabled={mode !== "bots"}
            title={
              mode !== "bots"
                ? "Multiplayer meetings are not available yet"
                : "Call emergency meeting"
            }
          >
            <Icon name="alert" size={18} /> MEETING
          </button>
          <button
            className="hud-button hud-use"
            onClick={onUse}
            disabled={!nearbyTask}
          >
            <Icon name="bolt" size={18} />{" "}
            {nearbyTask
              ? "USE · " + nearbyTask.label.toUpperCase()
              : "USE TASK"}
          </button>
        </div>
      </div>
    </>
  );
}
