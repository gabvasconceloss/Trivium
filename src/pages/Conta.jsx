import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LayoutPrincipal from '../components/LayoutPrincipal'
import CabecalhoBanner from '../components/CabecalhoBanner'
import { useAuth } from '../context/ContextoAutenticacao'
import { IconLogout } from '../components/icones'

function Toggle({ ativo, onChange }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={ativo}
      className={`w-11 h-6 rounded-full transition-colors relative touch-target ${ativo ? 'bg-primary' : 'bg-black/15 dark:bg-white/15'}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          ativo ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default function Conta() {
  const { aluno, turma, sair, atualizarPerfil } = useAuth()
  const navigate = useNavigate()
  const [salvandoNome, setSalvandoNome] = useState(false)
  const [nomeEdicao, setNomeEdicao] = useState(aluno?.nome || '')
  const [editandoNome, setEditandoNome] = useState(false)

  const prefs = aluno?.preferencias || {}

  async function handleTogglePref(chave) {
    await atualizarPerfil({ preferencias: { ...prefs, [chave]: !prefs[chave] } })
  }

  async function handleSalvarNome() {
    if (!nomeEdicao.trim()) return
    setSalvandoNome(true)
    try {
      await atualizarPerfil({ nome: nomeEdicao.trim() })
      setEditandoNome(false)
    } finally {
      setSalvandoNome(false)
    }
  }

  async function handleSair() {
    await sair()
    navigate('/login')
  }

  if (!aluno) return null

  return (
    <LayoutPrincipal>
      <CabecalhoBanner
        titulo="Minha Conta"
        subtitulo="Gerencie suas preferências e informações pessoais."
        icone={<span className="text-[7rem]">👤</span>}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center text-primary font-display font-bold text-2xl overflow-hidden mb-3">
            {aluno.avatar_url ? (
              <img src={aluno.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              aluno.nome?.[0]?.toUpperCase()
            )}
          </div>

          {editandoNome ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                value={nomeEdicao}
                onChange={(e) => setNomeEdicao(e.target.value)}
                className="h-9 px-3 rounded-lg border border-border text-center text-sm bg-surface dark:bg-white/5 dark:text-white"
              />
              <button onClick={handleSalvarNome} disabled={salvandoNome} className="text-xs text-primary font-semibold">
                Salvar
              </button>
            </div>
          ) : (
            <button onClick={() => setEditandoNome(true)} className="mb-1">
              <p className="font-display font-bold text-lg text-ink dark:text-white">{aluno.nome}</p>
            </button>
          )}

          <span className="text-xs font-medium bg-primary-light text-primary px-2.5 py-1 rounded-full mb-4">
            🎓 Turma: {turma?.nome || '—'}
          </span>

          <div className="w-full text-left border-t border-border dark:border-white/10 pt-4 mt-1 space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-ink-soft font-semibold">Escola</p>
              <p className="text-sm text-ink dark:text-white">{turma?.escola || 'Não informada'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-ink-soft font-semibold">E-mail</p>
              <p className="text-sm text-ink dark:text-white">{aluno.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-6">
          <h2 className="font-display font-semibold text-ink dark:text-white mb-4">Preferências do Sistema</h2>

          <div className="flex items-center justify-between py-3 border-b border-border dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center">☀️</span>
              <div>
                <p className="text-sm font-medium text-ink dark:text-white">Aparência</p>
                <p className="text-xs text-ink-soft">{prefs.modo_escuro ? 'Modo Escuro' : 'Modo Claro'}</p>
              </div>
            </div>
            <Toggle ativo={Boolean(prefs.modo_escuro)} onChange={() => handleTogglePref('modo_escuro')} />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-ai-light flex items-center justify-center">🔔</span>
              <div>
                <p className="text-sm font-medium text-ink dark:text-white">Notificações de Aulas da IA</p>
                <p className="text-xs text-ink-soft">Receba alertas de novas curadorias</p>
              </div>
            </div>
            <Toggle ativo={Boolean(prefs.notificacoes_ia)} onChange={() => handleTogglePref('notificacoes_ia')} />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center">👥</span>
              <div>
                <p className="text-sm font-medium text-ink dark:text-white">Compartilhamento com a Turma</p>
                <p className="text-xs text-ink-soft">Aparecer no ranking da turma</p>
              </div>
            </div>
            <Toggle ativo={Boolean(prefs.compartilhar_turma)} onChange={() => handleTogglePref('compartilhar_turma')} />
          </div>

          <button
            onClick={handleSair}
            className="mt-5 flex items-center gap-2 text-sm font-medium text-danger hover:bg-danger/10 rounded-xl px-3 py-2 touch-target"
          >
            <IconLogout width={16} height={16} /> Encerrar Sessão
          </button>
        </div>
      </div>
    </LayoutPrincipal>
  )
}