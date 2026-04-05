import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SignInButton } from '../components/SignInButton'
import { UserMenu } from '../components/UserMenu'

export function LandingPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="landing">
        <div className="spinner" aria-label="Loading" />
      </main>
    )
  }

  return (
    <>
      {user && <UserMenu />}
      <main className="landing">
        <div className="box-icon">
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Box icon"
          >
            {/* Box body */}
            <rect x="20" y="45" width="80" height="60" rx="4" fill="#1a1a2e" stroke="#4a4a6a" strokeWidth="2.5" />
            {/* Box lid */}
            <path d="M14 45 L60 30 L106 45 L60 60 Z" fill="#2a2a4e" stroke="#4a4a6a" strokeWidth="2.5" />
            {/* Lid center line */}
            <line x1="60" y1="30" x2="60" y2="60" stroke="#4a4a6a" strokeWidth="2" />
            {/* Box front crease */}
            <line x1="20" y1="60" x2="100" y2="60" stroke="#4a4a6a" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          <div className="red-dot" aria-hidden="true" />
        </div>

        <h1 className="title">Out of the box</h1>

        <div className="activities-btn-wrapper">
          <Link to="/activities" className="activities-btn">
            Activities
          </Link>
        </div>

        {!user && <SignInButton />}
      </main>
    </>
  )
}
