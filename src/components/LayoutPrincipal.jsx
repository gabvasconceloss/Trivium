import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuLateral from './MenuLateral'
import PromptInstalacaoPWA from './PromptInstalacaoPWA'
import { IconMenu } from './icones'
import { useAuth } from '../context/ContextoAutenticacao'

export default function LayoutPrincipal({ children }) {
  const { aluno, turma, sair } = useAuth()
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)

  async function handleSair() {
    await sair()
    navigate('/login')
  }

  return (
    <div className="flex h-full bg-canvas dark:bg-[#0F1222]">
      <MenuLateral
        aberta={sidebarAberta}
        onFechar={() => setSidebarAberta(false)}
        aluno={aluno}
        turma={turma}
        onSair={handleSair}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden sticky top-0 z-20 bg-surface/90 dark:bg-[#151830]/90 backdrop-blur border-b border-border dark:border-white/10 pt-safe-top">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSidebarAberta(true)}
              aria-label="Abrir menu"
              className="touch-target -ml-1 flex items-center justify-center rounded-xl hover:bg-black/5"
            >
              <IconMenu />
            </button>
            <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center font-display font-bold text-primary text-sm">
              T
            </div>
            <p className="font-display font-bold text-ink dark:text-white">Trivium</p>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-7 pb-10">{children}</main>
      </div>

      <PromptInstalacaoPWA />
    </div>
  )
}