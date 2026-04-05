import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LandingPage } from './pages/LandingPage'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { UnusualUsesPage } from './pages/UnusualUsesPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/unusual-uses" element={<UnusualUsesPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
