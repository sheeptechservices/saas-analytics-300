'use client'
import { useState } from 'react'
import { useSettings } from '@/stores/settingsStore'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontFamily: 'Manrope, sans-serif',
  fontSize: 14, fontWeight: 500, color: 'var(--black)',
  background: 'var(--white)', border: '1px solid var(--gray3)',
  borderRadius: 8, outline: 'none',
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...props.style }}
      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-dim)' }}
      onBlur={e => { e.target.style.borderColor = 'var(--gray3)'; e.target.style.boxShadow = 'none' }}
    />
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray)', letterSpacing: '0.04em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function ConfiguracoesPage() {
  const { brandName, tagline, logoUrl, setBrandName, setTagline, setLogoUrl } = useSettings()
  const [localName, setLocalName] = useState(brandName)
  const [localTagline, setLocalTagline] = useState(tagline)
  const [localLogo, setLocalLogo] = useState(logoUrl)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      setBrandName(localName || 'SASBI 3D')
      setTagline(localTagline || 'Analytics · Insights · IA')
      setLogoUrl(localLogo)
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 600)
  }

  const displayName = localName || 'SASBI 3D'
  const displayTagline = localTagline || 'Analytics · Insights · IA'

  return (
    <div>
      {/* Header */}
      <div className="animate-slide-up delay-1" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.02em' }}>Configurações</div>
        <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>Personalize a identidade visual da plataforma</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: Identidade Visual */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="animate-slide-up delay-2" style={{
            background: 'var(--white)', border: '1px solid var(--gray3)',
            borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray2)', paddingBottom: 14, borderBottom: '1px solid var(--gray3)', marginBottom: 20 }}>
              Identidade Visual
            </div>

            <Field label="NOME DA MARCA">
              <StyledInput
                value={localName}
                onChange={e => setLocalName(e.target.value)}
                placeholder="Nome do sistema"
              />
            </Field>

            <Field label="TAGLINE / SUBTÍTULO">
              <StyledInput
                value={localTagline}
                onChange={e => setLocalTagline(e.target.value)}
                placeholder="Ex: Analytics · Insights · IA"
              />
            </Field>

            <Field label="URL DA LOGO (opcional)">
              <StyledInput
                value={localLogo}
                onChange={e => setLocalLogo(e.target.value)}
                placeholder="https://…/logo.png"
              />
            </Field>

            {/* Color locked notice */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--primary-dim)', border: '1px solid var(--primary-mid)',
              marginBottom: 20,
            }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-text)' }}>Cor primária: Vermelho</div>
                <div style={{ fontSize: 11, color: 'var(--primary-text)', opacity: 0.7 }}>Identidade visual fixa neste sistema</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--primary-text)" strokeWidth="1.8" style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.6 }}>
                <path d="M11 7V5a3 3 0 0 0-6 0v2M4 7h8a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/>
              </svg>
            </div>

            {saved && (
              <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(30,138,62,0.06)', border: '1px solid rgba(30,138,62,0.25)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#145c2a' }}>
                ✓ Configurações salvas com sucesso
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: '11px', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                background: saving ? 'var(--primary-mid)' : 'var(--primary)',
                border: 'none', borderRadius: 100, cursor: saving ? 'wait' : 'pointer',
                color: 'var(--primary-contrast)', transition: 'all .2s',
              }}
            >
              {saving ? 'Salvando…' : 'Salvar configurações'}
            </button>
          </div>
        </div>

        {/* Right: Preview + About */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Topbar Preview */}
          <div className="animate-slide-up delay-3" style={{
            background: 'var(--white)', border: '1px solid var(--gray3)',
            borderRadius: 16, padding: 24, boxShadow: 'var(--shadow)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray2)', paddingBottom: 14, borderBottom: '1px solid var(--gray3)', marginBottom: 20 }}>
              Preview da Topbar
            </div>

            {/* Mini topbar */}
            <div style={{
              background: 'var(--white)', border: '1px solid var(--gray3)',
              borderRadius: 10, padding: '10px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: 1, background: 'var(--gray3)' }} />
                <div style={{ width: 6, height: 6, borderRadius: 1, background: 'var(--gray3)' }} />
                <div style={{ width: 6, height: 6, borderRadius: 1, background: 'var(--gray3)' }} />
                <div style={{ width: 1, height: 18, background: 'var(--gray3)', margin: '0 4px' }} />
                {localLogo ? (
                  <img src={localLogo} alt="" style={{ height: 20, width: 'auto', borderRadius: 4 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <div style={{ width: 20, height: 20, background: 'var(--primary)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--primary-contrast)' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--black)', lineHeight: 1.2 }}>{displayName}</div>
                  <div style={{ fontSize: 9, color: 'var(--gray2)', lineHeight: 1.2 }}>{displayTagline}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ padding: '2px 7px', borderRadius: 100, background: 'var(--primary-dim)', border: '1px solid var(--primary-mid)', fontSize: 9, fontWeight: 700, color: 'var(--primary-text)' }}>Demo</div>
                <div style={{ width: 22, height: 22, borderRadius: 100, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: 'var(--primary-contrast)' }}>AD</div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 10, textAlign: 'center', fontWeight: 500 }}>
              As alterações são aplicadas ao salvar
            </div>
          </div>

          {/* About */}
          <div className="animate-slide-up delay-4" style={{
            background: 'var(--white)', border: '1px solid var(--gray3)',
            borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)',
          }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray3)', background: 'var(--bg)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray2)' }}>Sobre o Sistema</div>
            </div>
            {[
              { label: 'Versão', value: '3.0.0' },
              { label: 'Ambiente', value: 'Demo' },
              { label: 'Dados', value: 'Fictícios' },
              { label: 'Framework', value: 'Next.js 15' },
              { label: 'Cor primária', value: '#D93025' },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 20px', borderBottom: i < 4 ? '1px solid var(--gray3)' : 'none',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray)' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>
                  {row.label === 'Cor primária'
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#D93025', display: 'inline-block' }} />
                        {row.value}
                      </span>
                    : row.label === 'Ambiente'
                      ? <span style={{ padding: '2px 8px', borderRadius: 100, background: 'var(--primary-dim)', color: 'var(--primary-text)', border: '1px solid var(--primary-mid)', fontSize: 11 }}>{row.value}</span>
                      : row.value
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
