import { ArrowDownRight, ArrowRight, ArrowUpRight, AudioLines, Bot, ChevronRight, CircleDot, Copy, Globe2, LockKeyhole, Radio, Rocket, ShieldCheck, Signal, Sparkles, Users, Wifi } from 'lucide-react'

function HelmetArtwork() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="art-orbit art-orbit-one" />
      <div className="art-orbit art-orbit-two" />
      <div className="art-star art-star-one" />
      <div className="art-star art-star-two" />
      <div className="art-star art-star-three" />
      <div className="art-coordinate">SECTOR 07 <span>·</span> 04:23:18</div>
      <svg className="crew-illustration" viewBox="0 0 440 470" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="crewBody" x1="116" y1="154" x2="318" y2="418" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF826B" />
            <stop offset=".54" stopColor="#E84F50" />
            <stop offset="1" stopColor="#AA3141" />
          </linearGradient>
          <linearGradient id="crewGlass" x1="183" y1="129" x2="328" y2="235" gradientUnits="userSpaceOnUse">
            <stop stopColor="#DFF9FF" />
            <stop offset=".28" stopColor="#80DDF4" />
            <stop offset="1" stopColor="#398DAD" />
          </linearGradient>
          <linearGradient id="crewShine" x1="134" y1="171" x2="191" y2="390" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity=".43" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id="crewShadow" x="31" y="42" width="390" height="420" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="20" />
          </filter>
        </defs>
        <ellipse cx="229" cy="386" rx="137" ry="31" fill="#EB6258" fillOpacity=".2" filter="url(#crewShadow)" />
        <path d="M99 166C99 94 147 53 220 53C295 53 342 95 342 167V338C342 386 313 416 265 416H237V366H204V416H175C127 416 99 386 99 338V166Z" fill="url(#crewBody)" stroke="#FF9B80" strokeWidth="4" />
        <path d="M119 177C119 112 156 74 216 74V397H177C140 397 119 373 119 335V177Z" fill="url(#crewShine)" />
        <path d="M178 146C178 127 193 112 212 112H301C325 112 343 130 343 154V207C343 231 325 249 301 249H216C195 249 178 233 178 212V146Z" fill="#9E3A4C" stroke="#7B2A40" strokeWidth="5" />
        <path d="M187 148C187 132 200 120 216 120H299C318 120 333 135 333 154V199C333 218 318 233 299 233H216C200 233 187 220 187 204V148Z" fill="url(#crewGlass)" stroke="#FFC0A7" strokeWidth="4" />
        <path d="M207 132H286C300 132 312 143 312 157V163C281 160 246 170 222 191C211 200 201 207 187 210V152C187 141 196 132 207 132Z" fill="white" fillOpacity=".5" />
        <path d="M91 222C76 229 68 241 68 261V333C68 353 82 365 101 365H111V194L91 222Z" fill="#C83F4A" stroke="#FF967A" strokeWidth="4" />
        <path d="M340 268H358C377 268 389 280 389 298V338C389 357 377 369 358 369H340V268Z" fill="#C83F4A" stroke="#FF967A" strokeWidth="4" />
        <path d="M137 321C166 337 194 343 223 343C254 343 284 335 308 319" stroke="#FFAD8C" strokeOpacity=".54" strokeWidth="5" strokeLinecap="round" />
        <rect x="164" y="375" width="47" height="48" rx="21" fill="#BF3948" stroke="#F88570" strokeWidth="4" />
        <rect x="238" y="375" width="48" height="48" rx="21" fill="#BF3948" stroke="#F88570" strokeWidth="4" />
        <path d="M191 121L211 106H283" stroke="white" strokeOpacity=".74" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="art-tag art-tag-top"><span className="tag-dot" /> CREW STATUS <b>UNKNOWN</b></div>
      <div className="art-tag art-tag-bottom"><span className="art-tag-icon"><Radio size={14} /></span><span><b>DEEP SPACE</b><small>NO BACKUP IN RANGE</small></span><Signal size={17} className="tag-signal" /></div>
      <div className="art-crosshair" />
    </div>
  )
}

