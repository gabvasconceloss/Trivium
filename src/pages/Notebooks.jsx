import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import BannerHeader from '../components/BannerHeader'
import NotebookCard from '../components/NotebookCard'
import Modal from '../components/Modal'
import { SkeletonNotebookGrid } from '../components/Skeleton'
import { IconPlus } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { useCadernos } from '../hooks/useCadernos'
import { CORES_CADERNO, ICONES_CADERNO } from '../lib/utils'

export default function Notebooks() {
  const { aluno } = useAuth()
  const navigate = useNavigate()
  const { cadernos, contagemTopicos, carregando, erro, criarCaderno, excluirCaderno } = useCadernos(aluno?.id)

  const [modalAberto, setModalAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(CORES_CADERNO[0])
  const [icone, setIcone] = useState(ICONES_CADERNO[0])
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(null)

  async function handleCriar(e) {
    e.preventDefault()
    if (!nome.trim()) return
    setSalvando(true)
    try {
      const novo = await criarCaderno({ nome: nome.trim(), corTema: cor, icone })
      setModalAberto(false)
      setNome('')
      navigate(`/caderno/${novo.id}`)
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir(caderno) {
    if (!window.confirm(`Excluir o caderno "${caderno.nome}"? Isso apaga todos os resumos dele.`)) return
    setExcluindo(caderno.id)
    try {
      await excluirCaderno(caderno.id)
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <AppLayout>
      <BannerHeader
        titulo="Meus Cadernos"
        subtitulo="Seu mural de disciplinas e resumos — clique para abrir."
        icone={<span className="text-[7rem]">📚</span>}
        acoes={
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-semibold px-3.5 py-2 rounded-xl touch-target"
          >
            <IconPlus width={16} height={16} /> Novo caderno
          </button>
        }
      />

      {carregando && <SkeletonNotebookGrid />}
      {erro && <p className="text-danger text-sm">{erro}</p>}

      {!carregando && cadernos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-display font-semibold text-lg mb-1 text-ink dark:text-white">Nenhum caderno ainda</p>
          <p className="text-ink-soft text-sm">Toque em "Novo caderno" para começar a estudar.</p>
        </div>
      )}

      {!carregando && cadernos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cadernos.map((caderno) => (
            <NotebookCard
              key={caderno.id}
              caderno={caderno}
              quantidadeTopicos={contagemTopicos[caderno.id] ?? 0}
              onExcluir={excluindo === caderno.id ? undefined : handleExcluir}
            />
          ))}
        </div>
      )}

      <Modal aberto={modalAberto} titulo="Novo caderno" onFechar={() => setModalAberto(false)}>
        <form onSubmit={handleCriar} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Nome da matéria</label>
            <input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Ciências"
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface dark:bg-white/5 dark:text-white touch-target"
              required
            />
          </div>

          <div>
            <p className="block text-sm font-medium mb-2 text-ink dark:text-white">Cor</p>
            <div className="flex gap-2">
              {CORES_CADERNO.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCor(c)}
                  aria-label={`Selecionar cor ${c}`}
                  className={`w-9 h-9 rounded-full touch-target border-2 ${cor === c ? 'border-ink dark:border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium mb-2 text-ink dark:text-white">Ícone</p>
            <div className="flex flex-wrap gap-2">
              {ICONES_CADERNO.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcone(ic)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center touch-target border-2 ${
                    icone === ic ? 'border-primary bg-primary-light' : 'border-border'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="mt-2 h-12 rounded-xl bg-primary text-white font-semibold touch-target disabled:opacity-60"
          >
            {salvando ? 'Criando…' : 'Criar caderno'}
          </button>
        </form>
      </Modal>
    </AppLayout>
  )
}
