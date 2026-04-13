import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { UserMenu } from '../components/UserMenu'
import { SignInButton } from '../components/SignInButton'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'

type DayPoint = {
  date: string   // "Apr 5"
  isoDate: string // "2025-04-05" for sorting
  score: number | null
}

type ChartData = Record<string, DayPoint[]>

const ACTIVITIES = [
  { type: 'unusual_uses', label: 'Unusual Uses' },
  { type: 'similarities', label: 'Similarities' },
  { type: 'differences',  label: 'Differences'  },
]

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 640px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildDayRange(days: number): DayPoint[] {
  const result: DayPoint[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    result.push({ date: formatDay(d), isoDate: toIsoDate(d), score: null })
  }
  return result
}

function aggregateByType(
  docs: { type: string; score: number; isoDate: string }[],
  days: number
): ChartData {
  // Build day range skeleton
  const ranges: ChartData = {}
  for (const { type } of ACTIVITIES) {
    ranges[type] = buildDayRange(days)
  }

  // Group raw docs by type → isoDate → max score
  const maxByTypeDay: Record<string, Record<string, number>> = {}
  for (const { type, score, isoDate } of docs) {
    if (!maxByTypeDay[type]) maxByTypeDay[type] = {}
    const prev = maxByTypeDay[type][isoDate] ?? -Infinity
    maxByTypeDay[type][isoDate] = Math.max(prev, score)
  }

  // Fill in scores
  for (const { type } of ACTIVITIES) {
    for (const point of ranges[type]) {
      const dayMax = maxByTypeDay[type]?.[point.isoDate]
      if (dayMax !== undefined) point.score = dayMax
    }
  }

  return ranges
}

export function AnalyticsPage() {
  const { user, loading } = useAuth()
  const isMobile = useIsMobile()
  const days = isMobile ? 7 : 30

  const [chartData, setChartData] = useState<ChartData>({})
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const since = new Date()
    since.setDate(since.getDate() - 29)
    since.setHours(0, 0, 0, 0)
    const sinceTime = since.getTime()

    // Query by userId only (avoids a composite index requirement).
    // Date filtering is done client-side below.
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', user.uid),
    )

    getDocs(q)
      .then(snap => {
        const raw: { type: string; score: number; isoDate: string }[] = []
        snap.forEach(doc => {
          const d = doc.data()
          if (!d.timestamp || !d.type) return
          const date: Date = d.timestamp.toDate()
          if (date.getTime() < sinceTime) return
          raw.push({
            type: d.type,
            score: Number(d.score ?? 0),
            isoDate: toIsoDate(date),
          })
        })
        setChartData(aggregateByType(raw, 30))
        setDataLoading(false)
      })
      .catch(() => setDataLoading(false))
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

  // Slice to desired day range before rendering
  function visibleData(type: string): DayPoint[] {
    const full = chartData[type] ?? []
    return full.slice(full.length - days)
  }

  return (
    <>
      <UserMenu />
      <main className="page-container">
        <nav className="page-nav">
          <Link to="/" className="back-link">← Home</Link>
        </nav>
        <h1 className="page-title">My Analytics</h1>

        {dataLoading ? (
          <div className="spinner" aria-label="Loading" />
        ) : (
          ACTIVITIES.map(({ type, label }) => {
            const data = visibleData(type)
            const hasData = data.some(p => p.score !== null)
            return (
              <section key={type} className="analytics-section">
                <h2 className="analytics-section__title">{label}</h2>
                {hasData ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                      <CartesianGrid stroke="#2a2a4e" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval={isMobile ? 1 : 4}
                      />
                      <YAxis
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#1a1a2e',
                          border: '1px solid #4a4a6a',
                          borderRadius: 6,
                          color: '#e0e0f0',
                          fontSize: 12,
                        }}
                        labelStyle={{ color: '#9ca3af' }}
                        cursor={{ stroke: '#4a4a6a' }}
                        formatter={(value) => [value ?? '', 'Score']}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#e63946"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#e63946', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#e63946' }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="analytics-empty">No activity yet.</p>
                )}
              </section>
            )
          })
        )}
      </main>
    </>
  )
}
