import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Clock3, MessageCircle, Radio, Send, ShieldAlert, SkipForward, Vote, X } from 'lucide-react'

function PlayerMark({ color }) {
  return <span className="vote-mark" style={{ '--player-color': color || '#70cada' }}><i /></span>
}

export default function EmergencyModal({
  players,
  localPlayerId,
  caller,
  votes,
  chatMessages,
  result,
  endsAt,
  onVote,
  onSendChat,
  onClose,
}) {
  const [message, setMessage] = useState('')
  const [seconds, setSeconds] = useState(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
  const chatScrollRef = useRef(null)
  const alivePlayers = players.filter((player) => player.alive !== false)
  const myVote = votes[localPlayerId]
  const callerName = players.find((player) => player.id === caller)?.name || 'A crewmate'
  const voteCounts = useMemo(() => Object.values(votes).reduce((counts, targetId) => {
    counts[targetId] = (counts[targetId] || 0) + 1
    return counts
  }, {}), [votes])

  useEffect(() => {
    const updateTime = () => setSeconds(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    updateTime()
    const timer = window.setInterval(updateTime, 500)
    return () => window.clearInterval(timer)
  }, [endsAt])

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
  }, [chatMessages])

  function sendMessage(event) {
    event.preventDefault()
    const cleanText = message.trim().slice(0, 120)
    if (!cleanText) return
    onSendChat(cleanText)
    setMessage('')
  }

  const ejectedPlayer = result?.ejectedId && result.ejectedId !== 'skip'
    ? players.find((player) => player.id === result.ejectedId)
    : null

  return (
    <div className="meeting-overlay" role="dialog" aria-modal="true" aria-labelledby="meeting-title">
      <div className="meeting-backdrop" />
      <section className="meeting-modal">
        <header className="meeting-header">
          <div className="meeting-alert-icon"><ShieldAlert size={21} /></div>
          <div className="meeting-title-copy"><span className="meeting-overline"><Radio size={12} /> EMERGENCY PROTOCOL // 04</span><h2 id="meeting-title">Crew meeting<span>.</span></h2><p><b>{callerName}</b> called the crew together. Get your story straight.</p></div>
          <div className={`meeting-timer ${seconds <= 8 && !result ? 'timer-urgent' : ''}`}><Clock3 size={14} /><span>{result ? 'VOTING CLOSED' : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`}</span><small>{result ? 'RESULTS IN' : 'DISCUSSION'}</small></div>
          <button className="meeting-close" onClick={onClose} aria-label="Close meeting"><X size={17} /></button>
        </header>

        {result && <div className={`meeting-result ${ejectedPlayer ? 'result-ejected' : 'result-skip'}`}><span className="result-icon">{ejectedPlayer ? <Vote size={17} /> : <SkipForward size={17} />}</span><span><small>VOTE RESULT</small><b>{ejectedPlayer ? `${ejectedPlayer.name} was ejected.` : 'No one was ejected.'}</b></span><span className="result-detail">{ejectedPlayer ? (ejectedPlayer.role === 'Impostor' ? 'IMPOSTOR' : 'NOT THE IMPOSTOR') : 'TIE OR SKIP'}</span></div>}

        <div className="meeting-body">
          <div className="meeting-voting">
            <div className="meeting-section-heading"><span><Vote size={14} /> CAST YOUR VOTE</span><span className="vote-count-label">{Object.keys(votes).length} / {alivePlayers.length} VOTED</span></div>
            {myVote && !result && <div className="voted-banner"><Check size={13} /> VOTE LOCKED IN. WAITING ON THE REST OF THE CREW.</div>}
            <div className="vote-grid">
              {alivePlayers.map((player) => {
                const isMe = player.id === localPlayerId
                const count = voteCounts[player.id] || 0
                return <button className={`vote-candidate ${myVote === player.id ? 'candidate-selected' : ''} ${result?.ejectedId === player.id ? 'candidate-ejected' : ''}`} key={player.id} onClick={() => !myVote && !result && onVote(player.id)} disabled={Boolean(myVote || result || isMe)}>
                  <PlayerMark color={player.color} />
                  <span className="candidate-name"><b>{player.name}{isMe ? <i>YOU</i> : null}</b><small>{player.isBot ? 'CREW MEMBER' : player.isHost ? 'ROOM HOST' : 'CREW MEMBER'}</small></span>
                  {myVote === player.id ? <span className="candidate-vote"><Check size={14} /></span> : count > 0 ? <span className="candidate-vote-count">{count} <small>VOTE{count > 1 ? 'S' : ''}</small></span> : <span className="candidate-target"><ArrowRight size={14} /></span>}
                </button>
              })}
            </div>
            <button className={`skip-vote-button ${myVote === 'skip' ? 'skip-selected' : ''}`} onClick={() => !myVote && !result && onVote('skip')} disabled={Boolean(myVote || result)}><SkipForward size={14} /><span>SKIP VOTE</span><small>{myVote === 'skip' ? 'VOTE LOCKED' : 'Nobody is sus enough?'}</small>{voteCounts.skip > 0 && <b>{voteCounts.skip} VOTES</b>}</button>
          </div>

          <aside className="meeting-chat">
            <div className="meeting-section-heading"><span><MessageCircle size={14} /> CREW CHAT</span><span className="chat-live"><i /> LIVE</span></div>
            <div className="chat-transcript" ref={chatScrollRef}>
              {chatMessages.length === 0 && <div className="chat-empty"><span className="chat-empty-icon"><MessageCircle size={18} /></span><b>Dead quiet in here.</b><p>Share what you saw. Keep it short, crew.</p></div>}
              {chatMessages.map((entry) => <div className={`chat-line ${entry.system ? 'chat-system' : ''}`} key={entry.id}><div className="chat-message-head">{entry.system ? <Radio size={10} /> : <span style={{ color: entry.color }}>{entry.name}</span>}<small>{entry.time || ''}</small></div><p>{entry.text}</p></div>)}
            </div>
            <form className="chat-composer" onSubmit={sendMessage}><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={120} placeholder="Make your case…" aria-label="Write a chat message" disabled={Boolean(result)} /><button type="submit" aria-label="Send message" disabled={!message.trim() || Boolean(result)}><Send size={14} /></button></form>
            <div className="chat-disclaimer"><span /> KEEP IT CIVIL, KEEP IT SUSPICIOUS</div>
          </aside>
        </div>

        <footer className="meeting-footer"><span><span className="footer-led" /> {result ? 'THE CREW HAS REACHED A DECISION' : seconds === 0 ? 'VOTING HAS CLOSED' : 'YOUR VOTE CANNOT BE CHANGED'}</span>{result ? <button onClick={onClose}>BACK TO THE SHIP <ArrowRight size={14} /></button> : <span className="meeting-foot-right">DISCUSS. VOTE. SURVIVE.</span>}</footer>
      </section>
    </div>
  )
}
