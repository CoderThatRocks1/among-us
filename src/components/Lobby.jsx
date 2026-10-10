import { useState } from 'react'
import { ArrowLeft, Check, Clipboard, Copy, Crown, Gamepad2, LoaderCircle, Radio, Shield, Signal, Sparkles, UserRound, Users, Wifi } from 'lucide-react'

function PlayerMark({ color, small = false }) {
  return <span className={`player-mark ${small ? 'player-mark-small' : ''}`} style={{ '--player-color': color || '#79c6da' }}><span className="player-mark-glass" /></span>
}

export default function Lobby({ code, players, myId, isHost, status, onStart, onLeave, onReady }) {
  const [copied, setCopied] = useState(false)
  const localPlayer = players.find((player) => player.id === myId)
  const readyCount = players.filter((player) => player.ready || player.isHost).length

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="lobby-shell">
      <div className="space-grid" aria-hidden="true" />
      <header className="lobby-header">
        <button className="back-link" onClick={onLeave}><ArrowLeft size={16} /> BACK TO MENU</button>
        <div className="brand-lockup"><span className="brand-mark"><span /><span /><span /></span><span className="brand-name">ORBITAL<span> / </span>SUSPECTS</span></div>
        <div className="lobby-online"><span className="live-pulse" /> ROOM ONLINE</div>
      </header>

      <section className="lobby-content">
        <div className="lobby-title-block"><div className="eyebrow"><span className="eyebrow-line" /> PRE-FLIGHT CHECK</div><h1>Assemble<br /><span>your crew.</span></h1><p>Send your code to the crew. The launch happens when you say so.</p></div>

        <div className="lobby-board">
          <div className="lobby-main-panel">
            <div className="lobby-panel-top"><div><span className="panel-overline"><Radio size={13} /> PRIVATE ROOM</span><h2>Waiting for crew<span>.</span></h2></div><span className="capacity-chip"><Users size={14} /> {players.length}<i>/</i>8</span></div>

            <div className="player-list">
              {Array.from({ length: Math.max(players.length, 4) }, (_, index) => {
                const player = players[index]
                return player ? (
                  <div className={`lobby-player ${player.id === myId ? 'lobby-player-you' : ''}`} key={player.id}>
                    <PlayerMark color={player.color} />
                    <div className="lobby-player-name"><b>{player.name}{player.id === myId ? <span className="you-tag">YOU</span> : null}</b><small>{player.isHost ? 'ROOM HOST' : player.ready ? 'READY TO LAUNCH' : 'CHECKING IN'}</small></div>
                    <div className={`player-status ${player.isHost || player.ready ? 'player-ready' : ''}`}>{player.isHost ? <><Crown size={13} /> HOST</> : player.ready ? <><Check size={13} /> READY</> : <><LoaderCircle size={13} /> WAITING</>}</div>
                  </div>
                ) : (
                  <div className="lobby-player lobby-empty" key={`empty-${index}`}><span className="empty-avatar"><UserRound size={16} /></span><div className="lobby-player-name"><b>Waiting for crew</b><small>SHARE YOUR ROOM CODE</small></div><span className="empty-dots"><i /><i /><i /></span></div>
                )
              })}
            </div>

            <div className="lobby-actions">
              {isHost ? <button className="launch-button" onClick={onStart} disabled={!players.length}><Gamepad2 size={18} /><span>START THE MISSION</span><span className="launch-arrow">→</span></button> : <button className={`ready-button ${localPlayer?.ready ? 'is-ready' : ''}`} onClick={() => onReady(!localPlayer?.ready)}><Check size={17} /><span>{localPlayer?.ready ? 'YOU’RE READY' : 'MARK ME READY'}</span></button>}
              <div className="launch-caption"><span className="live-pulse" /> {isHost ? `${readyCount} CREW ${readyCount === 1 ? 'MEMBER' : 'MEMBERS'} READY` : 'THE HOST WILL START THE MISSION'}</div>
            </div>
          </div>

          <aside className="lobby-side-panel">
            <div className="room-code-card"><div className="room-code-head"><span className="panel-overline"><Shield size={13} /> YOUR ROOM CODE</span><span className="secure-mark"><Signal size={13} /> P2P</span></div><div className="room-code-display">{code.split('').map((character, index) => <span key={`${character}-${index}`}>{character}</span>)}</div><button className="copy-code-button" onClick={copyCode}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? 'COPIED TO CLIPBOARD' : 'COPY INVITE CODE'}</button><div className="invite-note"><Sparkles size={13} /> Your friends can join from anywhere.</div></div>
            <div className="connection-card"><div className="connection-orbit"><span /><i /><b /></div><div className="connection-copy"><span className="panel-overline">DIRECT CONNECTION</span><b>Peer to peer.<br />No game server.</b><p>Your browser is hosting this room. Game data travels directly between players.</p></div><div className="connection-footer"><Wifi size={14} /> ENCRYPTED WEBRTC LINK <span className="connection-dots"><i /><i /><i /></span></div></div>
            {status && <div className="lobby-status" role="status"><Signal size={14} />{status}</div>}
            <div className="lobby-privacy"><Shield size={14} /> THE ROOM CLOSES WHEN THE HOST LEAVES</div>
          </aside>
        </div>
      </section>

      <footer className="site-footer"><span>© 2026 ORBITAL SUSPECTS</span><span><i /> WAITING FOR CLEARANCE</span><span className="footer-right">ROOM {code} <Copy size={12} /></span></footer>
    </main>
  )
}
