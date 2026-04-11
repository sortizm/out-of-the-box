import { useState, useEffect, useRef } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  doc,
  onSnapshot,
  updateDoc,
  runTransaction,
  arrayUnion,
  increment,
} from 'firebase/firestore'
import { UserMenu } from '../../components/UserMenu'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../firebase'
import { formatTime } from '../utils'
import type { MultiplayerSession, PlayerData } from '../../types/multiplayer'

const DURATION_MS = 300_000

function PlayerAvatar({
  photoURL,
  displayName,
  className,
}: {
  photoURL: string
  displayName: string
  className: string
}) {
  const [errored, setErrored] = useState(false)
  const initial = (displayName.trim().charAt(0) || '?').toUpperCase()

  return (
    <div className={className}>
      {photoURL && !errored ? (
        <img src={photoURL} alt={displayName} onError={() => setErrored(true)} />
      ) : (
        initial
      )}
    </div>
  )
}

function rankClass(rank: number) {
  if (rank === 1) return 'mp-results__rank mp-results__rank--1'
  if (rank === 2) return 'mp-results__rank mp-results__rank--2'
  if (rank === 3) return 'mp-results__rank mp-results__rank--3'
  return 'mp-results__rank'
}

function buildQuestion(session: MultiplayerSession): React.ReactNode {
  const obj = (name: string) => (
    <span className="unusual-uses__object">{name}</span>
  )
  if (session.activityType === 'unusual_uses' && session.word) {
    return <>What are the unusual uses of {obj(session.word)}?</>
  }
  if (session.activityType === 'similarities' && session.object1 && session.object2) {
    return <>How are {obj(session.object1)} and {obj(session.object2)} similar?</>
  }
  if (session.activityType === 'differences' && session.object1 && session.object2) {
    return <>What are the differences between {obj(session.object1)} and {obj(session.object2)}?</>
  }
  return null
}

function sortedPlayers(players: Record<string, PlayerData>): [string, PlayerData][] {
  return Object.entries(players).sort((a, b) => b[1].score - a[1].score)
}

