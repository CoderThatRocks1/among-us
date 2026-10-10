import { useState } from "react";
import { Astronaut, Icon } from "./Icons";

export default function Lobby({ state, isHost, onStart, onLeave, error }) {
  const [copied, setCopied] = useState(false);
  const players = state?.players || [];
  const code = state?.code || "------";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };
  return (
    <main className="lobby-wrap page-enter">
      <div className="lobby-top">
        <button className="text-back" onClick={onLeave}>
          <Icon name="back" size={18} /> LEAVE ROOM
        </button>
        <span className="edition">
          BROWSER EDITION <span>✳</span>
        </span>
      </div>
      <div className="lobby-heading">
        <div className="section-index">
          02 <span>—</span> PRE-FLIGHT CHECK
        </div>
        <h1>
          THE <span>LOBBY.</span>
        </h1>
        <p>
          {isHost
            ? "Invite your crew. The mission begins when you say so."
            : "You’re in. Waiting for the captain to start the mission."}
        </p>
      </div>
      <div className="lobby-grid">
        <section className="lobby-card code-card">
          <div className="card-top">
            <span className="card-kicker">
              <Icon name="wifi" size={16} /> PRIVATE ROOM
            </span>
            <span className="status-pill">
              <span className="live-dot" /> LIVE
            </span>
          </div>
          <p className="card-label">YOUR ROOM CODE</p>
          <div className="room-code" aria-label={`Room code ${code}`}>
            {code.split("").map((char, i) => (
              <span key={i}>{char}</span>
            ))}
          </div>
          <button className="copy-button" onClick={copy}>
            <Icon name={copied ? "check" : "copy"} size={18} />
            {copied ? "Copied to clipboard" : "Copy invite code"}
          </button>
          <div className="code-footnote">
            <Icon name="lock" size={15} /> Only people with this code can join
          </div>
        </section>
        <section className="lobby-card crew-card">
          <div className="card-top">
            <span className="card-kicker">
              <Icon name="users" size={17} /> YOUR CREW
            </span>
            <span className="player-count">{players.length} / 10 PLAYERS</span>
          </div>
          <div className="crew-list">
            {players.map((player, i) => (
              <div className="crew-row" key={player.id}>
                <div
                  className="crew-avatar"
                  style={{ background: player.color + "25" }}
                >
                  <Astronaut size={37} color={player.color} />
                </div>
                <span className="crew-name">
                  {player.name}
                  <small>{i === 0 ? "CAPTAIN" : "CREWMATE"}</small>
                </span>
                <span className="crew-ready">
                  <span className="live-dot" /> READY
                </span>
              </div>
            ))}
            {players.length < 10 && (
              <div className="crew-empty">
                <Icon name="plus" size={17} /> Waiting for more crewmates...
              </div>
            )}
          </div>
        </section>
      </div>
      {error && (
        <div role="alert" className="error-banner lobby-error">
          <Icon name="alert" size={17} />
          {error}
        </div>
      )}
      <div className="lobby-actions">
        <div className="lobby-tip">
          <span className="tip-icon">✳</span>
          <span>
            {isHost
              ? "Your browser is the host. Keep this tab open while playing."
              : "Keep this tab open. The host will start when everyone is ready."}
          </span>
        </div>
        {isHost ? (
          <button
            className="primary-button"
            onClick={onStart}
            disabled={players.length < 2}
          >
            START GAME <Icon name="arrow" size={20} />
          </button>
        ) : (
          <div className="waiting-badge">
            <span className="spinner" /> WAITING FOR HOST
          </div>
        )}
      </div>
      {isHost && players.length < 2 && (
        <p className="lobby-hint">
          At least 2 players are needed to start. Share your code!
        </p>
      )}
    </main>
  );
}
