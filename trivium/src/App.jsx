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
import Profile from './pages/Profile'
import ProfessorTurmas from './pages/professor/ProfessorTurmas'
import ProfessorTurmaDetalhe from './pages/professor/ProfessorTurmaDetalhe'
import ProfessorAtividadeDetalhe from './pages/professor/ProfessorAtividadeDetalhe'
import ProfessorAccount from './pages/professor/ProfessorAccount'

function Protegida({ children, papel }) {
  return <RotaProtegida papel={papel}>{children}</RotaProtegida>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/criar-conta" element={<Signup />} />

          {/* Aluno */}
          <Route path="/dashboard" element={<Protegida papel="aluno"><Dashboard /></Protegida>} />
          <Route path="/conquistas" element={<Protegida papel="aluno"><Achievements /></Protegida>} />
          <Route path="/cadernos" element={<Protegida papel="aluno"><Notebooks /></Protegida>} />
          <Route path="/caderno/:materiaId" element={<Protegida papel="aluno"><Notebook /></Protegida>} />
          <Route path="/caderno/:materiaId/topico/:topicoId" element={<Protegida papel="aluno"><Topic /></Protegida>} />
          <Route path="/atividades" element={<Protegida papel="aluno"><Activities /></Protegida>} />
          <Route path="/calendario" element={<Protegida papel="aluno"><CalendarPage /></Protegida>} />
          <Route path="/perfil" element={<Protegida papel="aluno"><Profile /></Protegida>} />
          <Route path="/conta" element={<Protegida papel="aluno"><Account /></Protegida>} />

          {/* Professor */}
          <Route path="/professor/turmas" element={<Protegida papel="professor"><ProfessorTurmas /></Protegida>} />
          <Route path="/professor/turmas/:turmaId" element={<Protegida papel="professor"><ProfessorTurmaDetalhe /></Protegida>} />
          <Route path="/professor/atividades/:atividadeId" element={<Protegida papel="professor"><ProfessorAtividadeDetalhe /></Protegida>} />
          <Route path="/professor/conta" element={<Protegida papel="professor"><ProfessorAccount /></Protegida>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
