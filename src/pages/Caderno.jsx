import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/LayoutPrincipal'
import BannerHeader from '../components/CabecalhoBanner'
import TopicCard from '../components/CartaoTopico'
import { SkeletonTopicList } from '../components/EsqueletoLoader'
import { IconArrowLeft } from '../components/icones'
import { useAuth } from '../context/ContextoAutenticacao'
import { useCadernos } from '../hooks/useCadernos'
import { useTopicos } from '../hooks/useTopicos'

export default function Notebook() {
  const { materiaId } = useParams()
  const navigate = useNavigate()
  const { aluno } = useAuth()
  const { cadernos } = useCadernos(aluno?.id)
  const { topicos, carregando, erro, criarTopico, alternarConcluido, excluirTopico, buscarVideos, registrarAssistiu } =
    useTopicos(materiaId)

  const [novoTopico, setNovoTopico] = useState('')
  const [criando, setCriando] = useState(false)

  const caderno = cadernos.find((c) => c.id === materiaId)

  async function handleCriarTopico(e) {
    e.preventDefault()
    if (!novoTopico.trim()) return
    setCriando(true)
    try {
      const novo = await criarTopico(novoTopico.trim())
      setNovoTopico('')
      navigate(`/caderno/${materiaId}/topico/${novo.id}`)
    } finally {
      setCriando(false)
    }
  }

  async function handleExcluir(topico) {
    if (!window.confirm(`Excluir o resumo "${topico.titulo}"?`)) return
    await excluirTopico(topico.id)
  }

  async function handleBuscarVideos(topico) {
    await buscarVideos(topico, caderno?.nome || '')
  }

  return (
    <AppLayout>
      <BannerHeader
        titulo={caderno ? `${caderno.icone} ${caderno.nome}` : 'Caderno'}
        subtitulo={`${topicos.length} ${topicos.length === 1 ? 'resumo' : 'resumos'}`}
        icone={<span className="text-[7rem]">{caderno?.icone}</span>}
        acoes={
          <button
            onClick={() => navigate('/cadernos')}
            className="flex items-center gap-1 text-white/90 hover:text-white text-sm font-medium touch-target"
          >
            <IconArrowLeft width={16} height={16} /> Meus Cadernos
          </button>
        }
      />

      <form onSubmit={handleCriarTopico} className="flex gap-2 mb-6">
        <input
          value={novoTopico}
          onChange={(e) => setNovoTopico(e.target.value)}
          placeholder="Qual assunto você precisa estudar?"
          className="flex-1 h-12 px-4 rounded-xl border border-border bg-surface dark:bg-[#1B1E36] dark:text-white touch-target"
        />
        <button
          type="submit"
          disabled={criando || !novoTopico.trim()}
          className="h-12 px-5 rounded-xl bg-primary text-white font-semibold touch-target disabled:opacity-50"
        >
          + Resumo
        </button>
      </form>

      {carregando && <SkeletonTopicList />}
      {erro && <p className="text-danger text-sm">{erro}</p>}

      {!carregando && topicos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">✏️</p>
          <p className="font-display font-semibold text-lg mb-1 text-ink dark:text-white">Nenhum resumo ainda</p>
          <p className="text-ink-soft text-sm">Digite um assunto acima para criar o primeiro card.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {topicos.map((topico) => (
          <TopicCard
            key={topico.id}
            topico={topico}
            onToggleConcluido={alternarConcluido}
            onExcluir={handleExcluir}
            onBuscarVideos={handleBuscarVideos}
            onAssistir={registrarAssistiu}
            onAbrir={(t) => navigate(`/caderno/${materiaId}/topico/${t.id}`)}
          />
        ))}
      </div>
    </AppLayout>
  )
}
