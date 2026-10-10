import { useState } from "react";
import { Astronaut, Icon } from "./Icons";
import { botVotes } from "../network/botLogic";

export default function EmergencyModal({ participants, onClose }) {
  const [vote, setVote] = useState(null);
  const [result, setResult] = useState(null);
  const castVote = (target) => {
    const votes = [{ voter: "you", target }, ...botVotes(participants)];
    const counts = votes.reduce(
      (map, item) => ({ ...map, [item.target]: (map[item.target] || 0) + 1 }),
      {},
    );
    const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const winner =
      ordered.length > 1 && ordered[0][1] === ordered[1][1]
        ? "skip"
        : ordered[0][0];
    setVote(target);
    setResult(
      winner === "skip"
        ? "No one was ejected. The crew skipped the vote."
        : `${participants.find((p) => p.id === winner)?.name || "A crewmate"} was ejected. The mission continues.`,
    );
  };
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="meeting-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-title"
      >
        <div className="meeting-head">
          <span className="section-index">EMERGENCY PROTOCOL</span>
          <button onClick={onClose} aria-label="Close meeting">
            <Icon name="close" />
          </button>
        </div>
        <div className="meeting-alert">
          <Icon name="alert" size={27} />
        </div>
        <h2 id="meeting-title">CREW MEETING</h2>
        <p>
          {result || "Something feels off. Who do you think is the impostor?"}
        </p>
        <div className="vote-list">
          {participants.map((p) => (
            <button
              key={p.id}
              disabled={vote !== null}
              onClick={() => castVote(p.id)}
            >
              <Astronaut color={p.color} size={36} />
              <span>{p.name}</span>
              <small>{vote === p.id ? "YOUR VOTE" : "VOTE"}</small>
            </button>
          ))}
        </div>
        {vote === null ? (
          <button className="skip-vote" onClick={() => castVote("skip")}>
            SKIP VOTE <Icon name="arrow" size={17} />
          </button>
        ) : (
          <button className="primary-button meeting-continue" onClick={onClose}>
            CONTINUE MISSION <Icon name="arrow" size={17} />
          </button>
        )}
      </section>
    </div>
  );
}
