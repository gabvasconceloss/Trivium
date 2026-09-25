import { NavLink } from 'react-router-dom'
import { IconGrid, IconAward, IconBook, IconActivity, IconCalendar, IconUser, IconLogout } from './icones'

const ITENS_NAV = [
  { to: '/dashboard', label: 'Painel', Icon: IconGrid },
  { to: '/conquistas', label: 'Conquistas', Icon: IconAward },
  { to: '/cadernos', label: 'Meus Cadernos', Icon: IconBook },
  { to: '/atividades', label: 'Atividades', Icon: IconActivity },
  { to: '/calendario', label: 'Calendário', Icon: IconCalendar },
  { to: '/conta', label: 'Conta', Icon: IconUser }
]

export default function MenuLateral({ aberta, onFechar, aluno, turma, onSair }) {
  return (
    <>
      {aberta && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onFechar}
        />
      )}

      <aside
        className={`fixed z-40 top-0 left-0 h-full w-64 bg-surface dark:bg-[#151830] border-r border-border dark:border-white/10
        flex flex-col transition-transform duration-200 ease-out
        ${aberta ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-0`}
      >
        <div className="px-5 pt-safe-top pt-6 pb-5 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center font-display font-bold text-primary text-lg">
            T
          </div>
          <p className="font-display font-bold text-lg text-ink dark:text-white">Trivium</p>
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-1">
          {ITENS_NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onFechar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium touch-target transition-colors ${
                  isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-ink-soft hover:bg-black/[0.03] dark:hover:bg-white/5 dark:text-white/60'
                }`
              }
            >
              <Icon className="shrink-0" width={19} height={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 pb-safe-bottom border-t border-border dark:border-white/10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary-light overflow-hidden shrink-0 flex items-center justify-center text-primary font-semibold text-sm">
            {aluno?.avatar_url ? (
              <img src={aluno.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              aluno?.nome?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-ink dark:text-white">{aluno?.nome}</p>
            <p className="text-xs text-ink-soft truncate">{turma?.nome || '—'}</p>
          </div>
          <button
            onClick={onSair}
            aria-label="Sair"
            title="Encerrar sessão"
            className="touch-target w-8 h-8 flex items-center justify-center rounded-lg text-ink-soft hover:text-danger hover:bg-danger/10 shrink-0"
          >
            <IconLogout width={17} height={17} />
          </button>
        </div>
      </aside>
    </>
  )
}