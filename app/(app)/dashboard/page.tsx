'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { formatNumber, formatPercent } from '@/lib/utils'

/* ══════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════ */
const FUNNEL = [
  { label: 'Disparados',  value: 3847, color: '#D93025' },
  { label: 'Responderam', value: 1316, color: '#E05540' },
  { label: 'Qualificados',value: 412,  color: '#E87060' },
  { label: 'Reunião',     value: 87,   color: '#F09080' },
  { label: 'Fechamento',  value: 23,   color: '#F8B0A0' },
]

const WEEKLY = [
  { day: 'Seg', value: 620 },
  { day: 'Ter', value: 540 },
  { day: 'Qua', value: 710 },
  { day: 'Qui', value: 480 },
  { day: 'Sex', value: 830 },
  { day: 'Sáb', value: 290 },
  { day: 'Dom', value: 140 },
]

const DONUT_DATA = [
  { label: 'Positivo', value: 34.2, color: '#1E8A3E' },
  { label: 'Neutro',   value: 47.1, color: '#AAAAAA' },
  { label: 'Negativo', value: 18.7, color: '#D93025' },
]

const SPARKLINES: Record<string, number[]> = {
  'Contatos Disparados': [2100, 2450, 2800, 2600, 3100, 3400, 3847],
  'Taxa de Resposta':    [28.5, 29.1, 31.0, 30.2, 32.4, 33.8, 34.2],
  'Leads Qualificados':  [210, 240, 280, 300, 350, 390, 412],
  'Reuniões Agendadas':  [42, 48, 55, 60, 70, 80, 87],
}

const ACTIVITY_POOL = [
  { type: 'reply',   text: 'Lead respondeu à prospecção', name: 'Lucas Mendes' },
  { type: 'qualify', text: 'Lead qualificado pela IA', name: 'Carla Souza' },
  { type: 'meeting', text: 'Reunião agendada', name: 'Rafael Torres' },
  { type: 'reply',   text: 'Novo contato iniciado', name: 'Beatriz Lima' },
  { type: 'qualify', text: 'Lead avançou no funil', name: 'Fernando Costa' },
  { type: 'closed',  text: 'Negócio fechado!', name: 'Amanda Rocha' },
  { type: 'reply',   text: 'Follow-up respondido', name: 'Thiago Neves' },
  { type: 'qualify', text: 'Qualificação confirmada', name: 'Juliana Dias' },
  { type: 'meeting', text: 'Demo agendada', name: 'Paulo Ferreira' },
  { type: 'reply',   text: 'Lead retornou mensagem', name: 'Isabela Matos' },
]

const ACTIVITY_COLORS: Record<string, string> = {
  reply:   '#2563eb',
  qualify: '#D93025',
  meeting: '#7C3AED',
  closed:  '#1E8A3E',
}

/* ══════════════════════════════════════════
   PERIOD CONFIG
══════════════════════════════════════════ */
type Period = '7d' | '30d' | '90d' | '12m'

const PERIOD_OPTIONS: { key: Period; label: string; full: string }[] = [
  { key: '7d',  label: '7D',  full: 'Últimos 7 dias'  },
  { key: '30d', label: '30D', full: 'Últimos 30 dias' },
  { key: '90d', label: '90D', full: 'Últimos 90 dias' },
  { key: '12m', label: '12M', full: 'Últimos 12 meses' },
]

const PERIOD_SCALE: Record<Period, number>  = { '7d': 0.233, '30d': 1, '90d': 2.92, '12m': 11.7 }
const PERIOD_CHANGE: Record<Period, number> = { '7d': -0.35, '30d': 0, '90d': 0.30, '12m': 0.70 }

