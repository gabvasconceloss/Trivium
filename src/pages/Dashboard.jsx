import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import BannerHeader from '../components/BannerHeader'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { primeiroNome } from '../lib/utils'

function calcularProgressoChecklist(blocos = []) {
  let total = 0
  let concluidos = 0
  blocos.forEach((b) => {
    if (b.tipo === 'checklist' && Array.isArray(b.conteudo)) {
      total += b.conteudo.length
      concluidos += b.conteudo.filter((i) => i.concluido).length
    }
  })
  return { total, concluidos }
}

export default function Dashboard() {
  const { aluno } = useAuth()
  const navigate = useNavigate()
  const [continuar, setContinuar] = useState(undefined) // undefined = carregando, null = nada encontrado

  useEffect(() => {
    if (!aluno?.id) return
    let ativo = true

    async function carregar() {
      const { data } = await supabase
        .from('topicos')
        .select('id, titulo, blocos, materia_id, updated_at, materias!inner ( id, nome, cor_tema, aluno_id )')
        .eq('materias.aluno_id', aluno.id)
        .eq('status_concluido', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (ativo) setContinuar(data || null)
    }
    carregar()
    return () => {
      ativo = false
    }
  }, [aluno?.id])

  if (!aluno) return null

  const progresso = continuar ? calcularProgressoChecklist(continuar.blocos) : null
  const pct = progresso && progresso.total > 0 ? Math.round((progresso.concluidos / progresso.total) * 100) : null

  return (
    <AppLayout>
      <BannerHeader
        titulo={`Olá, ${primeiroNome(aluno.nome)}! 👋`}
        subtitulo="Foque nos seus estudos e vá cada vez mais longe."
        icone={<span className="text-[7rem]">🎓</span>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icone="📄" iconeBg="#EAF0FD" label="Tópicos Criados" valor={aluno.topicos_criados} />
        <StatCard icone="🔥" iconeBg="#FDECC8" label="Sequência" valor={`${aluno.sequencia_dias} ${aluno.sequencia_dias === 1 ? 'dia' : 'dias'}`} />
        <StatCard
          icone="📈"
          iconeBg="#E2F7F2"
          label="Média Geral"
          valor={Number(aluno.media_geral) > 0 ? Number(aluno.media_geral).toFixed(1).replace('.', ',') : '—'}
        />
      </div>

      <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5">
        <h2 className="font-display font-semibold text-ink dark:text-white mb-4">Continuar Estudando</h2>

        {continuar === undefined && <div className="h-20 rounded-xl bg-black/5 animate-pulse" />}

        {continuar === null && (
          <p className="text-sm text-ink-soft">
            Você ainda não tem tópicos em andamento. Crie um caderno e comece a estudar!
          </p>
        )}

        {continuar && (
          <div className="rounded-xl bg-canvas dark:bg-white/5 p-4 flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ backgroundColor: `${continuar.materias.cor_tema}22` }}
            >
              🎬
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: continuar.materias.cor_tema }}>
                {continuar.materias.nome}
              </p>
              <p className="font-display font-semibold text-ink dark:text-white truncate">{continuar.titulo}</p>

              {pct !== null ? (
                <>
                  <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mt-2">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-ink-soft mt-1">
                    {pct}% concluído · Faltam {progresso.total - progresso.concluidos} itens
                  </p>
                </>
              ) : (
                <p className="text-xs text-ink-soft mt-1">Continue de onde parou</p>
              )}
            </div>
            <button
              onClick={() => navigate(`/caderno/${continuar.materia_id}/topico/${continuar.id}`)}
              className="shrink-0 h-9 px-4 rounded-xl bg-primary-light text-primary font-semibold text-sm touch-target hover:bg-primary hover:text-white transition-colors"
            >
              Retomar
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
