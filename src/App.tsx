import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LandingPage } from './pages/LandingPage'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { UnusualUsesPage } from './pages/UnusualUsesPage'
import { SimilaritiesPage } from './pages/SimilaritiesPage'
import { DifferencesPage } from './pages/DifferencesPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/unusual-uses" element={<UnusualUsesPage />} />
          <Route path="/activities/similarities" element={<SimilaritiesPage />} />
          <Route path="/activities/differences" element={<DifferencesPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
