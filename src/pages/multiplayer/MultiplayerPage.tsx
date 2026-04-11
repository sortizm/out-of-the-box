import { Link } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import { UserMenu } from '../../components/UserMenu'
import { useAuth } from '../../context/AuthContext'

export function MultiplayerPage() {
  const { user, loading } = useAuth()

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

  return (
    <>
      <UserMenu />
      <main className="page-container">
        <nav className="page-nav">
          <Link to="/" className="back-link">← Home</Link>
        </nav>
        <h1 className="page-title">Multiplayer</h1>
        <ul className="activity-list">
          <li>
            <Link to="/multiplayer/setup/unusual_uses" className="activity-card">
              <span className="activity-card__name">Unusual Uses</span>
              <span className="activity-card__desc">
                How many unusual uses can you think of for a random object? You have 5 minutes.
              </span>
            </Link>
          </li>
          <li>
            <Link to="/multiplayer/setup/similarities" className="activity-card">
              <span className="activity-card__name">Similarities</span>
              <span className="activity-card__desc">
                How many similarities can you find between two random objects? You have 5 minutes.
              </span>
            </Link>
          </li>
          <li>
            <Link to="/multiplayer/setup/differences" className="activity-card">
              <span className="activity-card__name">Differences</span>
              <span className="activity-card__desc">
                How many differences can you find between two random objects? You have 5 minutes.
              </span>
            </Link>
          </li>
        </ul>
      </main>
    </>
  )
}
