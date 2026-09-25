import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/ContextoAutenticacao'
import RotaProtegida from './components/RotaProtegida'

// Importação das Páginas em Português
import Entrar from './pages/Login' // Assumindo que o ficheiro se chama Login.jsx. Se for Entrar.jsx, mude aqui!
import Cadastro from './pages/Cadastro'
import Painel from './pages/Dashboard' 
import Conquistas from './pages/Conquistas'
import MeusCadernos from './pages/MeusCadernos'
import Caderno from './pages/Caderno'
import Topico from './pages/Topico'
import Atividades from './pages/Atividades'
import Calendario from './pages/Calendario'
import Conta from './pages/Conta'

function Protegida({ children }) {
  return <RotaProtegida>{children}</RotaProtegida>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Rotas Públicas */}
          <Route path="/login" element={<Entrar />} />
          <Route path="/criar-conta" element={<Cadastro />} />

          {/* Rotas Protegidas */}
          <Route path="/dashboard" element={<Protegida><Painel /></Protegida>} />
          <Route path="/conquistas" element={<Protegida><Conquistas /></Protegida>} />
          <Route path="/cadernos" element={<Protegida><MeusCadernos /></Protegida>} />
          <Route path="/caderno/:materiaId" element={<Protegida><Caderno /></Protegida>} />
          <Route path="/caderno/:materiaId/topico/:topicoId" element={<Protegida><Topico /></Protegida>} />
          <Route path="/atividades" element={<Protegida><Atividades /></Protegida>} />
          <Route path="/calendario" element={<Protegida><Calendario /></Protegida>} />
          <Route path="/conta" element={<Protegida><Conta /></Protegida>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}