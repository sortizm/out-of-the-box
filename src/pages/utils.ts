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

// Optimal String Alignment distance — like Levenshtein but also counts
// adjacent-character transpositions as a single edit.
function osa(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost)
      }
    }
  }
  return d[m][n]
}

export function getMatchType(item: string, input: string): 'exact' | 'partial' | 'none' {
  if (!input) return 'none'
  const a = item.toLowerCase()
  if (a === input) return 'exact'
  if (a.includes(input) || input.includes(a)) return 'partial'
  const threshold = input.length <= 4 ? 1 : 2
  if (osa(a, input) <= threshold) return 'partial'
  // Also check word-by-word for multi-word entries
  if (a.includes(' ') && a.split(' ').some(word => osa(word, input) <= threshold)) return 'partial'
  return 'none'
}
