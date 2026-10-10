export const MAP_WIDTH = 1100
export const MAP_HEIGHT = 680

export const ROOMS = [
  { name: 'REACTOR', x: 36, y: 66, w: 226, h: 204, tone: '#8f5f56' },
  { name: 'CAFETERIA', x: 420, y: 66, w: 258, h: 204, tone: '#567487' },
  { name: 'NAVIGATION', x: 838, y: 66, w: 226, h: 204, tone: '#687b61' },
  { name: 'ENGINE BAY', x: 36, y: 410, w: 226, h: 204, tone: '#765e87' },
  { name: 'CARGO BAY', x: 420, y: 410, w: 258, h: 204, tone: '#8b7551' },
  { name: 'SECURITY', x: 838, y: 410, w: 226, h: 204, tone: '#517a79' },
]

export const CORRIDORS = [
  { x: 258, y: 143, w: 169, h: 66 },
  { x: 672, y: 143, w: 174, h: 66 },
  { x: 258, y: 471, w: 169, h: 66 },
  { x: 672, y: 471, w: 174, h: 66 },
  { x: 293, y: 202, w: 64, h: 276 },
  { x: 743, y: 202, w: 64, h: 276 },
  { x: 326, y: 294, w: 449, h: 80 },
  { x: 517, y: 257, w: 66, h: 52 },
  { x: 517, y: 361, w: 66, h: 64 },
]

export const WALKABLE_AREAS = [...ROOMS, ...CORRIDORS]

export const TASKS = [
  { id: 'reactor', label: 'Stabilize reactor', room: 'REACTOR', x: 151, y: 158, color: '#ff795f' },
  { id: 'cafeteria', label: 'Upload nav data', room: 'CAFETERIA', x: 547, y: 157, color: '#58c7ef' },
  { id: 'navigation', label: 'Chart course', room: 'NAVIGATION', x: 948, y: 158, color: '#a9da73' },
  { id: 'engine', label: 'Calibrate engine', room: 'ENGINE BAY', x: 151, y: 512, color: '#bd98ee' },
  { id: 'cargo', label: 'Divert power', room: 'CARGO BAY', x: 547, y: 512, color: '#ffc16b' },
  { id: 'security', label: 'Scan records', room: 'SECURITY', x: 948, y: 512, color: '#5fe0c7' },
]

export const SPAWNS = [
  { x: 546, y: 328 },
  { x: 508, y: 337 },
  { x: 582, y: 330 },
  { x: 530, y: 352 },
  { x: 565, y: 359 },
  { x: 488, y: 349 },
  { x: 605, y: 350 },
  { x: 544, y: 376 },
]

export function isWalkable(x, y, margin = 11) {
  return WALKABLE_AREAS.some((area) => x >= area.x + margin && x <= area.x + area.w - margin && y >= area.y + margin && y <= area.y + area.h - margin)
}
