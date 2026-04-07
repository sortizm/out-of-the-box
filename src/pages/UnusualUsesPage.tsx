import { useState, useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { UserMenu } from '../components/UserMenu'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'
import { OBJECTS, formatTime, getMatchType } from './utils'

const DURATION_SECONDS = 300

export function UnusualUsesPage() {
  const { user, loading } = useAuth()

  const [object] = useState<string>(
    () => OBJECTS[Math.floor(Math.random() * OBJECTS.length)]
  )
  const [inputValue, setInputValue] = useState('')
  const [uses, setUses] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(DURATION_SECONDS)
  const [finished, setFinished] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!finished || !user) return
    addDoc(collection(db, 'activities'), {
      userId: user.uid,
      type: 'unusual_uses',
      score: uses.length,
      timestamp: serverTimestamp(),
      word: object,
    })
  }, [finished])

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

  const trimmedInput = inputValue.trim().toLowerCase()
  const hasExactMatch = trimmedInput.length > 0 &&
    uses.some(u => u.toLowerCase() === trimmedInput)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || finished || hasExactMatch) return
    setUses(prev => [...prev, trimmed])
    setInputValue('')
  }

  if (!loading && !user) {
    return <Navigate to="/activities" replace />
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
                disabled={!inputValue.trim() || hasExactMatch}
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
              {uses.map((use, i) => {
                const match = getMatchType(use, trimmedInput)
                if (trimmedInput && match === 'none') return null
                const cls = match === 'exact'
                  ? 'unusual-uses__list-item unusual-uses__list-item--exact'
                  : match === 'partial'
                  ? 'unusual-uses__list-item unusual-uses__list-item--partial'
                  : 'unusual-uses__list-item'
                return <li key={i} className={cls}>{use}</li>
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  )
}
