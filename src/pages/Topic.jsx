import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCadernos } from '../hooks/useCadernos'
import { useTopicos } from '../hooks/useTopicos'
import { useAutosave } from '../hooks/useAutosave'
import BlockEditor from '../components/BlockEditor'
import VideoPlayer from '../components/VideoPlayer'
import Sidebar from '../components/Sidebar'
import { IconArrowLeft, IconCloud, IconSliders, IconMoon, IconSun, IconSparkles, IconMenu, IconTrash } from '../components/icons'
import { CORES_CADERNO } from '../lib/utils'

const STATUS_LABEL = { idle: '', saving: 'Salvando…', saved: 'Salvo', error: 'Erro ao salvar' }

export default function Topic() {
  const { materiaId, topicoId } = useParams()
  const navigate = useNavigate()
  const { aluno, turma, sair, atualizarPerfil } = useAuth()
  const { cadernos, atualizarCaderno } = useCadernos(aluno?.id)
  const {
    topicos,
    carregando,
    alternarConcluido,
    excluirTopico,
    renomearTopico,
    salvarBlocos,
    buscarVideos,
    registrarAssistiu
  } = useTopicos(materiaId)

  const caderno = cadernos.find((c) => c.id === materiaId)
  const topico = topicos.find((t) => t.id === topicoId)

  const [blocos, setBlocos] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [erroVideos, setErroVideos] = useState(null)
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [painelConfigAberto, setPainelConfigAberto] = useState(false)

  const blocosAtuais = blocos !== null ? blocos : topico?.blocos ?? []
  const status = useAutosave(blocos, (valor) => salvarBlocos(topicoId, valor))
  const modoEscuro = Boolean(aluno?.preferencias?.modo_escuro)

  useEffect(() => {
    setBlocos(null) // reseta cache local ao trocar de tópico
  }, [topicoId])

  async function handleBuscarVideos() {
    setErroVideos(null)
    setBuscando(true)
    try {
      await buscarVideos(topico, caderno?.nome || '')
    } catch (err) {
      setErroVideos(err.message)
    } finally {
      setBuscando(false)
    }
  }

  async function handleAlternarTema() {
    await atualizarPerfil({ preferencias: { ...aluno.preferencias, modo_escuro: !modoEscuro } })
  }

  async function handleExcluirTopico() {
    if (!window.confirm(`Excluir o resumo "${topico.titulo}"?`)) return
    await excluirTopico(topico.id)
    navigate(`/caderno/${materiaId}`)
  }

  async function handleSair() {
    await sair()
    navigate('/login')
  }

  if (carregando || !topico || !caderno) {
    return (
      <div className="flex h-full">
        <Sidebar aberta={sidebarAberta} onFechar={() => setSidebarAberta(false)} aluno={aluno} turma={turma} onSair={handleSair} />
        <div className="flex-1 p-8">
          <div className="h-8 w-64 rounded-lg bg-black/5 animate-pulse mb-6" />
          <div className="h-64 rounded-2xl bg-black/5 animate-pulse max-w-3xl mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <Sidebar aberta={sidebarAberta} onFechar={() => setSidebarAberta(false)} aluno={aluno} turma={turma} onSair={handleSair} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-surface/90 dark:bg-[#151830]/90 backdrop-blur border-b border-border dark:border-white/10 pt-safe-top">
          <div className="flex items-center gap-2 px-4 md:px-6 py-3">
            <button
              onClick={() => setSidebarAberta(true)}
              className="md:hidden touch-target -ml-1 rounded-xl hover:bg-black/5 flex items-center justify-center"
            >
              <IconMenu />
            </button>

            <button
              onClick={() => navigate(`/caderno/${materiaId}`)}
              className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink dark:hover:text-white touch-target shrink-0"
            >
              <IconArrowLeft width={16} height={16} /> Voltar
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-sm text-ink-soft truncate ml-2">
              <span>{caderno.icone}</span>
              <span className="font-medium text-ink dark:text-white">{caderno.nome}</span>
              <span>›</span>
              <span className="truncate">{topico.titulo}</span>
            </div>

            <div className="flex-1" />

            <span className="hidden sm:flex items-center gap-1.5 text-xs text-ink-soft">
              <IconCloud width={15} height={15} /> {STATUS_LABEL[status] || 'Salvo'}
            </span>

            <div className="relative">
              <button
                onClick={() => setPainelConfigAberto((v) => !v)}
                aria-label="Configurações do caderno"
                className="touch-target w-9 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-ink-soft flex items-center justify-center"
              >
                <IconSliders width={17} height={17} />
              </button>
              {painelConfigAberto && (
                <div className="absolute right-0 mt-1 w-56 rounded-xl bg-surface dark:bg-[#20233F] shadow-card border border-border dark:border-white/10 p-3 z-30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">Cor do caderno</p>
                  <div className="flex gap-2 mb-3">
                    {CORES_CADERNO.map((c) => (
                      <button
                        key={c}
                        onClick={() => atualizarCaderno(materiaId, { cor_tema: c })}
                        className={`w-7 h-7 rounded-full border-2 ${caderno.cor_tema === c ? 'border-ink dark:border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleExcluirTopico}
                    className="w-full flex items-center gap-2 text-sm text-danger hover:bg-danger/10 rounded-lg px-2 py-2 touch-target"
                  >
                    <IconTrash width={15} height={15} /> Excluir este resumo
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleAlternarTema}
              aria-label="Alternar tema"
              className="touch-target w-9 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-ink-soft flex items-center justify-center"
            >
              {modoEscuro ? <IconSun width={17} height={17} /> : <IconMoon width={17} height={17} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-1">
                <button
                  onClick={() => alternarConcluido(topico)}
                  className={`touch-target w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] shrink-0 ${
                    topico.status_concluido ? 'bg-accent border-accent text-white' : 'border-ink-soft/30 text-transparent'
                  }`}
                >
                  ✓
                </button>
                <h1
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => renomearTopico(topico.id, e.currentTarget.textContent)}
                  className="block-text text-2xl md:text-3xl font-display font-bold text-ink dark:text-white flex-1"
                >
                  {topico.titulo}
                </h1>
              </div>

              <div className="mt-6">
                <BlockEditor blocos={blocosAtuais} onChange={setBlocos} />
              </div>

              <div className="border-t border-dashed border-border dark:border-white/10 my-6" />

              {!topico.videos_recomendados?.length ? (
                <button
                  onClick={handleBuscarVideos}
                  disabled={buscando}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-full
                  bg-ai-light text-ai-dark hover:bg-ai hover:text-white transition-colors disabled:opacity-60"
                >
                  {buscando ? (
                    <>
                      <span className="w-4 h-4 border-2 border-ai-dark/40 border-t-ai-dark rounded-full animate-spin" />
                      Buscando aulas…
                    </>
                  ) : (
                    <>
                      <IconSparkles width={15} height={15} /> Buscar Aulas com IA
                    </>
                  )}
                </button>
              ) : (
                <div>
                  <h2 className="font-display font-semibold text-ink dark:text-white mb-3 flex items-center gap-2">
                    <IconSparkles width={16} height={16} className="text-ai" /> Aulas Encontradas
                  </h2>
                  <VideoPlayer
                    videos={topico.videos_recomendados}
                    onAssistir={() => registrarAssistiu(topico.id)}
                    onBuscarNovamente={handleBuscarVideos}
                  />
                </div>
              )}
              {erroVideos && <p className="text-sm text-danger mt-3">{erroVideos}</p>}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
