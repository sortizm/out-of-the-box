export const OBJECTS: string[] = [
  // Household
  'chair', 'table', 'pillow', 'blanket', 'cup', 'plate', 'bowl', 'bottle',
  'box', 'bucket', 'pot', 'pan', 'towel', 'mirror', 'candle', 'clock',
  'lamp', 'key', 'rope', 'jar', 'tray', 'mug', 'basket', 'mat',
  // Clothing & accessories
  'shirt', 'sock', 'shoe', 'hat', 'scarf', 'belt', 'glove', 'boot',
  'coat', 'apron', 'cap', 'ribbon', 'button', 'ring', 'bag', 'umbrella',
  'necklace', 'bracelet', 'watch', 'glasses',
  // Personal & school
  'comb', 'soap', 'toothbrush', 'sponge', 'brush', 'needle', 'thread', 'pin',
  'pen', 'pencil', 'book', 'eraser', 'paper', 'coin', 'straw', 'balloon',
  // Nature & materials
  'leaf', 'flower', 'seed', 'rock', 'feather', 'shell', 'stick', 'sand',
  'ice', 'bone', 'wood', 'cork', 'cotton', 'clay', 'brick', 'tile',
  'glass', 'wire', 'tape', 'hook', 'string', 'rubber band', 'net', 'drum',
  // Home & everyday small
  'spoon', 'fork', 'knife', 'can', 'plastic bag', 'paper bag', 'frame', 'curtain',
  'scissors', 'chalk', 'crayon', 'stamp', 'envelope', 'card', 'notebook', 'cloth',
  'toothpick', 'bottle cap', 'cushion', 'carpet', 'fence', 'bench', 'fan', 'ball',
  // Simple devices & misc
  'bulb', 'battery', 'plug', 'cable', 'switch', 'lock', 'chain', 'bead',
  'kite', 'doll', 'marble', 'shelf', 'drawer', 'window', 'door', 'ladder',
  'pebble', 'wheel', 'gate', 'swing',
]

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