const WEEKLY_SETS: Record<Period, { day: string; value: number }[]> = {
  '7d': [
    { day: 'Seg', value: 620 }, { day: 'Ter', value: 540 }, { day: 'Qua', value: 710 },
    { day: 'Qui', value: 480 }, { day: 'Sex', value: 830 }, { day: 'Sáb', value: 290 }, { day: 'Dom', value: 140 },
  ],
  '30d': [
    { day: 'Sem 1', value: 2840 }, { day: 'Sem 2', value: 3120 },
    { day: 'Sem 3', value: 2690 }, { day: 'Sem 4', value: 3180 },
  ],
  '90d': [
    { day: 'Jan', value: 9800 }, { day: 'Fev', value: 10400 }, { day: 'Mar', value: 11200 },
  ],
  '12m': [
    { day: 'Jan', value: 28000 }, { day: 'Fev', value: 31000 }, { day: 'Mar', value: 33600 },
    { day: 'Abr', value: 29800 }, { day: 'Mai', value: 36200 }, { day: 'Jun', value: 34700 },
    { day: 'Jul', value: 32400 }, { day: 'Ago', value: 38900 }, { day: 'Set', value: 41200 },
    { day: 'Out', value: 39600 }, { day: 'Nov', value: 44800 }, { day: 'Dez', value: 42100 },
  ],
}

const VOLUME_SUBTITLE: Record<Period, string> = {
  '7d': 'Disparos por dia · hoje destacado',
  '30d': 'Disparos por semana',
  '90d': 'Disparos por mês',
  '12m': 'Disparos mensais · ano atual',
}

const METRICS = [
  {
    label: 'Contatos Disparados', value: 3847, suffix: '',  change: +12.4,
    question: 'Minha métrica de Contatos Disparados está em 3.847 com crescimento de +12,4% vs. mês anterior. Analise esse número e sugira como posso escalar ainda mais.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M2 5l8 5 8-5M2 5h16v12H2z"/>
      </svg>
    ),
  },
  {
    label: 'Taxa de Resposta', value: 34.2, suffix: '%', change: +2.1,
    question: 'Minha taxa de resposta está em 34,2% com crescimento de +2,1%. Analise esse resultado e dê dicas para aumentar ainda mais.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M18 10c0 4.418-3.582 8-8 8a7.96 7.96 0 0 1-4-1.07L2 18l1.07-4A7.96 7.96 0 0 1 2 10C2 5.582 5.582 2 10 2s8 3.582 8 8Z"/>
      </svg>
    ),
  },
  {
    label: 'Leads Qualificados', value: 412, suffix: '', change: +8.7,
    question: 'Tenho 412 leads qualificados este mês, +8,7% vs. mês anterior. Analise o que posso fazer para aumentar a qualificação e avançar mais leads no funil.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="10" cy="7" r="3"/><path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
        <path d="M14 5l1.5 1.5L18 4" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Reuniões Agendadas', value: 87, suffix: '', change: +5.3,
    question: 'Tenho 87 reuniões agendadas este mês com crescimento de +5,3%. Analise minha taxa de conversão de leads qualificados para reunião e sugira melhorias.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <rect x="2" y="4" width="16" height="14" rx="2"/>
        <path d="M6 2v4M14 2v4M2 9h16"/>
        <path d="M7 13l2 2 4-4" strokeWidth="1.5"/>
      </svg>
    ),
  },
]

/* ══════════════════════════════════════════
   HOOKS
══════════════════════════════════════════ */
function useCountUp(target: number, duration = 1400) {
  const [current, setCurrent] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setCurrent(Math.round(ease * target * 10) / 10)
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return current
}

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return mounted
}

/* ══════════════════════════════════════════
   SPARKLINE
══════════════════════════════════════════ */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const mounted = useMounted()
  const W = 80, H = 28
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${x},${y}`
  })
  const pathD = `M ${pts.join(' L ')}`
  const areaD = `M ${pts[0]} L ${pts.join(' L ')} L ${W},${H} L 0,${H} Z`

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sp-${color.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`clip-${color.replace('#','')}`}>
          <rect x="0" y="0" width={mounted ? W : 0} height={H} style={{ transition: 'width 1.4s cubic-bezier(.4,0,.2,1)' }} />
        </clipPath>
      </defs>
      <path d={areaD} fill={`url(#sp-${color.replace('#','')})`} clipPath={`url(#clip-${color.replace('#','')})`} />
      <path d={pathD} stroke={color} strokeWidth="1.8" fill="none" clipPath={`url(#clip-${color.replace('#','')})`} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="3" fill={color} />
    </svg>
  )
}

