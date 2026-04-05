import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <div className="user-menu">
      <button
        className="user-avatar-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        aria-expanded={open}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName ?? 'User'} className="avatar" referrerPolicy="no-referrer" />
        ) : (
          <div className="avatar avatar-fallback">
            {user.displayName?.[0] ?? '?'}
          </div>
        )}
      </button>

      {open && (
        <div className="user-dropdown">
          <p className="user-name">{user.displayName}</p>
          <p className="user-email">{user.email}</p>
          <hr className="dropdown-divider" />
          <button
            className="sign-out-btn"
            onClick={() => { signOut(); setOpen(false) }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
