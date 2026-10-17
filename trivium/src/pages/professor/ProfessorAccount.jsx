import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import BannerHeader from '../../components/BannerHeader'
import { useAuth } from '../../context/AuthContext'
import { IconLogout } from '../../components/icons'

export default function ProfessorAccount() {
  const { professor, sair } = useAuth()
  const navigate = useNavigate()

  async function handleSair() {
    await sair()
    navigate('/login')
  }

  if (!professor) return null

  return (
    <AppLayout>
      <BannerHeader titulo="Minha Conta" subtitulo="Dados da sua conta de professor(a)." icone={<span className="text-[7rem]">👤</span>} />

      <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-6 max-w-md flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center text-primary font-display font-bold text-2xl mb-3">
          {professor.nome?.[0]?.toUpperCase()}
        </div>
        <p className="font-display font-bold text-lg text-ink dark:text-white mb-1">{professor.nome}</p>
        <p className="text-sm text-ink-soft mb-5">{professor.email}</p>
        <button onClick={handleSair} className="flex items-center gap-2 text-sm font-medium text-danger hover:bg-danger/10 rounded-xl px-3 py-2 touch-target">
          <IconLogout width={16} height={16} /> Encerrar Sessão
        </button>
      </div>
    </AppLayout>
  )
}