export default function MainMenu({
  playerName,
  setPlayerName,
  roomCode,
  setRoomCode,
  onPlay,
  onCreateRoom,
  onJoinRoom,
  busy,
  busyAction,
  error,
  status,
}) {
  return (
    <main className="menu-shell">
      <div className="space-grid" aria-hidden="true" />
      <div className="space-glow space-glow-left" aria-hidden="true" />
      <div className="space-glow space-glow-right" aria-hidden="true" />

      <header className="site-header">
        <a className="brand-lockup" href="#top" aria-label="Orbital Suspects home">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-name">ORBITAL<span> / </span>SUSPECTS</span>
        </a>
        <div className="header-status"><span className="live-pulse" /> <span>ALL SYSTEMS NOMINAL</span><i /> <span className="header-version">BROWSER EDITION 01.04</span></div>
        <a className="header-link" href="#how-to-play">HOW TO PLAY <ArrowUpRight size={15} /></a>
      </header>

      <section className="hero-layout" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> SOCIAL DEDUCTION · 2—8 PLAYERS</div>
          <h1>A small crew.<br /><span>One big lie.</span></h1>
          <p className="hero-description">Somebody on this ship is not who they say they are. Finish your tasks, watch your back, and figure out who’s sabotaging the mission.</p>

          <div className="pilot-row">
            <label htmlFor="pilot-name">YOUR CALLSIGN</label>
            <div className="callsign-input-wrap"><span className="callsign-icon"><Users size={15} /></span><input id="pilot-name" maxLength={18} value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Enter a callsign" /><span className="input-count">{playerName.length}/18</span></div>
          </div>

          <div className="primary-actions">
            <button className="play-button" onClick={onPlay} disabled={busy}>
              <span className="play-icon"><Rocket size={18} fill="currentColor" /></span>
              <span><b>{busy && busyAction === 'play' ? 'PREPARING MATCH…' : 'PLAY VS BOTS'}</b><small>Jump in · no waiting</small></span>
              <ArrowRight className="button-arrow" size={19} />
            </button>
            <button className="create-button" onClick={onCreateRoom} disabled={busy}>
              <span className="create-icon"><Users size={17} /></span>
              <span><b>{busy && busyAction === 'create' ? 'OPENING ROOM…' : 'CREATE ROOM'}</b><small>Invite your crew</small></span>
              <ChevronRight size={17} className="button-arrow" />
            </button>
          </div>

          <div className="join-panel">
            <div className="join-heading"><span className="join-label"><Wifi size={15} /> JOIN A CREW</span><span className="join-note"><LockKeyhole size={12} /> ROOM CODE REQUIRED</span></div>
            <div className="join-controls">
              <div className="room-code-input"><input aria-label="Six-character room code" maxLength={6} value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} onKeyDown={(event) => event.key === 'Enter' && onJoinRoom()} placeholder="ENTER CODE" autoComplete="off" spellCheck="false" /><span>{roomCode.length}<i>/6</i></span></div>
              <button className="join-button" onClick={onJoinRoom} disabled={busy || roomCode.length !== 6}><span>{busy && busyAction === 'join' ? 'CONNECTING' : 'JOIN ROOM'}</span><ArrowRight size={16} /></button>
            </div>
          </div>

          {(error || status) && <div className={`menu-feedback ${error ? 'feedback-error' : ''}`} role="status"><CircleDot size={14} /><span>{error || status}</span></div>}

          <div className="hero-footnote"><ShieldCheck size={15} /><span>No downloads. No accounts. Just trust issues.</span><span className="footnote-line" /></div>
        </div>

        <div className="hero-visual-column"><HelmetArtwork />
          <div className="visual-caption"><span><Sparkles size={14} /> YOUR NEXT MISSION</span><b>KEEP YOUR FRIENDS CLOSE.<br /><i>YOUR ENEMIES CLOSER.</i></b><div className="visual-caption-rule" /></div>
        </div>
      </section>

      <section className="feature-strip" id="how-to-play">
        <div className="feature-intro"><span className="strip-kicker">THE MISSION</span><b>Trust is a<br />limited resource.</b></div>
        <div className="feature-card"><span className="feature-icon feature-icon-orange"><Bot size={18} /></span><div><b>Solo? Bring bots.</b><p>Drop into a ready-to-play match with a crew that keeps you guessing.</p></div><ArrowDownRight size={16} className="feature-arrow" /></div>
        <div className="feature-card"><span className="feature-icon feature-icon-blue"><Globe2 size={18} /></span><div><b>Squad? Make a room.</b><p>Play directly with friends over peer-to-peer browser connections.</p></div><ArrowDownRight size={16} className="feature-arrow" /></div>
        <div className="feature-card feature-last"><span className="feature-icon feature-icon-lime"><AudioLines size={18} /></span><div><b>See something? Speak.</b><p>Call an emergency meeting, share your theory, and cast a vote.</p></div><ArrowDownRight size={16} className="feature-arrow" /></div>
      </section>

      <footer className="site-footer"><span>© 2026 ORBITAL SUSPECTS</span><span><i /> BUILT FOR THE UNKNOWN</span><span className="footer-right">A LITTLE IMPOSTOR, A LOT OF SUSPICION <Copy size={12} /></span></footer>
    </main>
  )
}
