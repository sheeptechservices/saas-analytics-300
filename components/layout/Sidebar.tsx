'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/stores/sidebarStore'

const navItems = [
  {
    section: 'Principal',
    items: [
      {
        href: '/dashboard', label: 'Dashboard',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>,
      },
      {
        href: '/parametros', label: 'Parâmetros',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="5" x2="13" y2="5"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="11" x2="13" y2="11"/><circle cx="6" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="10" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="7" cy="11" r="1.5" fill="currentColor" stroke="none"/></svg>,
      },
    ],
  },
  {
    section: 'Sistema',
    items: [
      {
        href: '/configuracoes', label: 'Configurações',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>,
      },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { open, pinned, setPinned } = useSidebar()

  return (
    <aside style={{
      background: 'var(--white)',
      borderRight: '1px solid var(--gray3)',
      padding: '20px 0',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      overflowY: pinned && !open ? 'hidden' : 'auto',
      width: 220,
      visibility: pinned && !open ? 'hidden' : 'visible',
      ...(pinned ? {} : {
        position: 'fixed',
        left: 0,
        top: 60,
        height: 'calc(100vh - 60px)',
        zIndex: 300,
        boxShadow: '4px 0 20px rgba(0,0,0,0.12)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      }),
    }}>
      {navItems.map((group) => (
        <div key={group.section}>
          <div style={{
            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: 'var(--gray2)',
            padding: '0 20px', margin: '16px 0 6px',
          }}>
            {group.section}
          </div>
          {group.items.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 20px', fontSize: 13, fontWeight: 600,
                  color: active ? 'var(--black)' : 'var(--gray)',
                  textDecoration: 'none',
                  borderLeft: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
                  background: active ? 'var(--primary-dim)' : 'transparent',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--black)'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--gray)'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  }
                }}
              >
                <span style={{ flexShrink: 0, color: active ? 'var(--black)' : 'var(--gray)' }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}

      {/* Pin toggle */}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '0 20px', marginBottom: 8 }}>
        <button
          onClick={() => setPinned(!pinned)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 600, color: 'var(--gray2)',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px 0', fontFamily: 'inherit',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
            {pinned
              ? <><path d="M10 2L14 6L8 12L5 9L10 2Z"/><line x1="2" y1="14" x2="6" y2="10"/></>
              : <><path d="M9 2L14 7L9 12"/><line x1="2" y1="7" x2="14" y2="7"/></>
            }
          </svg>
          {pinned ? 'Desafixar' : 'Fixar sidebar'}
        </button>
      </div>
    </aside>
  )
}
