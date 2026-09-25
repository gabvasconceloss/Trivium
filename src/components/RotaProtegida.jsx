import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/ContextoAutenticacao'

export default function RotaProtegida({ children }) {
  const { autenticado, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!autenticado) return <Navigate to="/login" replace />

  return children
}
