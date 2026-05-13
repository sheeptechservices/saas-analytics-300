'use client'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

const COST_PER_SEND = 0.15

const INITIAL_TEMPLATES = [
  {
    id: 1,
    name: 'Prospecção Inicial',
    content: 'Olá {{nome}}, tudo bem? Sou da {{empresa}} e gostaria de apresentar uma solução que pode ajudar seu negócio a crescer. Posso te enviar mais detalhes?',
  },
  {
    id: 2,
    name: 'Follow-up 48h',
    content: 'Oi {{nome}}! Passei para checar se você teve a chance de ver minha mensagem anterior. Tenho algumas informações interessantes que podem ser relevantes para você. Topa uma conversa rápida?',
  },
  {
    id: 3,
    name: 'Reengajamento',
    content: '{{nome}}, não quero perder o contato! Preparei um conteúdo exclusivo para perfis como o seu. Posso compartilhar?',
  },
]

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--gray)', letterSpacing: '0.04em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

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

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ ...inputStyle, cursor: 'pointer', ...props.style }}
      onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px var(--primary-dim)' }}
      onBlur={e => { e.target.style.borderColor = 'var(--gray3)'; e.target.style.boxShadow = 'none' }}
    />
  )
}

function Card({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{
      background: 'var(--white)', border: '1px solid var(--gray3)',
      borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)',
    }}>
      <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--gray3)', marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--black)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--gray2)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

