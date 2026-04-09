import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { UserMenu } from '../components/UserMenu'
import { SignInButton } from '../components/SignInButton'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'

type UserEntry = {
  userId: string
  displayName: string
  photoURL: string
  totalScore: number
}

function getWeekBounds(): { start: Timestamp; end: Timestamp } {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, …
  const diffToMon = (day === 0 ? -6 : 1 - day)
  const mon = new Date(now)
  mon.setDate(now.getDate() + diffToMon)
  mon.setHours(0, 0, 0, 0)
  const nextMon = new Date(mon)
  nextMon.setDate(mon.getDate() + 7)
  return {
    start: Timestamp.fromDate(mon),
    end: Timestamp.fromDate(nextMon),
  }
}

function Avatar({ photoURL, displayName, className }: { photoURL: string; displayName: string; className: string }) {
  const [errored, setErrored] = useState(false)
  const initial = displayName.trim().charAt(0).toUpperCase() || '?'

  if (photoURL && !errored) {
    return (
      <img
        className={className}
        src={photoURL}
        alt={displayName}
        onError={() => setErrored(true)}
      />
    )
  }
  return (
    <div className={`${className} leaderboard__avatar-fallback`}>
      {initial}
    </div>
  )
}

function rankClass(rank: number) {
  if (rank === 1) return 'leaderboard__rank leaderboard__rank--1'
  if (rank === 2) return 'leaderboard__rank leaderboard__rank--2'
  if (rank === 3) return 'leaderboard__rank leaderboard__rank--3'
  return 'leaderboard__rank'
}

function Row({ entry, rank, isMe }: { entry: UserEntry; rank: number; isMe: boolean }) {
  const nameParts = entry.displayName.trim().split(/\s+/)
  const firstName = nameParts[0] ?? ''
  const surname = nameParts.slice(1).join(' ')

  return (
    <li className={`leaderboard__row${isMe ? ' leaderboard__row--me' : ''}`}>
      <Avatar
        className="leaderboard__avatar"
        photoURL={entry.photoURL}
        displayName={entry.displayName || '?'}
      />
      <div className="leaderboard__info">
        <div className="leaderboard__name">{firstName || entry.userId.slice(0, 8)}</div>
        {surname && <div className="leaderboard__surname">{surname}</div>}
      </div>
      <div className="leaderboard__score">{entry.totalScore} pts</div>
      <div className={rankClass(rank)}>#{rank}</div>
    </li>
  )
}

export function LeaderboardPage() {
  const { user, loading } = useAuth()
  const [entries, setEntries] = useState<UserEntry[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const { start, end } = getWeekBounds()
    const q = query(
      collection(db, 'activities'),
      where('timestamp', '>=', start),
      where('timestamp', '<', end),
    )
    getDocs(q).then(snap => {
      const map = new Map<string, UserEntry>()
      snap.forEach(doc => {
        const d = doc.data()
        const uid: string = d.userId ?? ''
        if (!uid) return
        const existing = map.get(uid)
        if (existing) {
          existing.totalScore += Number(d.score ?? 0)
          if (d.displayName) existing.displayName = d.displayName
          if (d.photoURL) existing.photoURL = d.photoURL
        } else {
          map.set(uid, {
            userId: uid,
            displayName: d.displayName ?? '',
            photoURL: d.photoURL ?? '',
            totalScore: Number(d.score ?? 0),
          })
        }
      })
      const sorted = Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore)
      setEntries(sorted)
      setDataLoading(false)
    }).catch(() => setDataLoading(false))
  }, [user])

  if (loading) {
    return (
      <main className="page-container">
        <div className="spinner" aria-label="Loading" />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="page-container">
        <SignInButton />
      </main>
    )
  }

  const top10 = entries.slice(0, 10)
  const myRank = entries.findIndex(e => e.userId === user.uid) + 1
  const myEntry = entries.find(e => e.userId === user.uid)
  const meInTop10 = myRank >= 1 && myRank <= 10

  return (
    <>
      <UserMenu />
      <main className="page-container">
        <nav className="page-nav">
          <Link to="/activities" className="back-link">← Activities</Link>
        </nav>
        <h1 className="page-title">Weekly Leaderboard</h1>

        {dataLoading ? (
          <div className="spinner" aria-label="Loading" />
        ) : entries.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No activity this week yet. Be the first!</p>
        ) : (
          <>
            <ul className="leaderboard">
              {top10.map((entry, i) => (
                <Row key={entry.userId} entry={entry} rank={i + 1} isMe={entry.userId === user.uid} />
              ))}
            </ul>

            {!meInTop10 && myEntry && (
              <>
                <hr className="leaderboard__separator" />
                <ul className="leaderboard">
                  <Row entry={myEntry} rank={myRank} isMe />
                </ul>
              </>
            )}
          </>
        )}
      </main>
    </>
  )
}
