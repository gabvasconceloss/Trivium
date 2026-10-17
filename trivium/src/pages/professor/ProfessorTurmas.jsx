import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import BannerHeader from '../../components/BannerHeader'
import Modal from '../../components/Modal'
import { IconPlus, IconUsers, IconTrash } from '../../components/icons'
import { useAuth } from '../../context/AuthContext'
import { useProfessorTurmas } from '../../hooks/useProfessorTurmas'

export default function ProfessorTurmas() {
  const { professor } = useAuth()
  const navigate = useNavigate()
  const { turmas, contagemAlunos, carregando, erro, criarTurma, excluirTurma } = useProfessorTurmas(professor?.id)

  const [modalAberto, setModalAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [escola, setEscola] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [turmaCriada, setTurmaCriada] = useState(null)

  async function handleCriar(e) {
    e.preventDefault()
    if (!nome.trim()) return
    setSalvando(true)
    try {
      const nova = await criarTurma({ nome, escola })
      setTurmaCriada(nova)
      setNome(''); setEscola('')
    } catch (err) {
      alert(err.message)
    } finally {
      setSalvando(false)
    }
  }

  function fecharModal() {
    setModalAberto(false)
    setTurmaCriada(null)
  }

  return (
    <AppLayout>
      <BannerHeader
        titulo="Minhas Turmas"
        subtitulo="Crie turmas e gere o código de acesso para seus alunos."
        icone={<span className="text-[7rem]">🏫</span>}
        acoes={
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-semibold px-3.5 py-2 rounded-xl touch-target">
            <IconPlus width={16} height={16} /> Nova turma
          </button>
        }
      />

      {carregando && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-black/5 animate-pulse" />)}</div>}
      {erro && <p className="text-danger text-sm">{erro}</p>}

      {!carregando && turmas.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🏫</p>
          <p className="font-display font-semibold text-lg mb-1 text-ink dark:text-white">Nenhuma turma ainda</p>
          <p className="text-ink-soft text-sm">Crie sua primeira turma para gerar o código de acesso dos alunos.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {turmas.map((turma) => (
          <div key={turma.id} role="button" tabIndex={0} onClick={() => navigate(`/professor/turmas/${turma.id}`)}
            className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5 cursor-pointer hover:-translate-y-0.5 transition-transform touch-target">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-display font-bold text-lg text-ink dark:text-white">{turma.nome}</h3>
              <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Excluir a turma "${turma.nome}"? Isso remove o vínculo de todos os alunos.`)) excluirTurma(turma.id) }}
                className="w-8 h-8 rounded-lg text-ink-soft hover:bg-danger/10 hover:text-danger flex items-center justify-center shrink-0"><IconTrash width={15} height={15} /></button>
            </div>
            {turma.escola && <p className="text-xs text-ink-soft mb-3">{turma.escola}</p>}
            <div className="flex items-center gap-1.5 text-sm text-ink-soft mb-3"><IconUsers width={15} height={15} /> {contagemAlunos[turma.id] ?? 0} alunos</div>
            <div className="font-mono text-sm font-bold text-primary bg-primary-light rounded-lg px-3 py-1.5 text-center tracking-widest">{turma.codigo_acesso}</div>
          </div>
        ))}
      </div>

      <Modal aberto={modalAberto} titulo={turmaCriada ? 'Turma criada!' : 'Nova turma'} onFechar={fecharModal}>
        {turmaCriada ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-ink-soft text-center">Compartilhe este código com seus alunos para que entrem na turma <strong>{turmaCriada.nome}</strong>:</p>
            <div className="font-mono text-2xl font-bold text-primary bg-primary-light rounded-xl px-6 py-4 tracking-[0.3em]">{turmaCriada.codigo_acesso}</div>
            <button onClick={fecharModal} className="mt-2 h-11 px-6 rounded-xl bg-primary text-white font-semibold touch-target">Concluir</button>
          </div>
        ) : (
          <form onSubmit={handleCriar} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Nome da turma</label>
              <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: 9º Ano A" className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Escola (opcional)</label>
              <input value={escola} onChange={(e) => setEscola(e.target.value)} placeholder="Nome da escola" className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target" />
            </div>
            <button type="submit" disabled={salvando} className="mt-2 h-12 rounded-xl bg-primary text-white font-semibold touch-target disabled:opacity-60">{salvando ? 'Criando…' : 'Criar turma'}</button>
          </form>
        )}
      </Modal>
    </AppLayout>
  )
}
