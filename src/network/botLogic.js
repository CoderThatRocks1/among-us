export const BOT_NAMES = ["Nova", "Orbit", "Pixel", "Comet"];
export const BOT_COLORS = ["#66d7ce", "#a998f7", "#f27d90", "#a2dc84"];
const WAYPOINTS = [
  [205, 158],
  [405, 161],
  [735, 161],
  [817, 298],
  [735, 475],
  [490, 481],
  [240, 470],
  [127, 315],
  [474, 304],
];
export const TASKS = [
  { x: 207, y: 156, label: "Align engine", room: "ENGINE" },
  { x: 746, y: 155, label: "Calibrate scanner", room: "MED BAY" },
  { x: 815, y: 471, label: "Upload data", room: "COMMS" },
  { x: 243, y: 475, label: "Fix wiring", room: "ELECTRICAL" },
  { x: 484, y: 300, label: "Swipe access card", room: "CAFETERIA" },
];
export const createBots = () =>
  BOT_NAMES.map((name, i) => ({
    id: `bot-${i}`,
    name,
    color: BOT_COLORS[i],
    x: 450 + i * 22,
    y: 289 + i * 18,
    target: (i * 2) % WAYPOINTS.length,
    pause: 0,
  }));

export function stepBots(bots, dt) {
  return bots.map((bot) => {
    let { x, y, target, pause } = bot;
    if (pause > 0) return { ...bot, pause: Math.max(0, pause - dt) };
    const [tx, ty] = WAYPOINTS[target];
    const dx = tx - x,
      dy = ty - y,
      distance = Math.hypot(dx, dy);
    if (distance < 8) {
      target = (target + 1 + (bot.id.charCodeAt(4) % 3)) % WAYPOINTS.length;
      pause = 0.6 + Math.random() * 2;
    } else {
      const step = Math.min(distance, 65 * dt);
      x += (dx / distance) * step;
      y += (dy / distance) * step;
    }
    return { ...bot, x, y, target, pause };
  });
}

export function botVotes(participants) {
  return participants
    .filter((p) => p.id.startsWith("bot-"))
    .map((bot) => ({
      voter: bot.id,
      target:
        Math.random() < 0.35
          ? "skip"
          : participants[Math.floor(Math.random() * participants.length)].id,
    }));
}
