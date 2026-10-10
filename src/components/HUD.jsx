import { AlertTriangle, Check, CircleDot, Crosshair, Flame, KeyRound, Radio, ScanLine, Shield, Siren, Users, Wrench } from 'lucide-react'
import { TASKS } from '../game/map.js'

function formatState(player, isLocal) {
  if (player.alive === false) return 'OUT OF SIGNAL'
  if (isLocal) return 'YOUR SIGNAL'
  if (player.isBot) return player.botState === 'working' ? 'ON TASK' : 'IN TRANSIT'
  return player.ready ? 'ON THE SHIP' : 'CONNECTING'
}

export default function HUD({
  localPlayer,
  players,
  completedTasks,
  taskCount,
  nearestTask,
  hasBody,
  canUse,
  notice,
  mode,
  onUse,
  onReport,
  onMeeting,
  onSabotage,
  clock,
}) {
  const isImpostor = localPlayer?.role === 'Impostor'
  const progress = taskCount ? Math.min(100, Math.round((completedTasks / taskCount) * 100)) : 0

  return (
    <aside className="game-hud">
      <section className="hud-card identity-card">
        <div className="hud-card-heading"><span>YOUR ASSIGNMENT</span><span className="hud-dots"><i /><i /><i /></span></div>
        <div className={`role-banner ${isImpostor ? 'role-impostor' : ''}`}>
          <span className="role-emblem">{isImpostor ? <Crosshair size={18} /> : <Shield size={18} />}</span>
          <span><small>ROLE</small><b>{isImpostor ? 'IMPOSTOR' : 'CREWMATE'}</b></span>
          <span className="role-chip">{isImpostor ? 'SABOTEUR' : 'CLASS A'}</span>
        </div>
        <div className="assignment-copy">{isImpostor ? 'Blend in. Make sure the mission never makes it home.' : 'Complete your tasks. Keep an eye on the crew.'}</div>
        <div className="clock-row"><span><CircleDot size={12} /> SHIP TIME</span><b>{clock}</b></div>
      </section>

      {!isImpostor && <section className="hud-card tasks-card">
        <div className="hud-card-heading"><span>MISSION TASKS</span><span className="task-fraction">{completedTasks}<i>/</i>{taskCount}</span></div>
        <div className="task-progress-track"><span style={{ width: `${progress}%` }} /></div>
        <div className="task-list">
          {(localPlayer?.assignedTaskIds || TASKS.slice(0, taskCount).map((task) => task.id)).map((taskId) => {
            const task = TASKS.find((item) => item.id === taskId)
            if (!task) return null
            const done = (localPlayer?.completedTaskIds || []).includes(task.id)
            return <div className={`task-row ${done ? 'task-done' : ''}`} key={task.id}><span className="task-check">{done ? <Check size={11} /> : <span />}</span><span><b>{task.label}</b><small>{task.room}</small></span><Wrench size={13} className="task-wrench" /></div>
          })}
        </div>
        <div className="task-hint"><KeyRound size={12} /> Move near a station and press <b>E</b></div>
      </section>}

      <section className="hud-card crew-card">
        <div className="hud-card-heading"><span>CREW MANIFEST</span><span className="manifest-count">{players.filter((player) => player.alive !== false).length.toString().padStart(2, '0')} ACTIVE</span></div>
        <div className="manifest-list">
          {players.map((player) => <div className={`manifest-player ${player.id === localPlayer?.id ? 'manifest-me' : ''} ${player.alive === false ? 'manifest-out' : ''}`} key={player.id}>
            <span className="manifest-mark" style={{ '--player-color': player.color || '#68d0de' }}><i /></span>
            <span className="manifest-name"><b>{player.name}{player.id === localPlayer?.id ? <i>YOU</i> : null}</b><small>{formatState(player, player.id === localPlayer?.id)}</small></span>
            {player.isHost && <span className="host-star">✦</span>}
            <span className={`manifest-indicator ${player.alive === false ? 'indicator-off' : ''}`} />
          </div>)}
        </div>
      </section>

      <section className="hud-actions">
        {notice && <div className="hud-notice"><Radio size={13} />{notice}</div>}
        <div className="quick-actions">
          <button className="quick-action use-action" onClick={onUse} disabled={!canUse} title={nearestTask ? `${nearestTask.label} in ${nearestTask.room}` : 'Move near a task'}><span className="action-symbol"><ScanLine size={17} /></span><span><b>USE</b><small>{nearestTask ? nearestTask.label : 'NO STATION NEARBY'}</small></span><kbd>E</kbd></button>
          <button className={`quick-action report-action ${hasBody ? 'report-ready' : ''}`} onClick={onReport} disabled={!hasBody} title={hasBody ? 'Report the body' : 'No body in range'}><span className="action-symbol"><AlertTriangle size={17} /></span><span><b>REPORT</b><small>{hasBody ? 'BODY DETECTED' : 'NO BODY IN RANGE'}</small></span><kbd>R</kbd></button>
        </div>
        <button className="meeting-button" onClick={onMeeting}><span className="meeting-emblem"><Siren size={17} /></span><span><b>EMERGENCY MEETING</b><small>Call the crew to the table</small></span><kbd>SPACE</kbd></button>
        {isImpostor && <button className="sabotage-button" onClick={onSabotage}><Flame size={15} /> <span>SABOTAGE</span><kbd>Q</kbd></button>}
        <div className="hud-network"><span className="network-led" />{mode === 'bots' ? 'LOCAL SIMULATION' : mode === 'host' ? 'HOST AUTHORITY' : 'P2P CONNECTION'}<span className="network-right"><Users size={12} /> {players.length}/8</span></div>
      </section>
    </aside>
  )
}