export function MultiplayerSessionPage() {
  const { user, loading } = useAuth()
  const { sessionId } = useParams<{ sessionId: string }>()

  const [session, setSession] = useState<MultiplayerSession | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [timeLeft, setTimeLeft] = useState(DURATION_MS / 1000)
  const [inputValue, setInputValue] = useState('')

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasWrittenFinished = useRef(false)

  // Subscribe to session
  useEffect(() => {
    if (!sessionId) return
    const ref = doc(db, 'multiplayer_sessions', sessionId)
    const unsub = onSnapshot(ref, snap => {
      if (!snap.exists()) {
        setNotFound(true)
        return
      }
      setSession(snap.data() as MultiplayerSession)
    })
    return unsub
  }, [sessionId])

  // Timer — derived from server startedAt
  useEffect(() => {
    if (session?.status !== 'active' || !session.startedAt) return

    const startMs = session.startedAt.toMillis()

    function tick() {
      const elapsed = Date.now() - startMs
      const remaining = Math.max(0, Math.floor((DURATION_MS - elapsed) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        tryWriteFinished()
      }
    }

    tick()
    intervalRef.current = setInterval(tick, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [session?.status, session?.startedAt])

  async function tryWriteFinished() {
    if (!sessionId || hasWrittenFinished.current) return
    hasWrittenFinished.current = true
    const ref = doc(db, 'multiplayer_sessions', sessionId)
    try {
      await runTransaction(db, async tx => {
        const snap = await tx.get(ref)
        if (!snap.exists() || snap.data().status !== 'active') return
        tx.update(ref, { status: 'finished' })
      })
    } catch {
      // Another client finished first; onSnapshot will deliver the update
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !session || !sessionId) return
    const trimmed = inputValue.trim()
    if (!trimmed) return
    const myAnswers = session.players[user.uid]?.answers ?? []
    if (myAnswers.some(a => a.toLowerCase() === trimmed.toLowerCase())) return

    const ref = doc(db, 'multiplayer_sessions', sessionId)
    await updateDoc(ref, {
      [`players.${user.uid}.answers`]: arrayUnion(trimmed),
      [`players.${user.uid}.score`]: increment(1),
    })
    setInputValue('')
  }

  if (loading) {
    return (
      <main className="page-container">
        <div className="spinner" aria-label="Loading" />
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (notFound) {
    return (
      <>
        <UserMenu />
        <main className="page-container">
          <nav className="page-nav">
            <Link to="/multiplayer" className="back-link">← Multiplayer</Link>
          </nav>
          <p style={{ color: '#9ca3af' }}>Session not found.</p>
        </main>
      </>
    )
  }

  if (!session) {
    return (
      <main className="page-container">
        <div className="spinner" aria-label="Loading" />
      </main>
    )
  }

  // ── Waiting ──────────────────────────────────────────────────────────────
  if (session.status === 'waiting') {
    return (
      <>
        <UserMenu />
        <main className="page-container">
          <nav className="page-nav">
            <Link to="/multiplayer" className="back-link">← Multiplayer</Link>
          </nav>
          <div className="mp-session__waiting">
            <div className="spinner" aria-label="Loading" />
            <p className="mp-session__waiting-text">Waiting for the host to start the game…</p>
          </div>
        </main>
      </>
    )
  }

  const players = sortedPlayers(session.players)
  const myAnswers = session.players[user.uid]?.answers ?? []
  const trimmedInput = inputValue.trim().toLowerCase()
  const hasExactMatch = myAnswers.some(a => a.toLowerCase() === trimmedInput)

  // ── Finished ─────────────────────────────────────────────────────────────
  if (session.status === 'finished') {
    return (
      <>
        <UserMenu />
        <main className="page-container">
          <nav className="page-nav">
            <Link to="/multiplayer" className="back-link">← Multiplayer</Link>
          </nav>
          <div className="mp-results">
            <h1 className="mp-results__title">Game Over</h1>
            {players.map(([uid, data], index) => (
              <div
                key={uid}
                className={`mp-results__player${uid === user.uid ? ' mp-results__player--me' : ''}`}
              >
                <div className="mp-results__player-header">
                  <span className={rankClass(index + 1)}>#{index + 1}</span>
                  <PlayerAvatar
                    className="mp-results__avatar"
                    photoURL={data.photoURL}
                    displayName={data.displayName || uid.slice(0, 6)}
                  />
                  <span className="mp-results__name">
                    {data.displayName || uid.slice(0, 8)}
                  </span>
                  <span className="mp-results__score">{data.score} pts</span>
                </div>
                {data.answers.length > 0 ? (
                  <ul className="mp-results__answers">
                    {data.answers.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                ) : (
                  <p className="mp-results__no-answers">No answers submitted.</p>
                )}
              </div>
            ))}
            <Link to="/multiplayer" className="activities-btn mp-results__play-again">
              Play Again
            </Link>
          </div>
        </main>
      </>
    )
  }

  // ── Active ────────────────────────────────────────────────────────────────
  return (
    <>
      <UserMenu />
      <main className="page-container">
        <div className="unusual-uses">
          <div className="unusual-uses__header">
            <h1 className="page-title">{buildQuestion(session)}</h1>
            <div className="unusual-uses__meta">
              <span className="unusual-uses__count">{myAnswers.length} answers found</span>
              <span className={`unusual-uses__timer${timeLeft <= 30 ? ' unusual-uses__timer--urgent' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <form className="unusual-uses__form" onSubmit={handleSubmit}>
            <input
              className="unusual-uses__input"
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Enter an answer…"
              autoFocus
              autoComplete="off"
              disabled={timeLeft === 0}
            />
            <button
              className="unusual-uses__submit"
              type="submit"
              disabled={!inputValue.trim() || hasExactMatch || timeLeft === 0}
            >
              Submit
            </button>
          </form>

          {myAnswers.length > 0 && (
            <ul className="unusual-uses__list">
              {myAnswers.map((answer, i) => (
                <li key={i} className="unusual-uses__list-item">{answer}</li>
              ))}
            </ul>
          )}

          <p className="mp-scoreboard-label">Live scores</p>
          <ul className="mp-scoreboard">
            {players.map(([uid, data]) => (
              <li
                key={uid}
                className={`mp-scoreboard__row${uid === user.uid ? ' mp-scoreboard__row--me' : ''}`}
              >
                <PlayerAvatar
                  className="mp-scoreboard__avatar"
                  photoURL={data.photoURL}
                  displayName={data.displayName || uid.slice(0, 6)}
                />
                <span className="mp-scoreboard__name">
                  {data.displayName || uid.slice(0, 8)}
                </span>
                <span className="mp-scoreboard__score">{data.score}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  )
}
