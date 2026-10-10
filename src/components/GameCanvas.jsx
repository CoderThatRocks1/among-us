import { useEffect, useRef } from "react";
import { createBots, stepBots, TASKS } from "../network/botLogic";
import { Icon } from "./Icons";

const WIDTH = 960,
  HEIGHT = 620;
const ROOMS = [
  { x: 36, y: 39, w: 276, h: 225, label: "ENGINE ROOM", tint: "#172c3e" },
  { x: 326, y: 39, w: 306, h: 225, label: "NAVIGATION", tint: "#1a2b3d" },
  { x: 646, y: 39, w: 278, h: 225, label: "MED BAY", tint: "#1a3240" },
  { x: 36, y: 280, w: 276, h: 298, label: "REACTOR", tint: "#212b3e" },
  { x: 326, y: 280, w: 306, h: 298, label: "CAFETERIA", tint: "#1e3342" },
  { x: 646, y: 280, w: 278, h: 298, label: "COMMS", tint: "#262c42" },
];
const DOTS = Array.from({ length: 75 }, (_, i) => ({
  x: (i * 433 + 71) % 960,
  y: (i * 313 + 147) % 620,
  r: i % 6 === 0 ? 1.5 : 0.7,
}));
const KEYS = {
  w: [0, -1],
  arrowup: [0, -1],
  s: [0, 1],
  arrowdown: [0, 1],
  a: [-1, 0],
  arrowleft: [-1, 0],
  d: [1, 0],
  arrowright: [1, 0],
};

