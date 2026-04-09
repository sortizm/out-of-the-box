import { useState, useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { UserMenu } from '../components/UserMenu'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'
import { OBJECTS, formatTime, getMatchType } from './utils'

const DURATION_SECONDS = 300

export function SimilaritiesPage() {
  const { user, loading } = useAuth()

  const [[object1, object2]] = useState<[string, string]>(() => {
    const i = Math.floor(Math.random() * OBJECTS.length)
    let j = Math.floor(Math.random() * (OBJECTS.length - 1))
    if (j >= i) j++
    return [OBJECTS[i], OBJECTS[j]]
  })

  const [inputValue, setInputValue] = useState('')
  const [answers, setAnswers] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(DURATION_SECONDS)
  const [finished, setFinished] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!finished || !user) return
    addDoc(collection(db, 'activities'), {
      userId: user.uid,
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      type: 'similarities',
      score: answers.length,
      timestamp: serverTimestamp(),
      object1,
      object2,
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
    answers.some(a => a.toLowerCase() === trimmedInput)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || finished || hasExactMatch) return
    setAnswers(prev => [...prev, trimmed])
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

        <div className="similarities">
          <div className="similarities__header">
            <h1 className="page-title">
              How are{' '}
              <span className="similarities__object">{object1}</span>
              {' '}and{' '}
              <span className="similarities__object">{object2}</span>
              {' '}similar?
            </h1>

            <div className="similarities__meta">
              <span className="similarities__count">{answers.length} similarit{answers.length !== 1 ? 'ies' : 'y'} found</span>
              <span className={`similarities__timer${timeLeft <= 30 ? ' similarities__timer--urgent' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {!finished ? (
            <form className="similarities__form" onSubmit={handleSubmit}>
              <input
                className="similarities__input"
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Enter a similarity…"
                autoFocus
                autoComplete="off"
              />
              <button
                className="similarities__submit"
                type="submit"
                disabled={!inputValue.trim() || hasExactMatch}
              >
                Submit
              </button>
            </form>
          ) : (
            <div className="similarities__result">
              You found <strong>{answers.length}</strong> similarit{answers.length !== 1 ? 'ies' : 'y'}!
            </div>
          )}

          {answers.length > 0 && (
            <ul className="similarities__list">
              {answers.map((answer, i) => {
                const match = getMatchType(answer, trimmedInput)
                if (trimmedInput && match === 'none') return null
                const cls = match === 'exact'
                  ? 'similarities__list-item similarities__list-item--exact'
                  : match === 'partial'
                  ? 'similarities__list-item similarities__list-item--partial'
                  : 'similarities__list-item'
                return <li key={i} className={cls}>{answer}</li>
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  )
}