/* ══════════════════════════════════════════
   ASK AI BUTTON
══════════════════════════════════════════ */
function AskAIButton({ question }: { question: string }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('ai-ask', { detail: { question } }))}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Perguntar à IA sobre este gráfico"
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 700,
        padding: '3px 9px', borderRadius: 100,
        border: `1px solid ${hov ? 'var(--primary)' : 'var(--primary-mid)'}`,
        cursor: 'pointer', fontFamily: 'inherit',
        background: hov ? 'var(--primary)' : 'var(--primary-dim)',
        color: hov ? 'var(--primary-contrast)' : 'var(--primary-text)',
        transform: hov ? 'scale(1.05)' : 'scale(1)',
        boxShadow: hov ? '0 2px 8px rgba(217,48,37,0.3)' : 'none',
        transition: 'all 0.18s cubic-bezier(0.34,1.4,0.64,1)',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 9 }}>✦</span> Analisar
    </button>
  )
}

/* ══════════════════════════════════════════
   SUMMARY CARD
══════════════════════════════════════════ */
function SummaryCard({ label, value, suffix, change, icon, delay, liveBoost }: {
  label: string; value: number; suffix: string; change: number
  icon: React.ReactNode; delay: number; liveBoost?: number
}) {
  const [hovered, setHovered] = useState(false)
  const animated = useCountUp(value)
  const display = suffix === '%'
    ? formatPercent(animated)
    : formatNumber(Math.round(animated + (liveBoost ?? 0)))

  return (
    <div
      className={`animate-slide-up delay-${delay}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? 'linear-gradient(135deg, rgba(217,48,37,0.04) 0%, var(--white) 60%)'
          : 'var(--white)',
        border: `1px solid ${hovered ? 'var(--primary-mid)' : 'var(--gray3)'}`,
        borderTop: `3px solid ${hovered ? 'var(--primary)' : 'var(--gray3)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        boxShadow: hovered ? '0 12px 32px rgba(217,48,37,0.12)' : 'var(--shadow)',
        cursor: 'default',
        transform: hovered ? 'translateY(-5px) scale(1.02)' : 'none',
        transition: 'transform .25s cubic-bezier(.34,1.4,.64,1), box-shadow .25s ease, border-color .2s, background .2s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Animated bg ring on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,48,37,0.08) 0%, transparent 70%)',
          animation: 'fadeIn .3s ease both',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.4, flex: 1 }}>
          {label}
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: hovered ? 'var(--primary)' : 'var(--primary-dim)',
          color: hovered ? 'var(--primary-contrast)' : 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .2s, color .2s, transform .2s',
          transform: hovered ? 'rotate(-8deg) scale(1.1)' : 'none',
        }}>
          {icon}
        </div>
      </div>

      <div style={{
        fontSize: 30, fontWeight: 800, color: hovered ? 'var(--primary-text)' : 'var(--black)',
        letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10,
        transition: 'color .2s',
      }}>
        {display}
        {liveBoost !== undefined && liveBoost > 0 && (
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginLeft: 4, animation: 'count-pop .3s ease both' }}>
            +{liveBoost}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
            background: change > 0 ? 'rgba(30,138,62,0.08)' : 'rgba(217,48,37,0.08)',
            color: change > 0 ? '#1E8A3E' : '#D93025',
            border: `1px solid ${change > 0 ? 'rgba(30,138,62,0.20)' : 'rgba(217,48,37,0.20)'}`,
          }}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
          <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500 }}>vs. mês</span>
        </div>
        <Sparkline data={SPARKLINES[label] ?? []} color='#D93025' />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   FUNNEL CHART