function rounded(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
function astronaut(ctx, p, isYou, time) {
  ctx.save();
  ctx.translate(p.x, p.y + Math.sin(time / 480 + p.x) * 1.5);
  ctx.fillStyle = "#050d19aa";
  ctx.beginPath();
  ctx.ellipse(0, 15, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (isYou) {
    ctx.beginPath();
    ctx.arc(0, -2, 25, 0, Math.PI * 2);
    ctx.strokeStyle = "#f8bc5d88";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  rounded(ctx, 10, -10, 8, 21, 4, "#101e30");
  rounded(ctx, -13, -16, 26, 29, 9, "#101e30");
  rounded(ctx, -10, -13, 20, 25, 7, p.color);
  rounded(ctx, -13, 6, 10, 12, 3, p.color, "#101e30");
  rounded(ctx, 3, 6, 10, 12, 3, p.color, "#101e30");
  rounded(ctx, -8, -9, 22, 13, 6, "#122a3e");
  rounded(ctx, -6, -8, 18, 10, 5, "#a4e6e9");
  rounded(ctx, -3, -7, 9, 3, 2, "#e5ffffa8");
  ctx.font = "600 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = isYou ? "#ffcf77" : "#e6eef4";
  ctx.fillText(isYou ? `${p.name} (YOU)` : p.name, 0, -25);
  ctx.restore();
}
function drawMap(ctx, time, completed) {
  ctx.fillStyle = "#090f1c";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  DOTS.forEach((dot) => {
    ctx.fillStyle = "#bed4ef55";
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fill();
  });
  rounded(ctx, 14, 16, 932, 586, 25, "#101c2c", "#39546a");
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(17, 19, 926, 580, 22);
  ctx.clip();
  for (let x = 20; x < WIDTH; x += 30) {
    ctx.strokeStyle = "#95b9ce08";
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, 600);
    ctx.stroke();
  }
  for (let y = 20; y < HEIGHT; y += 30) {
    ctx.strokeStyle = "#95b9ce08";
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(940, y);
    ctx.stroke();
  }
  ROOMS.forEach((room) => {
    rounded(ctx, room.x, room.y, room.w, room.h, 15, room.tint, "#365164");
    ctx.strokeStyle = "#90a9b116";
    ctx.lineWidth = 1;
    for (let x = room.x + 28; x < room.x + room.w; x += 29) {
      ctx.beginPath();
      ctx.moveTo(x, room.y + 5);
      ctx.lineTo(x, room.y + room.h - 5);
      ctx.stroke();
    }
    ctx.font = "700 10px Inter, system-ui, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillStyle = "#8ca6b57f";
    ctx.textAlign = "left";
    ctx.fillText(room.label, room.x + 20, room.y + 28);
  });
  // open illuminated corridors through the rooms
  rounded(ctx, 293, 133, 42, 72, 4, "#273f4d");
  rounded(ctx, 622, 133, 43, 72, 4, "#273f4d");
  rounded(ctx, 293, 412, 42, 72, 4, "#273f4d");
  rounded(ctx, 622, 412, 43, 72, 4, "#273f4d");
  rounded(ctx, 442, 248, 82, 49, 4, "#2a4551");
  // panels and small ship details
  [
    [64, 75],
    [365, 86],
    [672, 86],
    [68, 508],
    [363, 514],
    [673, 513],
  ].forEach(([x, y], i) => {
    rounded(ctx, x, y, 68, 11, 3, "#0e1c2c", "#406074");
    rounded(
      ctx,
      x + 6,
      y + 4,
      25 + i * 3,
      3,
      2,
      i % 2 ? "#efac6766" : "#6ccfca66",
    );
  });
  rounded(ctx, 415, 330, 140, 65, 27, "#142a38", "#395a68");
  rounded(ctx, 452, 341, 66, 39, 13, "#294755", "#6795a066");
  TASKS.forEach((task, i) => {
    const done = completed.includes(i);
    const pulse = 0.65 + Math.sin(time / 360 + i) * 0.2;
    ctx.beginPath();
    ctx.arc(task.x, task.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = done ? "#4c8d8790" : `rgba(242,187,96,${pulse * 0.27})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(task.x, task.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = done ? "#62c5af" : "#f7bd69";
    ctx.fill();
    ctx.font = "700 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#182d36";
    ctx.fillText(done ? "✓" : "!", task.x, task.y + 4);
  });
  ctx.restore();
  ctx.strokeStyle = "#7dc5cf44";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(14, 16, 932, 586, 25);
  ctx.stroke();
}

export default function GameCanvas({
  mode,
  localId,
  name,
  color,
  players,
  completed,
  onMove,
  onNearbyTask,
  paused,
}) {
  const canvasRef = useRef(null);
  const localRef = useRef({
    id: localId,
    name,
    x: 480,
    y: 314,
    color,
  });
  const botRef = useRef(createBots());
  const keysRef = useRef(new Set());
  const dataRef = useRef({ players, completed, paused, onMove, onNearbyTask });
  useEffect(() => {
    dataRef.current = { players, completed, paused, onMove, onNearbyTask };
  }, [players, completed, paused, onMove, onNearbyTask]);
  useEffect(() => {
    localRef.current.color = color;
  }, [color]);
  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      if (KEYS[k]) {
        e.preventDefault();
        keysRef.current.add(k);
      }
    };
    const up = (e) => keysRef.current.delete(e.key.toLowerCase());
    const blur = () => keysRef.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frame,
      last = performance.now(),
      lastSend = 0,
      lastNearby = -2;
    const animate = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const {
        players: peers,
        completed: done,
        paused: isPaused,
        onMove: move,
        onNearbyTask: nearby,
      } = dataRef.current;
      const me = localRef.current;
      if (!isPaused) {
        let dx = 0,
          dy = 0;
        keysRef.current.forEach((k) => {
          dx += KEYS[k]?.[0] || 0;
          dy += KEYS[k]?.[1] || 0;
        });
        if (dx || dy) {
          const m = Math.hypot(dx, dy);
          me.x = Math.max(42, Math.min(WIDTH - 42, me.x + (dx / m) * 165 * dt));
          me.y = Math.max(
            44,
            Math.min(HEIGHT - 44, me.y + (dy / m) * 165 * dt),
          );
        }
        if (mode === "bots") botRef.current = stepBots(botRef.current, dt);
        if (now - lastSend > 50) {
          move?.(me.x, me.y);
          lastSend = now;
        }
        const index = TASKS.findIndex(
          (task, i) =>
            !done.includes(i) && Math.hypot(task.x - me.x, task.y - me.y) < 57,
        );
        if (index !== lastNearby) {
          nearby?.(index);
          lastNearby = index;
        }
      }
      drawMap(ctx, now, done);
      const others =
        mode === "bots"
          ? botRef.current
          : peers.filter((p) => p.id !== localId);
      others.forEach((p) => astronaut(ctx, p, false, now));
      astronaut(ctx, me, true, now);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [mode, localId]);
  const press = (key, active) => {
    if (active) keysRef.current.add(key);
    else keysRef.current.delete(key);
  };
  return (
    <div className="canvas-shell">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        aria-label="Top-down spaceship game map"
      />
      <div className="map-overlay">
        <span>
          <span className="live-dot" /> THE SKELD · DECK 01
        </span>
        <span>✳ LIVE MAP</span>
      </div>
      <div className="mobile-pad" aria-label="Movement controls">
        <button
          aria-label="Move up"
          onPointerDown={(e) => {
            e.preventDefault();
            press("w", true);
          }}
          onPointerUp={() => press("w", false)}
          onPointerCancel={() => press("w", false)}
        >
          ↑
        </button>
        <div>
          <button
            aria-label="Move left"
            onPointerDown={(e) => {
              e.preventDefault();
              press("a", true);
            }}
            onPointerUp={() => press("a", false)}
            onPointerCancel={() => press("a", false)}
          >
            ←
          </button>
          <button
            aria-label="Move down"
            onPointerDown={(e) => {
              e.preventDefault();
              press("s", true);
            }}
            onPointerUp={() => press("s", false)}
            onPointerCancel={() => press("s", false)}
          >
            ↓
          </button>
          <button
            aria-label="Move right"
            onPointerDown={(e) => {
              e.preventDefault();
              press("d", true);
            }}
            onPointerUp={() => press("d", false)}
            onPointerCancel={() => press("d", false)}
          >
            →
          </button>
        </div>
      </div>
      <div className="canvas-corner">
        <Icon name="keyboard" size={17} /> WASD / ARROW KEYS TO MOVE
      </div>
    </div>
  );
}
