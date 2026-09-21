import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RotaProtegida from './components/RotaProtegida'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Achievements from './pages/Achievements'
import Notebooks from './pages/Notebooks'
import Notebook from './pages/Notebook'
import Topic from './pages/Topic'
import Activities from './pages/Activities'
import CalendarPage from './pages/Calendar'
import Account from './pages/Account'

function Protegida({ children }) {
  return <RotaProtegida>{children}</RotaProtegida>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/criar-conta" element={<Signup />} />

          <Route path="/dashboard" element={<Protegida><Dashboard /></Protegida>} />
          <Route path="/conquistas" element={<Protegida><Achievements /></Protegida>} />
          <Route path="/cadernos" element={<Protegida><Notebooks /></Protegida>} />
          <Route path="/caderno/:materiaId" element={<Protegida><Notebook /></Protegida>} />
          <Route path="/caderno/:materiaId/topico/:topicoId" element={<Protegida><Topic /></Protegida>} />
          <Route path="/atividades" element={<Protegida><Activities /></Protegida>} />
          <Route path="/calendario" element={<Protegida><CalendarPage /></Protegida>} />
          <Route path="/conta" element={<Protegida><Account /></Protegida>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
