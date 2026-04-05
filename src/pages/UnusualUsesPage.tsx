import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { UserMenu } from '../components/UserMenu'
import { useAuth } from '../context/AuthContext'

const DURATION_SECONDS = 300

const OBJECTS: string[] = [
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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function UnusualUsesPage() {
  const { user } = useAuth()

  const [object] = useState<string>(
    () => OBJECTS[Math.floor(Math.random() * OBJECTS.length)]
  )
  const [inputValue, setInputValue] = useState('')
  const [uses, setUses] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(DURATION_SECONDS)
  const [finished, setFinished] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || finished) return
    setUses(prev => [...prev, trimmed])
    setInputValue('')
  }

  return (
    <>
      {user && <UserMenu />}
      <main className="page-container">
        <nav className="page-nav">
          <Link to="/activities" className="back-link">← Activities</Link>
        </nav>

        <div className="unusual-uses">
          <div className="unusual-uses__header">
            <h1 className="page-title">
              What are the unusual uses of{' '}
              <span className="unusual-uses__object">{object}</span>?
            </h1>

            <div className="unusual-uses__meta">
              <span className="unusual-uses__count">{uses.length} uses found</span>
              <span className={`unusual-uses__timer${timeLeft <= 30 ? ' unusual-uses__timer--urgent' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {!finished ? (
            <form className="unusual-uses__form" onSubmit={handleSubmit}>
              <input
                className="unusual-uses__input"
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Enter an unusual use…"
                autoFocus
                autoComplete="off"
              />
              <button
                className="unusual-uses__submit"
                type="submit"
                disabled={!inputValue.trim()}
              >
                Submit
              </button>
            </form>
          ) : (
            <div className="unusual-uses__result">
              You found <strong>{uses.length}</strong> unusual use{uses.length !== 1 ? 's' : ''}!
            </div>
          )}

          {uses.length > 0 && (
            <ul className="unusual-uses__list">
              {uses.map((use, i) => (
                <li key={i} className="unusual-uses__list-item">{use}</li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  )
}
