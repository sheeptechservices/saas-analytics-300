'use client'
import { useSettings } from '@/stores/settingsStore'
import { useSidebar } from '@/stores/sidebarStore'

export function Topbar() {
  const { brandName, tagline, logoUrl } = useSettings()
  const { toggle } = useSidebar()

  return (
    <header style={{
      gridColumn: '1 / -1',
      background: 'var(--white)',
      borderBottom: '1px solid var(--gray3)',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 200,
      height: 60,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={toggle}
          title="Alternar sidebar"
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--gray2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s, color .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray2)' }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/>
          </svg>
        </button>

        {logoUrl ? (
          <img src={logoUrl} alt={brandName} style={{ height: 28, width: 'auto', borderRadius: 6 }} />
        ) : (
          <div style={{
            width: 28, height: 28, background: 'var(--primary)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: 'var(--primary-contrast)',
          }}>
            {brandName.charAt(0).toUpperCase()}
          </div>
        )}

        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--black)' }}>{brandName}</div>
          <div style={{ fontSize: 12, color: 'var(--gray2)', fontWeight: 500 }}>{tagline}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
          background: 'var(--primary-dim)', border: '1px solid var(--primary-mid)',
          color: 'var(--primary-text)',
        }}>
          Demo
        </span>
        <div style={{
          width: 34, height: 34, borderRadius: 100, background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: 'var(--primary-contrast)',
        }}>
          AD
        </div>
      </div>
    </header>
  )
}