══════════════════════════════════════════ */
function FunnelChart({ data }: { data: typeof FUNNEL }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const mounted = useMounted()
  const max = data[0].value
  const W = 680, H = 120
  const segW = W / FUNNEL.length
  const maxH = 100
  const minH = 38

  const pts = data.map((s, i) => {
    // sqrt scale so 3847 vs 23 doesn't create a 5× height ratio
    const ratio = Math.sqrt(s.value / max)
    const targetH = minH + ratio * (maxH - minH)
    const h = mounted ? targetH : minH
    const x = i * segW
    const yTop = (H - h) / 2
    const yBot = yTop + h
    return { ...s, x, yTop, yBot, h, targetH }
  })

  return (
    <div style={{ overflowX: 'auto', position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H + 30}`} width="100%" style={{ display: 'block' }}>
        <defs>
          {pts.map((p, i) => (
            <linearGradient key={i} id={`fgrad${i}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={p.color} stopOpacity={hovered === i ? 1 : 0.9} />
              <stop offset="100%" stopColor={p.color} stopOpacity={hovered === i ? 0.85 : 0.55} />
            </linearGradient>
          ))}
          {pts.map((p, i) => (
            <filter key={i} id={`glow${i}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          ))}
        </defs>

        {/* Connectors */}
        {pts.map((p, i) => {
          const next = pts[i + 1]
          if (!next) return null
          const points = [
            `${p.x + segW - 4},${p.yTop}`,
            `${next.x + 4},${next.yTop}`,
            `${next.x + 4},${next.yBot}`,
            `${p.x + segW - 4},${p.yBot}`,
          ].join(' ')
          return (
            <polygon
              key={`conn-${i}`} points={points}
              fill={p.color} opacity={hovered === i || hovered === i + 1 ? 0.25 : 0.12}
              style={{ transition: 'opacity .2s' }}
            />
          )
        })}

        {/* Bars */}
        {pts.map((p, i) => {
          const isHov = hovered === i
          return (
            <g
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Hit area */}
              <rect x={p.x} y={0} width={segW} height={H} fill="transparent" />

              {/* Glow behind bar on hover */}
              {isHov && (
                <rect
                  x={p.x + 6} y={p.yTop + 2} width={segW - 12} height={p.h - 4}
                  rx="8" fill={p.color} opacity="0.3" filter={`url(#glow${i})`}
                  style={{ transition: 'all .2s' }}
                />
              )}

              {/* Main bar */}
              <rect
                x={p.x + 6} y={p.yTop}
                width={segW - 12}
                height={p.h}
                rx="7"
                fill={`url(#fgrad${i})`}
                transform={isHov ? `scale(1, 1.04) translate(0, ${-p.h * 0.02})` : 'scale(1,1)'}
                style={{
                  transition: 'height .8s cubic-bezier(.34,1.2,.64,1), transform .2s ease',
                  transitionDelay: `${i * 0.08}s`,
                  transformOrigin: `${p.x + segW / 2}px ${H / 2}px`,
                }}
              />

              {/* Shimmer */}
              <rect x={p.x + 6} y={p.yTop} width={segW - 12} height={p.h} rx="7"
                fill="url(#shimmer-f)" opacity="0.25"
                style={{ pointerEvents: 'none' }}
              />

              {/* Label */}
              <text x={p.x + segW / 2} y={H + 10} textAnchor="middle"
                fontSize="6" fontWeight="700"
                fill={isHov ? p.color : 'var(--gray)'} fontFamily="Manrope, sans-serif"
                style={{ transition: 'fill .2s' }}
              >
                {p.label}
              </text>
              <text x={p.x + segW / 2} y={H + 19} textAnchor="middle"
                fontSize={isHov ? '8' : '7'} fontWeight="800"
                fill={isHov ? p.color : 'var(--black)'} fontFamily="Manrope, sans-serif"
                style={{ transition: 'all .2s' }}
              >
                {formatNumber(p.value)}
              </text>
              {i > 0 && (
                <text x={p.x + segW / 2} y={H + 27} textAnchor="middle"
                  fontSize="6" fontWeight="600"
                  fill={isHov ? p.color : 'var(--gray2)'} fontFamily="Manrope, sans-serif"
                  style={{ transition: 'fill .2s' }}
                >
                  {formatPercent((p.value / data[0].value) * 100)}
                </text>
              )}

              {/* Value inside bar on hover */}
              {isHov && p.h > 40 && (
                <text x={p.x + segW / 2} y={H / 2 + 5} textAnchor="middle"
                  fontSize="11" fontWeight="800" fill="rgba(255,255,255,0.9)"
                  fontFamily="Manrope, sans-serif"
                  style={{ animation: 'fadeIn .15s ease both', pointerEvents: 'none' }}
                >
                  {formatPercent((p.value / data[0].value) * 100)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ══════════════════════════════════════════
   WEEKLY BAR CHART
══════════════════════════════════════════ */
function WeeklyBars({ data, isDay }: { data: { day: string; value: number }[]; isDay: boolean }) {
  const mounted = useMounted()
  const [hovered, setHovered] = useState<number | null>(null)
  const max = Math.max(...data.map(d => d.value))
  const todayIdx = isDay
    ? (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
    : data.length - 1

  return (
    <div style={{ position: 'relative' }}>
      {/* Grid lines */}
      <div style={{ position: 'absolute', inset: '0 0 28px 0', pointerEvents: 'none' }}>
        {[25, 50, 75, 100].map(pct => (
          <div key={pct} style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `${pct}%`, borderTop: '1px dashed var(--gray3)',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, paddingBottom: 28, position: 'relative' }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100
          const isHov = hovered === i
          const isToday = i === todayIdx
          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHov && (
                <div style={{
                  position: 'absolute', bottom: 'calc(100% - 24px)', left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--black)', color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  padding: '5px 9px', borderRadius: 7, whiteSpace: 'nowrap',
                  animation: 'panelUp .15s ease both',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}>
                  {formatNumber(d.value)} disparos
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                    borderTop: '5px solid var(--black)',
                  }} />
                </div>
              )}

              {/* Value label above bar */}
              <div style={{
                fontSize: 9, fontWeight: 800, color: isHov ? 'var(--primary)' : 'transparent',
                marginBottom: 3, transition: 'color .15s', height: 12,
              }}>
                {formatNumber(d.value)}
              </div>

              {/* Bar */}
              <div style={{
                width: '100%', borderRadius: '5px 5px 0 0',
                background: isHov
                  ? 'var(--primary)'
                  : isToday
                    ? 'rgba(217,48,37,0.55)'
                    : 'var(--primary-dim)',
                height: mounted ? `${pct}%` : '2px',
                minHeight: 4,
                transition: `height .7s cubic-bezier(.34,1.2,.64,1) ${i * 0.06}s, background .2s, transform .2s`,
                transform: isHov ? 'scaleX(1.05)' : 'scaleX(1)',
                position: 'relative', overflow: 'hidden',
                boxShadow: isHov ? '0 -4px 12px rgba(217,48,37,0.3)' : 'none',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
                }} />
              </div>

              {/* Day label */}
              <div style={{
                fontSize: 10, fontWeight: isToday ? 800 : 700,
                color: isToday ? 'var(--primary)' : isHov ? 'var(--black)' : 'var(--gray2)',
                marginTop: 5, position: 'absolute', bottom: 0,
                transition: 'color .15s',
              }}>
                {d.day}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   DONUT CHART
══════════════════════════════════════════ */
function DonutChart() {
  const mounted = useMounted()
  const [hovered, setHovered] = useState<number | null>(null)
  const R = 54, CX = 72, CY = 72
  const circumference = 2 * Math.PI * R
  let offset = 0

  const segments = DONUT_DATA.map(d => {
    const dash = (d.value / 100) * circumference
    const gap = circumference - dash
    const currentOffset = offset
    offset += dash
    return { ...d, dash, gap, offset: currentOffset }
  })

  const activeSegment = hovered !== null ? segments[hovered] : segments[0]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="144" height="144" viewBox="0 0 144 144">
          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--gray3)" strokeWidth="16" />

          {segments.map((s, i) => {
            const isHov = hovered === i
            const strokeDash = mounted ? s.dash : 0
            return (
              <circle
                key={i}
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={isHov ? 22 : 16}
                strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                strokeDashoffset={-s.offset}
                transform="rotate(-90, 72, 72)"
                style={{
                  transition: `stroke-dasharray 1s cubic-bezier(.4,0,.2,1) ${i * 0.15}s, stroke-width .2s ease, filter .2s`,
                  filter: isHov ? `drop-shadow(0 0 6px ${s.color}80)` : 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            )
          })}

          {/* Center — vertically centered: big baseline at CY+4, label at CY+16 */}
          <text x={CX} y={CY + 5} textAnchor="middle"
            fontSize="20" fontWeight="800"
            fill={activeSegment.color} fontFamily="Manrope, sans-serif"
            style={{ transition: 'fill .2s' }}
          >
            {activeSegment.value}%
          </text>
          <text x={CX} y={CY + 18} textAnchor="middle"
            fontSize="9" fontWeight="700" fill="var(--gray2)" fontFamily="Manrope, sans-serif"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            {activeSegment.label.toUpperCase()}
          </text>
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, paddingRight: 4 }}>
        {DONUT_DATA.map((d, i) => {
          const isHov = hovered === i
          return (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '5px 8px', borderRadius: 7,
                background: isHov ? `${d.color}12` : 'transparent',
                border: `1px solid ${isHov ? `${d.color}30` : 'transparent'}`,
                transition: 'all .18s',
              }}
            >
              <div style={{
                width: isHov ? 14 : 10, height: isHov ? 14 : 10,
                borderRadius: 3, background: d.color, flexShrink: 0,
                transition: 'all .18s',
                boxShadow: isHov ? `0 0 8px ${d.color}60` : 'none',
              }} />
              <span style={{ fontSize: 12, fontWeight: isHov ? 700 : 600, color: isHov ? 'var(--black)' : 'var(--gray)', flex: 1, transition: 'all .15s' }}>
                {d.label}
              </span>
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: isHov ? d.color : 'var(--black)',
                transition: 'color .15s',
              }}>
                {d.value}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   LIVE ACTIVITY FEED
══════════════════════════════════════════ */
interface ActivityItem { id: number; type: string; text: string; name: string; ago: number }

function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const counter = useRef(100)

  useEffect(() => {
    setItems(
      ACTIVITY_POOL.slice(0, 5).map((a, i) => ({ ...a, id: i, ago: (5 - i) * 38 }))
    )
  }, [])
  const [ticking, setTicking] = useState(false)

  useEffect(() => {
    const iv = setInterval(() => {
      const poolItem = ACTIVITY_POOL[Math.floor(Math.random() * ACTIVITY_POOL.length)]
      setItems(prev => {
        const next = [{ ...poolItem, id: counter.current++, ago: 0 }, ...prev].slice(0, 7)
        return next
      })
      setTicking(true)
      setTimeout(() => setTicking(false), 400)
    }, 2800)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => {
      setItems(prev => prev.map(item => ({ ...item, ago: item.ago + 1 })))
    }, 60000)
    return () => clearInterval(iv)
  }, [])

  const formatAgo = (min: number) => {
    if (min < 1) return 'agora mesmo'
    if (min < 60) return `${min} min atrás`
    return `${Math.floor(min / 60)}h atrás`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((item, idx) => (
        <div
          key={item.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 0',
            borderBottom: idx < items.length - 1 ? '1px solid var(--gray3)' : 'none',
            opacity: idx === 0 && ticking ? 0 : Math.max(0.4, 1 - idx * 0.1),
            animation: idx === 0 ? 'slideUp .3s ease both' : 'none',
            transition: 'opacity .4s ease',
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: `${ACTIVITY_COLORS[item.type]}15`,
            border: `1px solid ${ACTIVITY_COLORS[item.type]}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {item.type === 'reply'   && <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={ACTIVITY_COLORS[item.type]} strokeWidth="1.7" strokeLinecap="round"><path d="M14 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"/><path d="M8 5v3l2 2"/></svg>}
            {item.type === 'qualify' && <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={ACTIVITY_COLORS[item.type]} strokeWidth="1.7" strokeLinecap="round"><circle cx="7" cy="6" r="3"/><path d="M3 14c0-2.761 1.79-5 4-5s4 2.239 4 5"/><path d="M11 4l1.5 1.5L15 3"/></svg>}
            {item.type === 'meeting' && <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={ACTIVITY_COLORS[item.type]} strokeWidth="1.7" strokeLinecap="round"><rect x="1" y="3" width="14" height="11" rx="2"/><path d="M5 1v4M11 1v4M1 8h14"/><path d="M5 11l2 2 4-3"/></svg>}
            {item.type === 'closed'  && <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={ACTIVITY_COLORS[item.type]} strokeWidth="1.8" strokeLinecap="round"><path d="M2 8l4 4 8-8"/></svg>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 500 }}>{item.text}</div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 600, flexShrink: 0 }}>
            {formatAgo(item.ago)}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════
   LIVE TICKER CARD
══════════════════════════════════════════ */
function LiveTicker() {
  const [count, setCount] = useState(3847)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() > 0.4) {
        setCount(c => c + 1)
        setFlash(true)
        setTimeout(() => setFlash(false), 500)
      }
    }, 3200)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--primary-dim)', borderRadius: 10, border: '1px solid var(--primary-mid)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="live-dot" style={{ background: 'var(--primary)' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-text)' }}>Disparos hoje</span>
      </div>
      <div style={{
        fontSize: 20, fontWeight: 800, color: 'var(--primary)',
        animation: flash ? 'count-pop .3s ease both' : 'none',
        transition: 'color .2s',
      }}>
        {formatNumber(count)}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   CONVERSION MINI BARS
══════════════════════════════════════════ */
function ConversionBars() {
  const mounted = useMounted()
  const [hovered, setHovered] = useState<number | null>(null)

  const stages = FUNNEL.slice(1).map((s, i) => ({
    from: FUNNEL[i].label,
    to: s.label,
    rate: Math.round((s.value / FUNNEL[i].value) * 100),
    color: s.color,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {stages.map((s, i) => (
        <div
          key={i}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: 'default' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: hovered === i ? 'var(--black)' : 'var(--gray)', transition: 'color .15s' }}>
              {s.from} → {s.to}
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: hovered === i ? s.color : 'var(--black)', transition: 'color .15s' }}>
              {s.rate}%
            </span>
          </div>
          <div style={{ height: 7, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 100,
              background: hovered === i ? s.color : `${s.color}80`,
              width: mounted ? `${s.rate}%` : '0%',
              transition: `width 1s cubic-bezier(.4,0,.2,1) ${i * 0.12}s, background .2s`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'barSweep 2.5s ease infinite',
                animationDelay: `${i * 0.3}s`,
              }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════
   PERIOD FILTER
══════════════════════════════════════════ */
function PeriodFilter({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const [hov, setHov] = useState<Period | null>(null)
  return (
    <div style={{
      display: 'flex', background: 'var(--gray3)', borderRadius: 10,
      padding: 3, gap: 2,
    }}>
      {PERIOD_OPTIONS.map(opt => {
        const active = period === opt.key
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            onMouseEnter={() => setHov(opt.key)}
            onMouseLeave={() => setHov(null)}
            title={opt.full}
            style={{
              padding: '5px 16px', borderRadius: 8, border: 'none',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: active ? 'var(--white)' : hov === opt.key ? 'rgba(255,255,255,0.5)' : 'transparent',
              color: active ? 'var(--black)' : 'var(--gray)',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all .15s ease',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function scaledFunnel(period: Period) {
  const s = PERIOD_SCALE[period]
  return FUNNEL.map(f => ({ ...f, value: Math.max(1, Math.round(f.value * s)) }))
}

function scaledMetrics(period: Period) {
  const s = PERIOD_SCALE[period]
  const d = PERIOD_CHANGE[period]
  return METRICS.map(m => ({
    ...m,
    value: m.suffix === '%'
      ? Math.round((m.value + d * 3) * 10) / 10
      : Math.round(m.value * s),
    change: Math.round(m.change * (1 + d * 0.6) * 10) / 10,
  }))
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [liveBoosts, setLiveBoosts] = useState<number[]>([0, 0, 0, 0])

  const activeMetrics = scaledMetrics(period)
  const activeFunnel  = scaledFunnel(period)
  const activeWeekly  = WEEKLY_SETS[period]

  useEffect(() => {
    const iv = setInterval(() => {
      const idx = Math.floor(Math.random() * 4)
      setLiveBoosts(prev => {
        const next = [...prev]
        next[idx] = prev[idx] + 1
        return next
      })
    }, 5000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="animate-slide-up delay-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.02em' }}>Dashboard</div>
          <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>Métricas gerais de atendimento da IA</div>
        </div>
        <PeriodFilter period={period} onChange={setPeriod} />
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {activeMetrics.map((m, i) => (
          <SummaryCard
            key={i}
            label={m.label} value={m.value} suffix={m.suffix}
            change={m.change} icon={m.icon}
            delay={i + 1} liveBoost={liveBoosts[i]}
          />
        ))}
      </div>

      {/* Funnel */}
      <div className="animate-slide-up delay-6" style={{
        background: 'var(--white)', border: '1px solid var(--gray3)',
        borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--black)' }}>Funil de Atendimento IA</div>
            <div style={{ fontSize: 12, color: 'var(--gray2)', marginTop: 2 }}>Passe o mouse sobre cada etapa para detalhes</div>
          </div>
          <AskAIButton question="Analise meu funil de atendimento IA: 3.847 disparados → 1.316 responderam (34,2%) → 412 qualificados (10,7%) → 87 reuniões (2,3%) → 23 fechamentos (0,6%). Quais etapas têm maior perda e o que devo fazer?" />
        </div>
        <FunnelChart data={activeFunnel} />
      </div>

      {/* Bottom: 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 380px', gap: 16 }}>
        {/* Weekly */}
        <div className="animate-slide-up delay-7" style={{
          background: 'var(--white)', border: '1px solid var(--gray3)',
          borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)', marginBottom: 2 }}>Volume de Disparos</div>
              <div style={{ fontSize: 11, color: 'var(--gray2)' }}>{VOLUME_SUBTITLE[period]}</div>
            </div>
            <AskAIButton question="Analise meu volume semanal de disparos: Seg 620, Ter 540, Qua 710, Qui 480, Sex 830, Sáb 290, Dom 140. Qual o melhor padrão e como otimizar a cadência?" />
          </div>
          <WeeklyBars data={activeWeekly} isDay={period === '7d'} />
        </div>

        {/* Conversions */}
        <div className="animate-slide-up delay-8" style={{
          background: 'var(--white)', border: '1px solid var(--gray3)',
          borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)', marginBottom: 2 }}>Taxa de Conversão</div>
              <div style={{ fontSize: 11, color: 'var(--gray2)' }}>Entre estágios do funil</div>
            </div>
            <AskAIButton question="Minhas taxas de conversão entre etapas: Disparados→Responderam 34%, Responderam→Qualificados 31%, Qualificados→Reunião 21%, Reunião→Fechamento 26%. Analise e sugira melhorias." />
          </div>
          <ConversionBars />
        </div>

        {/* Donut */}
        <div className="animate-slide-up delay-7" style={{
          background: 'var(--white)', border: '1px solid var(--gray3)',
          borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)', marginBottom: 2 }}>Sentimento</div>
              <div style={{ fontSize: 11, color: 'var(--gray2)' }}>Passe o mouse para detalhar</div>
            </div>
            <AskAIButton question="O sentimento das respostas da minha campanha IA está: 34,2% positivo, 47,1% neutro, 18,7% negativo. Analise esses números e sugira como melhorar o sentimento." />
          </div>
          <DonutChart />
        </div>
      </div>

      {/* Activity feed */}
      <div className="animate-slide-up delay-8" style={{
        background: 'var(--white)', border: '1px solid var(--gray3)',
        borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)', marginTop: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)' }}>Atividade Recente</div>
            <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 1 }}>Eventos em tempo real</div>
          </div>
          <div />
        </div>
        <ActivityFeed />
      </div>
    </div>
  )
}
