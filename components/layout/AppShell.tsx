'use client'
import { useSidebar } from '@/stores/sidebarStore'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { open, pinned, setOpen } = useSidebar()
  const inGrid = open && pinned

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: inGrid ? '220px 1fr' : '0px 1fr',
      gridTemplateRows: '60px 1fr',
      minHeight: '100vh',
      transition: 'grid-template-columns 0.25s ease',
    }}>
      <Topbar />

      {open && !pinned && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 290,
            background: 'rgba(18,19,22,0.25)',
            animation: 'fadeIn .2s ease both',
          }}
        />
      )}

      <Sidebar />

      <main style={{ padding: '32px 36px', overflowY: 'auto', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
