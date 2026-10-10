# Among Stars

A browser-only social deduction game prototype. Play immediately with four roaming AI crewmates, or open a private PeerJS room and invite friends with a six-character code. No application backend or account is required.

## Run locally

```sh
npm install
npm run dev
```

Open the URL printed by Vite. `npm run build` makes a production bundle; `npm run lint` checks source files.

## How to play

- Enter a nickname, then choose **Play vs Bots**, **Create Room**, or **Join Room**.
- The host shares the six-character code. Guests enter it to join; the host starts when at least two people are present (up to ten total).
- Move with **WASD** / arrow keys or the touch D-pad. Approach a glowing marker and click **Use** to complete a task. Solo mode also has an emergency meeting with bot votes.
- The host's browser owns the lobby and broadcasts player positions at 20 Hz. Closing the host tab ends the room. If a guest leaves, the lobby roster updates.

## Architecture & limitations

React 19, Vite 8, Tailwind CSS 4, Canvas 2D, and PeerJS. `src/network/peerManager.js` maps room codes to PeerJS IDs and handles host/guest connections. WebRTC carries data directly between browsers, but PeerJS's public signaling service and STUN connectivity are still needed to establish connections. Some networks may require TURN and thus may not connect with this default configuration. Bots use a lightweight waypoint/pause state machine in `src/network/botLogic.js`.

This is an early playable prototype, not a complete Among Us clone. Multiplayer synchronizes lobby and movement; task progress is currently local to each browser, and multiplayer chat, voting, sabotage, kills, collision, and win conditions are not yet implemented. Bot-mode votes are simulated; there is no ejection or win condition yet. Do not use room codes as an authentication/security boundary.

## Verification

```sh
npm test       # bot logic and mocked peer-to-peer room protocol
npm run lint   # source linting
npm run build  # production bundle
```