export default function ParametrosPage() {
  // AI params
  const [tone, setTone] = useState('consultivo')
  const [objective, setObjective] = useState('Qualificação de leads para reunião')
  const [delay, setDelay] = useState('30s')

  // Cadência
  const [dailyLimit, setDailyLimit] = useState(200)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('18:00')
  const [activeDays, setActiveDays] = useState([0, 1, 2, 3, 4]) // Seg–Sex

  // Templates
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editName, setEditName] = useState('')

  // API connection
  const [apiEndpoint, setApiEndpoint] = useState('https://api.exemplo.com/leads')
  const [apiKey, setApiKey] = useState('sk-demo-••••••••••••••••')
  const [connStatus, setConnStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  // Disparos
  const [running, setRunning] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const budget = COST_PER_SEND * dailyLimit * activeDays.length * 4

  function toggleDay(i: number) {
    setActiveDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i].sort())
  }

  function startEdit(t: typeof templates[0]) {
    setEditingId(t.id)
    setEditName(t.name)
    setEditContent(t.content)
  }

  function saveEdit() {
    setTemplates(prev => prev.map(t => t.id === editingId ? { ...t, name: editName, content: editContent } : t))
    setEditingId(null)
  }

  function addTemplate() {
    const newId = Math.max(...templates.map(t => t.id)) + 1
    const newT = { id: newId, name: 'Novo Template', content: 'Escreva sua mensagem aqui. Use {{nome}} para personalizar.' }
    setTemplates(prev => [...prev, newT])
    startEdit(newT)
  }

  async function testConnection() {
    setConnStatus('loading')
    await new Promise(r => setTimeout(r, 1800))
    setConnStatus('ok')
    setTimeout(() => setConnStatus('idle'), 4000)
  }

  function toggleRunning() {
    if (!running) { setShowConfirm(true) } else { setRunning(false) }
  }

  return (
    <div>
      {/* Header */}
      <div className="animate-slide-up delay-1" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.02em' }}>Parâmetros</div>
        <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>Configure os parâmetros da IA e as regras de envio</div>
      </div>

      {/* Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* AI Params */}
        <Card className="animate-slide-up delay-2" title="Parâmetros da IA" subtitle="Comportamento e tom da assistente">
          <InputField label="TOM DA ABORDAGEM">
            <StyledSelect value={tone} onChange={e => setTone(e.target.value)}>
              <option value="formal">Formal</option>
              <option value="consultivo">Consultivo</option>
              <option value="direto">Direto</option>
            </StyledSelect>
          </InputField>
          <InputField label="OBJETIVO DA CAMPANHA">
            <StyledInput value={objective} onChange={e => setObjective(e.target.value)} placeholder="Ex: Qualificação de leads" />
          </InputField>

          <InputField label="DELAY ENTRE MENSAGENS">
            <StyledSelect value={delay} onChange={e => setDelay(e.target.value)}>
              <option value="imediato">Imediato</option>
              <option value="30s">30 segundos</option>
              <option value="1min">1 minuto</option>
              <option value="5min">5 minutos</option>
            </StyledSelect>
          </InputField>
        </Card>

        {/* Cadência */}
        <Card className="animate-slide-up delay-3" title="Cadência de Envios" subtitle="Limite diário e horários ativos">
          <InputField label={`LIMITE DIÁRIO — ${dailyLimit} DISPAROS`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="range" min={10} max={1000} step={10}
                value={dailyLimit}
                onChange={e => setDailyLimit(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'var(--gray2)' }}>
                <span>10</span><span>1.000</span>
              </div>
            </div>
          </InputField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <InputField label="HORÁRIO DE INÍCIO">
              <StyledInput type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </InputField>
            <InputField label="HORÁRIO DE FIM">
              <StyledInput type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </InputField>
          </div>

          <InputField label="DIAS ATIVOS">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {WEEKDAYS.map((d, i) => {
                const active = activeDays.includes(i)
                return (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    style={{
                      padding: '5px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      background: active ? 'var(--primary)' : 'var(--bg)',
                      color: active ? 'var(--primary-contrast)' : 'var(--gray)',
                      border: `1px solid ${active ? 'var(--primary)' : 'var(--gray3)'}`,
                      transition: 'all .15s',
                    }}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </InputField>

          <div style={{
            background: 'var(--primary-dim)', border: '1px solid var(--primary-mid)',
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Budget estimado/mês</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary-text)', marginTop: 2 }}>{formatCurrency(budget)}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--primary-text)', fontWeight: 600, textAlign: 'right' }}>
              {dailyLimit} disp/dia<br />
              {activeDays.length} dias/semana
            </div>
          </div>
        </Card>
      </div>

      {/* Templates */}
      <div className="animate-slide-up delay-4" style={{
        background: 'var(--white)', border: '1px solid var(--gray3)',
        borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)',
      }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--gray3)', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--black)' }}>Templates de Mensagem</div>
            <div style={{ fontSize: 12, color: 'var(--gray2)', marginTop: 2 }}>Mensagens usadas pela IA em cada etapa do funil</div>
          </div>
          <button
            onClick={addTemplate}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 100, background: 'var(--primary)',
              color: 'var(--primary-contrast)', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, fontFamily: 'inherit', transition: 'opacity .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            + Novo Template
          </button>
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {templates.map((t, idx) => {
            const isEditing = editingId === t.id
            const STEP_COLORS = ['#D93025', '#7C3AED', '#2563EB']
            const STEP_LABELS = ['Prospecção', 'Follow-up', 'Reengajamento']
            const STEP_ICONS = [
              <svg key="a" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 4l6 5 6-5M2 4h12v10H2z"/></svg>,
              <svg key="b" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
              <svg key="c" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 8a4 4 0 1 1 4 4"/><path d="M2 8H6V4"/></svg>,
            ]
            const color     = STEP_COLORS[idx % STEP_COLORS.length]
            const stepLabel = STEP_LABELS[idx % STEP_LABELS.length]
            const stepIcon  = STEP_ICONS[idx % STEP_ICONS.length]
            const varCount  = (t.content.match(/\{\{[^}]+\}\}/g) || []).length
            const parts     = t.content.split(/(\{\{[^}]+\}\})/g)

            return (
              <div key={t.id} style={{
                border: `1.5px solid ${isEditing ? color : 'var(--gray3)'}`,
                borderRadius: 12, overflow: 'hidden',
                boxShadow: isEditing ? `0 6px 24px ${color}22` : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all .2s ease',
                display: 'flex', flexDirection: 'column',
              }}>
                {/* Card top bar */}
                <div style={{
                  padding: '11px 14px',
                  borderBottom: `1px solid ${isEditing ? `${color}20` : 'var(--gray3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: isEditing ? `${color}06` : 'var(--white)',
                  transition: 'background .2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: `${color}14`, color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${color}25`,
                    }}>
                      {stepIcon}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--black)', lineHeight: 1.2 }}>{t.name}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color, marginTop: 1 }}>{stepLabel}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {/* Edit button */}
                    <button
                      onClick={() => isEditing ? setEditingId(null) : startEdit(t)}
                      title={isEditing ? 'Fechar' : 'Editar'}
                      style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: isEditing ? `${color}15` : 'var(--bg)',
                        border: `1px solid ${isEditing ? color : 'var(--gray3)'}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isEditing ? color : 'var(--gray)', transition: 'all .15s',
                      }}
                    >
                      {isEditing
                        ? <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg>
                        : <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M11 2l3 3-8 8H3v-3l8-8Z"/></svg>
                      }
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => setTemplates(prev => prev.filter(x => x.id !== t.id))}
                      title="Excluir"
                      style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: 'var(--bg)', border: '1px solid var(--gray3)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--gray2)', transition: 'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-dim)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)'; e.currentTarget.style.background = 'var(--bg)' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 4h12M6 4V2h4v2M5 4l1 10h4l1-10"/></svg>
                    </button>
                  </div>
                </div>

                {/* Message bubble preview */}
                <div style={{ padding: '14px', background: 'var(--bg)', flex: 1 }}>
                  <div style={{
                    background: 'var(--white)',
                    border: '1px solid var(--gray3)',
                    borderRadius: '4px 12px 12px 12px',
                    padding: '10px 12px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    position: 'relative',
                    marginBottom: 10,
                  }}>
                    {/* Tail */}
                    <div style={{
                      position: 'absolute', top: 0, left: -6,
                      width: 0, height: 0,
                      borderTop: `6px solid var(--gray3)`,
                      borderLeft: '6px solid transparent',
                    }} />
                    <div style={{
                      position: 'absolute', top: 1, left: -4,
                      width: 0, height: 0,
                      borderTop: `5px solid var(--white)`,
                      borderLeft: '5px solid transparent',
                    }} />
                    <p style={{ fontSize: 11.5, color: 'var(--black)', lineHeight: 1.6, margin: 0 }}>
                      {parts.map((part, pi) =>
                        part.match(/^\{\{[^}]+\}\}$/)
                          ? (
                            <span key={pi} style={{
                              display: 'inline-block',
                              background: `${color}15`, color,
                              borderRadius: 4, padding: '1px 5px',
                              fontSize: 10.5, fontWeight: 700,
                              border: `1px solid ${color}30`,
                              margin: '0 1px',
                            }}>{part}</span>
                          )
                          : <span key={pi}>{part}</span>
                      )}
                    </p>
                  </div>
                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: 'var(--gray2)',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 4h12M2 8h8M2 12h6"/></svg>
                      {t.content.length} chars
                    </span>
                    <span style={{ color: 'var(--gray3)', fontSize: 10 }}>·</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color,
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 8a4 4 0 1 1 4 4"/><rect x="4" y="4" width="4" height="4"/></svg>
                      {varCount} variáve{varCount === 1 ? 'l' : 'is'}
                    </span>
                  </div>
                </div>

                {/* Inline editor */}
                {isEditing && (
                  <div className="animate-slide-up" style={{
                    padding: 14, borderTop: `1px solid ${color}25`,
                    background: `${color}04`,
                  }}>
                    <StyledInput
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Nome do template"
                      style={{ marginBottom: 8, fontSize: 13 }}
                    />
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={4}
                      placeholder="Use {{nome}}, {{empresa}} para personalizar"
                      style={{ ...inputStyle, resize: 'vertical', marginBottom: 10, fontSize: 13 }}
                      onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}20` }}
                      onBlur={e => { e.target.style.borderColor = 'var(--gray3)'; e.target.style.boxShadow = 'none' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveEdit} style={{
                        padding: '7px 16px', borderRadius: 100,
                        background: color, color: '#fff', border: 'none',
                        cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                      }}>Salvar</button>
                      <button onClick={() => setEditingId(null)} style={{
                        padding: '7px 16px', borderRadius: 100,
                        background: 'var(--white)', color: 'var(--gray)',
                        border: '1px solid var(--gray3)', cursor: 'pointer',
                        fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                      }}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Row 3: API + Start */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        {/* API Connection */}
        <Card className="animate-slide-up delay-5" title="Conexão com Base de Dados" subtitle="Endpoint externo de leads via API">
          <InputField label="ENDPOINT DA API">
            <StyledInput value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} placeholder="https://api.empresa.com/leads" />
          </InputField>
          <InputField label="CHAVE DA API">
            <StyledInput
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-••••••••••••••••"
            />
          </InputField>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <button
              onClick={testConnection}
              disabled={connStatus === 'loading'}
              style={{
                padding: '9px 18px', borderRadius: 100, background: 'var(--bg)',
                border: '1px solid var(--gray3)', cursor: connStatus === 'loading' ? 'wait' : 'pointer',
                fontSize: 13, fontWeight: 700, color: 'var(--gray)', fontFamily: 'inherit',
                transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { if (connStatus !== 'loading') e.currentTarget.style.borderColor = 'var(--primary)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)' }}
            >
              {connStatus === 'loading' && (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin-slow 1s linear infinite' }}>
                  <path d="M8 2a6 6 0 0 1 6 6" strokeLinecap="round"/>
                </svg>
              )}
              {connStatus === 'loading' ? 'Testando…' : 'Testar conexão'}
            </button>

            {connStatus === 'ok' && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 100,
                background: 'rgba(30,138,62,0.08)', color: '#1E8A3E',
                border: '1px solid rgba(30,138,62,0.20)', animation: 'fadeIn .2s ease both',
              }}>
                <span className="live-dot" style={{ background: '#1E8A3E' }} />
                Conectado
              </span>
            )}
            {connStatus === 'error' && (
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 100,
                background: 'var(--primary-dim)', color: 'var(--primary-text)',
                border: '1px solid var(--primary-mid)', animation: 'fadeIn .2s ease both',
              }}>
                Falha na conexão
              </span>
            )}
            {connStatus === 'idle' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--gray2)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gray3)', display: 'inline-block' }} />
                Não testado
              </span>
            )}
          </div>
        </Card>

        {/* Start */}
        <Card className="animate-slide-up delay-6" title="Iniciar Disparos" subtitle="Ative ou pause a campanha de prospecção">
          <div style={{
            background: running ? 'rgba(30,138,62,0.06)' : 'var(--bg)',
            border: `1px solid ${running ? 'rgba(30,138,62,0.25)' : 'var(--gray3)'}`,
            borderRadius: 10, padding: '16px',
            marginBottom: 20, transition: 'all .3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {running
                ? <span className="live-dot" />
                : <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gray3)', display: 'inline-block' }} />
              }
              <span style={{ fontSize: 13, fontWeight: 700, color: running ? '#1E8A3E' : 'var(--gray)' }}>
                {running ? 'Campanha em execução' : 'Campanha inativa'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray2)', lineHeight: 1.5 }}>
              {running
                ? `Enviando até ${dailyLimit} mensagens/dia · ${activeDays.length} dias ativos · ${startTime}–${endTime}`
                : 'Nenhum disparo em andamento. Configure os parâmetros acima e inicie.'
              }
            </div>
          </div>

          {showConfirm && !running && (
            <div className="animate-slide-up" style={{
              background: 'var(--primary-dim)', border: '1px solid var(--primary-mid)',
              borderRadius: 10, padding: '14px 16px', marginBottom: 14,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-text)', marginBottom: 8 }}>
                Confirmar início dos disparos?
              </div>
              <div style={{ fontSize: 12, color: 'var(--primary-text)', marginBottom: 12 }}>
                Serão enviadas até <strong>{dailyLimit}</strong> mensagens/dia nos dias configurados.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setRunning(true); setShowConfirm(false) }} style={{
                  padding: '7px 16px', borderRadius: 100, background: 'var(--primary)',
                  color: 'var(--primary-contrast)', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                }}>Confirmar</button>
                <button onClick={() => setShowConfirm(false)} style={{
                  padding: '7px 16px', borderRadius: 100, background: 'var(--white)',
                  color: 'var(--gray)', border: '1px solid var(--gray3)', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                }}>Cancelar</button>
              </div>
            </div>
          )}

          <button
            onClick={toggleRunning}
            style={{
              width: '100%', padding: '14px', borderRadius: 100,
              background: running ? 'rgba(217,48,37,0.08)' : 'var(--primary)',
              color: running ? 'var(--primary)' : 'var(--primary-contrast)',
              border: running ? '1.5px solid var(--primary-mid)' : 'none',
              cursor: 'pointer', fontSize: 15, fontWeight: 800,
              fontFamily: 'inherit', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, transition: 'all .2s',
            }}
          >
            {running ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="3" width="4" height="10" rx="1"/><rect x="9" y="3" width="4" height="10" rx="1"/></svg>
                Pausar Campanha
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5l10 5.5-10 5.5z"/></svg>
                Iniciar Disparos
              </>
            )}
          </button>
        </Card>
      </div>
    </div>
  )
}
