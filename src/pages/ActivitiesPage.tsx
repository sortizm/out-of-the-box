import { Link } from 'react-router-dom'
import { UserMenu } from '../components/UserMenu'
import { SignInButton } from '../components/SignInButton'
import { useAuth } from '../context/AuthContext'

export function ActivitiesPage() {
  const { user, loading } = useAuth()

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

  return (
    <>
      <UserMenu />
      <main className="page-container">
        <nav className="page-nav">
          <Link to="/" className="back-link">← Home</Link>
        </nav>
        <h1 className="page-title">Activities</h1>
        <ul className="activity-list">
          <li>
            <Link to="/activities/unusual-uses" className="activity-card">
              <span className="activity-card__name">Unusual Uses</span>
              <span className="activity-card__desc">
                How many unusual uses can you think of for a random object? You have 5 minutes.
              </span>
            </Link>
          </li>
        </ul>
      </main>
    </>
  )
}
