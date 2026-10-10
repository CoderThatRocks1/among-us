# Orbital Suspects

A serverless, browser-based social-deduction game prototype built with React, Vite, Tailwind CSS v4, HTML Canvas, and PeerJS. Play immediately with AI crewmates, or host/join a room using direct browser-to-browser WebRTC data connections.

## Run locally

Requires Node.js 20.19+ (or 22.12+) and npm.

```bash
npm install
npm run dev
```

Vite prints the local URL. To build and preview the static production bundle:

```bash
npm run build
npm run preview
```

## Play

- **Play vs bots** starts a local match with one human and four AI crew. Use **WASD** or the arrow keys to move, **E** to use a nearby glowing task station, **R** to report a nearby body, **Space** to call an emergency meeting, and **Q** to sabotage when you are the impostor. The bots follow task routes, one bot is an impostor, simulated incidents can leave bodies to report, and bots cast votes during meetings.
- **Create room** opens a six-character PeerJS room code. Share it with up to seven other players. The host starts the mission from the lobby.
- **Join room** connects directly to the host's PeerJS ID. Guests can mark themselves ready, move, complete tasks, chat, call a meeting, and vote.

## Multiplayer notes

PeerJS uses its public signalling service to help browsers establish WebRTC connections; it is not a game server and does not store game state. The host's browser is authoritative for the lobby and broadcasts the game state. Both players need an internet connection and a browser that permits WebRTC. If a network blocks peer-to-peer traffic, the room may not connect. Room codes are temporary and disappear when the host closes the page or leaves.

This is a small playable prototype: local matches include bot incidents and AI voting; online rooms provide direct movement/task sync and meetings/chat/voting, but do not currently simulate bot fill, voice chat, match progression, or persistent accounts.
