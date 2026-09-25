import LayoutPrincipal from '../components/LayoutPrincipal'
import CabecalhoBanner from '../components/CabecalhoBanner'
import { ConquistaCardDesbloqueada, ConquistaCardProgresso } from '../components/CartaoConquista'
import { useAuth } from '../context/ContextoAutenticacao'
import { useConquistas } from '../hooks/useConquistas'

export default function Conquistas() {
  const { aluno } = useAuth()
  const { conquistadas, proximas, ranking, carregando, erro } = useConquistas(aluno?.id)

  if (carregando) {
    return (
      <LayoutPrincipal>
        <CabecalhoBanner titulo="Conquistas" subtitulo="Acompanhe seu progresso e conquistas." icone={<span className="text-[7rem]">🏆</span>} />
        <div className="grid sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-black/5 animate-pulse" />
          ))}
        </div>
      </LayoutPrincipal>
    )
  }

  return (
    <LayoutPrincipal>
      <CabecalhoBanner titulo="Conquistas" subtitulo="Acompanhe seu progresso e conquistas." icone={<span className="text-[7rem]">🏆</span>} />
      {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

      <h2 className="font-display font-semibold text-ink dark:text-white mb-3">Conquistas Recentes</h2>
      {conquistadas.length === 0 ? (
        <p className="text-sm text-ink-soft mb-6">Nenhuma conquista ainda — comece criando resumos e entregando atividades!</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {conquistadas.slice(0, 3).map((c) => (
            <ConquistaCardDesbloqueada key={c.id} conquista={c} />
          ))}
        </div>
      )}

      <h2 className="font-display font-semibold text-ink dark:text-white mb-3">Próximas Conquistas</h2>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {proximas.map((c) => (
          <ConquistaCardProgresso key={c.id} conquista={c} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5">
          <h2 className="font-display font-semibold text-ink dark:text-white mb-4 flex items-center gap-2">
            🕐 Histórico de Conquistas
          </h2>
          {conquistadas.length === 0 && <p className="text-sm text-ink-soft">Sem conquistas desbloqueadas ainda.</p>}
          <div className="flex flex-col gap-3">
            {conquistadas.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-ink dark:text-white">{c.titulo}</p>
                  <p className="text-xs text-ink-soft">
                    {c.conquistada_em ? new Date(c.conquistada_em).toLocaleDateString('pt-BR') : ''} · {c.descricao}
                  </p>
                </div>
                <span className="text-accent-dark font-semibold shrink-0">+{c.xp_recompensa}XP</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-surface dark:bg-[#1B1E36] shadow-card p-5">
          <h2 className="font-display font-semibold text-ink dark:text-white mb-4 flex items-center gap-2">
            🏆 Ranking da Turma
          </h2>
          {ranking.length === 0 && <p className="text-sm text-ink-soft">Ninguém na turma pontuou ainda.</p>}
          <div className="flex flex-col gap-1">
            {ranking.map((r, i) => (
              <div
                key={r.aluno_id}
                className={`flex items-center gap-3 px-2 py-2 rounded-xl text-sm ${
                  r.eh_voce ? 'bg-primary-light' : ''
                }`}
              >
                <span className="w-6 text-center font-semibold text-ink-soft">{i + 1}</span>
                <span className="flex-1 font-medium text-ink dark:text-white">{r.eh_voce ? 'Você' : r.nome}</span>
                <span className="text-ink-soft text-xs">{r.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LayoutPrincipal>
  )
}