import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { UserMenu } from '../../components/UserMenu'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../firebase'
import { OBJECTS } from '../utils'
import type { ActivityType } from '../../types/multiplayer'

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  unusual_uses: 'Unusual Uses',
  similarities: 'Similarities',
  differences: 'Differences',
}

function pickObjects(activityType: ActivityType): Record<string, string> {
  if (activityType === 'unusual_uses') {
    return { word: OBJECTS[Math.floor(Math.random() * OBJECTS.length)] }
  }
  const i = Math.floor(Math.random() * OBJECTS.length)
  let j = Math.floor(Math.random() * (OBJECTS.length - 1))
  if (j >= i) j++
  return { object1: OBJECTS[i], object2: OBJECTS[j] }
}

export function MultiplayerSetupPage() {
  const { user, loading } = useAuth()
  const { activityType } = useParams<{ activityType: string }>()
  const navigate = useNavigate()

  const [sessionId] = useState<string>(() => crypto.randomUUID())
  const [copied, setCopied] = useState(false)
  const [joinId, setJoinId] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [starting, setStarting] = useState(false)

  const validActivityType = (activityType as ActivityType) in ACTIVITY_LABELS
    ? (activityType as ActivityType)
    : null

  useEffect(() => {
    if (!user || !validActivityType) return

    setDoc(doc(db, 'multiplayer_sessions', sessionId), {
      activityType: validActivityType,
      status: 'waiting',
      hostId: user.uid,
      createdAt: serverTimestamp(),
      players: {
        [user.uid]: {
          displayName: user.displayName ?? '',
          photoURL: user.photoURL ?? '',
          score: 0,
          answers: [],
          ready: true,
        },
      },
    })
  }, [user, sessionId, validActivityType])

  async function handleCopy() {
    await navigator.clipboard.writeText(sessionId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleStart() {
    if (!user || !validActivityType) return
    setStarting(true)
    try {
      const objects = pickObjects(validActivityType)
      await updateDoc(doc(db, 'multiplayer_sessions', sessionId), {
        status: 'active',
        startedAt: serverTimestamp(),
        ...objects,
      })
      navigate(`/multiplayer/session/${sessionId}`)
    } catch {
      setStarting(false)
    }
  }

  async function handleJoin() {
    if (!user || !joinId.trim()) return
    setJoining(true)
    setJoinError(null)
    try {
      const ref = doc(db, 'multiplayer_sessions', joinId.trim())
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        setJoinError('Session not found.')
        setJoining(false)
        return
      }
      if (snap.data().status === 'finished') {
        setJoinError('This session has already ended.')
        setJoining(false)
        return
      }
      await updateDoc(ref, {
        [`players.${user.uid}.displayName`]: user.displayName ?? '',
        [`players.${user.uid}.photoURL`]: user.photoURL ?? '',
        [`players.${user.uid}.score`]: 0,
        [`players.${user.uid}.answers`]: [],
        [`players.${user.uid}.ready`]: true,
      })
      navigate(`/multiplayer/session/${joinId.trim()}`)
    } catch {
      setJoinError('Something went wrong. Please try again.')
      setJoining(false)
    }
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

  if (!validActivityType) {
    return <Navigate to="/multiplayer" replace />
  }

  return (
    <>
      <UserMenu />
      <main className="page-container">
        <nav className="page-nav">
          <Link to="/multiplayer" className="back-link">← Multiplayer</Link>
        </nav>
        <h1 className="page-title">{ACTIVITY_LABELS[validActivityType]} — Multiplayer</h1>

        <section className="mp-setup__host">
          <h2 className="mp-setup__section-title">Your session ID</h2>
          <div className="mp-setup__id-row">
            <code className="mp-setup__id">{sessionId}</code>
            <button className="mp-setup__copy-btn" onClick={handleCopy} type="button">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="mp-setup__hint">Share this ID with other players before starting.</p>
          <button
            className="mp-setup__start-btn"
            onClick={handleStart}
            disabled={starting}
            type="button"
          >
            {starting ? 'Starting…' : 'Start Game'}
          </button>
        </section>

        <hr className="mp-setup__divider" />

        <section className="mp-setup__join">
          <h2 className="mp-setup__section-title">Join a session</h2>
          <div className="mp-setup__join-row">
            <input
              className="mp-setup__join-input"
              value={joinId}
              onChange={e => { setJoinId(e.target.value); setJoinError(null) }}
              placeholder="Paste session ID…"
              autoComplete="off"
            />
            <button
              className="mp-setup__ready-btn"
              onClick={handleJoin}
              disabled={!joinId.trim() || joining}
              type="button"
            >
              {joining ? 'Joining…' : 'Ready'}
            </button>
          </div>
          {joinError && <p className="mp-setup__error">{joinError}</p>}
        </section>
      </main>
    </>
  )
}
