'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState, useCallback } from 'react'
import { formatNumber, formatPercent } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { FunnelMetric, LeadLog, LeadImport, ChatHistory } from '@/lib/supabase'

/* ══════════════════════════════════════════
   PERIOD CONFIG
══════════════════════════════════════════ */
type Period = '7d' | '30d' | '90d' | '12m'

const PERIOD_OPTIONS: { key: Period; label: string; full: string }[] = [
  { key: '7d',  label: '7D',  full: 'Últimos 7 dias'   },
  { key: '30d', label: '30D', full: 'Últimos 30 dias'  },
  { key: '90d', label: '90D', full: 'Últimos 90 dias'  },
  { key: '12m', label: '12M', full: 'Últimos 12 meses' },
]

function periodStart(p: Period): Date {
  const d = new Date()
  if (p === '7d')  { d.setDate(d.getDate() - 7) }
  if (p === '30d') { d.setDate(d.getDate() - 30) }
  if (p === '90d') { d.setDate(d.getDate() - 90) }
  if (p === '12m') { d.setFullYear(d.getFullYear() - 1) }
  return d
}

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
  if (!data || data.length < 2) return <svg width={W} height={H} />
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
      <circle cx={pts[pts.length-1].split(',')[0]} cy={pts[pts.length-1].split(',')[1]} r="3" fill={color} />
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
   SKELETON
══════════════════════════════════════════ */
function Skeleton({ w = '100%', h = 20, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div className="shimmer-bar" style={{
      width: w, height: h, borderRadius: r,
      background: 'var(--gray3)',
    }} />
  )
}

/* ══════════════════════════════════════════
   SUMMARY CARD
══════════════════════════════════════════ */
function SummaryCard({ label, value, suffix, change, icon, delay, sparkData, loading }: {
  label: string; value: number; suffix: string; change: number
  icon: React.ReactNode; delay: number; sparkData: number[]; loading?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const animated = useCountUp(value)
  const display = suffix === '%' ? formatPercent(animated) : formatNumber(Math.round(animated))

  if (loading) return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--gray3)',
      borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <Skeleton w="55%" h={12} />
        <Skeleton w={34} h={34} r={9} />
      </div>
      <Skeleton w="40%" h={30} r={6} />
      <div style={{ marginTop: 12 }}><Skeleton w="60%" h={10} /></div>
    </div>
  )

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
      {hovered && (
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,48,37,0.08) 0%, transparent 70%)',
          animation: 'fadeIn .3s ease both', pointerEvents: 'none',
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
        letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10, transition: 'color .2s',
      }}>
        {display}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
            background: change > 0 ? 'rgba(30,138,62,0.08)' : change < 0 ? 'rgba(217,48,37,0.08)' : 'rgba(100,100,100,0.08)',
            color: change > 0 ? '#1E8A3E' : change < 0 ? '#D93025' : 'var(--gray)',
            border: `1px solid ${change > 0 ? 'rgba(30,138,62,0.20)' : change < 0 ? 'rgba(217,48,37,0.20)' : 'rgba(100,100,100,0.15)'}`,
          }}>
            {change > 0 ? '↑' : change < 0 ? '↓' : '—'} {change !== 0 ? `${Math.abs(change)}%` : 'estável'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500 }}>vs. mês ant.</span>
        </div>
        <Sparkline data={sparkData} color="#D93025" />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   FUNNEL CHART
══════════════════════════════════════════ */
interface FunnelStage { label: string; value: number; color: string }

function FunnelChart({ data }: { data: FunnelStage[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const mounted = useMounted()
  const max = data[0]?.value || 1
  const W = 680, H = 120
  const segW = W / data.length
  const maxH = 100, minH = 38

  const pts = data.map((s, i) => {
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
          {pts.map((_, i) => (
            <filter key={i} id={`glow${i}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          ))}
        </defs>
        {pts.map((p, i) => {
          const next = pts[i + 1]
          if (!next) return null
          return (
            <polygon key={`conn-${i}`}
              points={[`${p.x+segW-4},${p.yTop}`,`${next.x+4},${next.yTop}`,`${next.x+4},${next.yBot}`,`${p.x+segW-4},${p.yBot}`].join(' ')}
              fill={p.color} opacity={hovered===i||hovered===i+1 ? 0.25 : 0.12}
              style={{ transition: 'opacity .2s' }}
            />
          )
        })}
        {pts.map((p, i) => {
          const isHov = hovered === i
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              <rect x={p.x} y={0} width={segW} height={H} fill="transparent" />
              {isHov && <rect x={p.x+6} y={p.yTop+2} width={segW-12} height={p.h-4} rx="8" fill={p.color} opacity="0.3" filter={`url(#glow${i})`} />}
              <rect
                x={p.x+6} y={p.yTop} width={segW-12} height={p.h} rx="7"
                fill={`url(#fgrad${i})`}
                transform={isHov ? `scale(1, 1.04) translate(0, ${-p.h * 0.02})` : 'scale(1,1)'}
                style={{ transition: 'height .8s cubic-bezier(.34,1.2,.64,1), transform .2s ease', transitionDelay: `${i*0.08}s`, transformOrigin: `${p.x+segW/2}px ${H/2}px` }}
              />
              <text x={p.x+segW/2} y={H+10} textAnchor="middle" fontSize="6" fontWeight="700" fill={isHov ? p.color : 'var(--gray)'} fontFamily="Manrope, sans-serif" style={{ transition: 'fill .2s' }}>
                {p.label}
              </text>
              <text x={p.x+segW/2} y={H+19} textAnchor="middle" fontSize={isHov ? '8' : '7'} fontWeight="800" fill={isHov ? p.color : 'var(--black)'} fontFamily="Manrope, sans-serif" style={{ transition: 'all .2s' }}>
                {formatNumber(p.value)}
              </text>
              {i > 0 && (
                <text x={p.x+segW/2} y={H+27} textAnchor="middle" fontSize="6" fontWeight="600" fill={isHov ? p.color : 'var(--gray2)'} fontFamily="Manrope, sans-serif" style={{ transition: 'fill .2s' }}>
                  {formatPercent((p.value / data[0].value) * 100)}
                </text>
              )}
              {isHov && p.h > 40 && (
                <text x={p.x+segW/2} y={H/2+5} textAnchor="middle" fontSize="11" fontWeight="800" fill="rgba(255,255,255,0.9)" fontFamily="Manrope, sans-serif" style={{ animation: 'fadeIn .15s ease both', pointerEvents: 'none' }}>
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
   MONTHLY BARS
══════════════════════════════════════════ */
function MonthlyBars({ data }: { data: { label: string; value: number }[] }) {
  const mounted = useMounted()
  const [hovered, setHovered] = useState<number | null>(null)
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', inset: '0 0 28px 0', pointerEvents: 'none' }}>
        {[25, 50, 75, 100].map(pct => (
          <div key={pct} style={{ position: 'absolute', left: 0, right: 0, bottom: `${pct}%`, borderTop: '1px dashed var(--gray3)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, paddingBottom: 28, position: 'relative' }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100
          const isHov = hovered === i
          const isLast = i === data.length - 1
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {isHov && (
                <div style={{ position: 'absolute', bottom: 'calc(100% - 24px)', left: '50%', transform: 'translateX(-50%)', background: 'var(--black)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 9px', borderRadius: 7, whiteSpace: 'nowrap', animation: 'panelUp .15s ease both', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  {formatNumber(d.value)} leads
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--black)' }} />
                </div>
              )}
              <div style={{ fontSize: 9, fontWeight: 800, color: isHov ? 'var(--primary)' : 'transparent', marginBottom: 3, transition: 'color .15s', height: 12 }}>
                {formatNumber(d.value)}
              </div>
              <div style={{
                width: '100%', borderRadius: '5px 5px 0 0',
                background: isHov ? 'var(--primary)' : isLast ? 'rgba(217,48,37,0.55)' : 'var(--primary-dim)',
                height: mounted ? `${pct}%` : '2px', minHeight: 4,
                transition: `height .7s cubic-bezier(.34,1.2,.64,1) ${i*0.06}s, background .2s`,
                transform: isHov ? 'scaleX(1.05)' : 'scaleX(1)',
                position: 'relative', overflow: 'hidden',
                boxShadow: isHov ? '0 -4px 12px rgba(217,48,37,0.3)' : 'none',
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)' }} />
              </div>
              <div style={{ fontSize: 9, fontWeight: isLast ? 800 : 700, color: isLast ? 'var(--primary)' : isHov ? 'var(--black)' : 'var(--gray2)', marginTop: 5, position: 'absolute', bottom: 0, transition: 'color .15s', textAlign: 'center', lineHeight: 1.2 }}>
                {d.label}
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
interface DonutSegment { label: string; value: number; color: string }

function DonutChart({ data }: { data: DonutSegment[] }) {
  const mounted = useMounted()
  const [hovered, setHovered] = useState<number | null>(null)
  const R = 54, CX = 72, CY = 72
  const circumference = 2 * Math.PI * R
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  let offset = 0

  const segments = data.map(d => {
    const pct = (d.value / total) * 100
    const dash = (pct / 100) * circumference
    const currentOffset = offset
    offset += dash
    return { ...d, pct, dash, offset: currentOffset }
  })

  const active = hovered !== null ? segments[hovered] : segments[0]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="144" height="144" viewBox="0 0 144 144">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--gray3)" strokeWidth="16" />
          {segments.map((s, i) => {
            const isHov = hovered === i
            const strokeDash = mounted ? s.dash : 0
            return (
              <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={s.color}
                strokeWidth={isHov ? 22 : 16}
                strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                strokeDashoffset={-s.offset}
                transform="rotate(-90, 72, 72)"
                style={{ transition: `stroke-dasharray 1s cubic-bezier(.4,0,.2,1) ${i*0.15}s, stroke-width .2s`, filter: isHov ? `drop-shadow(0 0 6px ${s.color}80)` : 'none', cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              />
            )
          })}
          <text x={CX} y={CY+5} textAnchor="middle" fontSize="20" fontWeight="800" fill={active?.color} fontFamily="Manrope, sans-serif" style={{ transition: 'fill .2s' }}>
            {active ? formatPercent(active.pct) : '—'}
          </text>
          <text x={CX} y={CY+18} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--gray2)" fontFamily="Manrope, sans-serif">
            {active?.label.toUpperCase()}
          </text>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, paddingRight: 4 }}>
        {segments.map((d, i) => {
          const isHov = hovered === i
          return (
            <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 8px', borderRadius: 7, background: isHov ? `${d.color}12` : 'transparent', border: `1px solid ${isHov ? `${d.color}30` : 'transparent'}`, transition: 'all .18s' }}>
              <div style={{ width: isHov ? 14 : 10, height: isHov ? 14 : 10, borderRadius: 3, background: d.color, flexShrink: 0, transition: 'all .18s', boxShadow: isHov ? `0 0 8px ${d.color}60` : 'none' }} />
              <span style={{ fontSize: 12, fontWeight: isHov ? 700 : 600, color: isHov ? 'var(--black)' : 'var(--gray)', flex: 1, transition: 'all .15s' }}>{d.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: isHov ? d.color : 'var(--black)', transition: 'color .15s' }}>
                {formatPercent(d.pct)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   ACTIVITY FEED (lead_logs reais)
══════════════════════════════════════════ */
const SENTIMENT_COLOR: Record<string, string> = {
  positivo: '#1E8A3E',
  neutro:   '#2563eb',
  negativo: '#D93025',
}
const SENTIMENT_ICON: Record<string, React.ReactNode> = {
  positivo: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M5.5 9.5s.8 1.5 2.5 1.5 2.5-1.5 2.5-1.5"/><path d="M6 6.5h.01M10 6.5h.01"/></svg>,
  neutro:   <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M5.5 10h5"/><path d="M6 6.5h.01M10 6.5h.01"/></svg>,
  negativo: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M5.5 10.5s.8-1.5 2.5-1.5 2.5 1.5 2.5 1.5"/><path d="M6 6.5h.01M10 6.5h.01"/></svg>,
}

function formatAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

/* Parse "Usuario: João\nmensagem: texto" ou retorna o conteúdo puro */
function parseHumanContent(content: string): { name: string; message: string } {
  const nameMatch = content.match(/^Usuario:\s*(.+)/m)
  const msgMatch  = content.match(/^mensagem:\s*([\s\S]+)/m)
  return {
    name:    nameMatch?.[1]?.trim() ?? 'Desconhecido',
    message: msgMatch?.[1]?.trim()  ?? content.trim(),
  }
}

/* +55 31 99999-9999 */
function formatPhone(phone: string): string {
  if (phone.length >= 12 && phone.startsWith('55')) {
    const area = phone.slice(2, 4)
    const num  = phone.slice(4)
    if (num.length === 9) return `+55 (${area}) ${num.slice(0, 5)}-${num.slice(5)}`
    if (num.length === 8) return `+55 (${area}) ${num.slice(0, 4)}-${num.slice(4)}`
  }
  return phone
}

function ActivityFeed({ items, loading }: { items: ChatHistory[]; loading: boolean }) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--gray3)' }}>
          <Skeleton w={32} h={32} r={8} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <Skeleton w="50%" h={11} />
            <Skeleton w="80%" h={10} />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((item, idx) => {
        const isHuman = item.message.type === 'human'
        const { name, message } = isHuman
          ? parseHumanContent(item.message.content)
          : { name: 'IA', message: item.message.content.trim() }
        const preview  = message.slice(0, 70) + (message.length > 70 ? '…' : '')
        const phone    = formatPhone(item.session_id)
        const bgColor  = isHuman ? '#2563eb' : 'var(--primary)'
        const badgeBg  = isHuman ? '#2563eb18' : 'var(--primary-dim)'
        const badgeClr = isHuman ? '#2563eb'   : 'var(--primary)'

        return (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 0',
            borderBottom: idx < items.length - 1 ? '1px solid var(--gray3)' : 'none',
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `${bgColor}18`,
              border: `1px solid ${bgColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
            }}>
              {isHuman ? '👤' : '🤖'}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isHuman ? name : 'Resposta IA'}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 100, background: badgeBg, color: badgeClr, border: `1px solid ${badgeClr}25`, flexShrink: 0 }}>
                  {isHuman ? 'cliente' : 'ia'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isHuman ? phone : preview}
              </div>
              {isHuman && (
                <div style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                  {preview}
                </div>
              )}
            </div>

            {/* ID badge (sem timestamp na tabela) */}
            <div style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 600, flexShrink: 0 }}>
              #{item.id}
            </div>
          </div>
        )
      })}
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray2)', fontSize: 13 }}>
          Nenhuma conversa registrada
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   PERIOD FILTER
══════════════════════════════════════════ */
function PeriodFilter({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const [hov, setHov] = useState<Period | null>(null)
  return (
    <div style={{ display: 'flex', background: 'var(--gray3)', borderRadius: 10, padding: 3, gap: 2 }}>
      {PERIOD_OPTIONS.map(opt => {
        const active = period === opt.key
        return (
          <button key={opt.key} onClick={() => onChange(opt.key)}
            onMouseEnter={() => setHov(opt.key)} onMouseLeave={() => setHov(null)}
            title={opt.full}
            style={{
              padding: '5px 16px', borderRadius: 8, border: 'none',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: active ? 'var(--white)' : hov === opt.key ? 'rgba(255,255,255,0.5)' : 'transparent',
              color: active ? 'var(--black)' : 'var(--gray)',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all .15s ease',
            }}
          >{opt.label}</button>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Raw data from Supabase
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetric[]>([])
  const [leadLogs, setLeadLogs] = useState<LeadLog[]>([])
  const [totalLogsCount, setTotalLogsCount] = useState(0)
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([])

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true)
    setError(null)
    try {
      const since = periodStart(p).toISOString()

      const [funnelRes, logsRes, chatsRes] = await Promise.all([
        supabase.from('funnel_metrics').select('*').order('month', { ascending: true }),
        // count: 'exact' retorna o total real independente do limite de rows
        // limit(5000) cobre os registros atuais e futuros próximos
        supabase.from('lead_logs')
          .select('*', { count: 'exact' })
          .gte('criado_em', since)
          .limit(5000),
        // n8n_chat_histories: sem coluna de data — ordena pelo id mais recente
        supabase.from('n8n_chat_histories')
          .select('*')
          .order('id', { ascending: false })
          .limit(30),
      ])

      if (funnelRes.error) throw funnelRes.error
      if (logsRes.error)   throw logsRes.error
      if (chatsRes.error)  throw chatsRes.error

      setFunnelMetrics(funnelRes.data ?? [])
      // usa o count exato do Supabase quando disponível
      setLeadLogs(logsRes.data ?? [])
      setTotalLogsCount(logsRes.count ?? logsRes.data?.length ?? 0)
      setRecentChats((chatsRes.data ?? []) as ChatHistory[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(period) }, [period, fetchData])

  /* ── Computed metrics ── */
  const totalLeads      = funnelMetrics.reduce((s, m) => s + m.total_leads, 0)
  const contactRate     = funnelMetrics.length
    ? funnelMetrics.reduce((s, m) => s + m.contact_rate, 0) / funnelMetrics.length
    : 0
  const totalInteractions = leadLogs.length
  const positiveCount   = leadLogs.filter(l => l.sentimento === 'positivo').length
  const positiveRate    = totalInteractions ? (positiveCount / totalInteractions) * 100 : 0

  /* Sentiment distribution */
  const neutroCount  = leadLogs.filter(l => l.sentimento === 'neutro').length
  const negativeCount = leadLogs.filter(l => l.sentimento === 'negativo').length
  const donutData = [
    { label: 'Positivo', value: positiveCount,  color: '#1E8A3E' },
    { label: 'Neutro',   value: neutroCount,     color: '#AAAAAA' },
    { label: 'Negativo', value: negativeCount,   color: '#D93025' },
  ]

  /* Monthly volume for bar chart */
  const monthlyBars = funnelMetrics.map(m => ({
    label: new Date(m.month).toLocaleDateString('pt-BR', { month: 'short' }),
    value: m.total_leads,
  }))

  /* Sparkline data from monthly totals */
  const monthlyTotals = funnelMetrics.map(m => m.total_leads)

  /* Funnel — soma de cada coluna do funnel_metrics */
  const totalContacted  = funnelMetrics.reduce((s, m) => s + m.contacted_count,  0)
  const totalResponded  = funnelMetrics.reduce((s, m) => s + m.response_count,   0)
  const totalMeetings   = funnelMetrics.reduce((s, m) => s + m.meeting_count,    0)
  const totalProposals  = funnelMetrics.reduce((s, m) => s + m.proposal_count,   0)
  const totalClosed     = funnelMetrics.reduce((s, m) => s + m.closed_count,     0)

  const funnelData: FunnelStage[] = [
    { label: 'Disparados',  value: totalLeads,      color: '#D93025' },
    { label: 'Contatados',  value: totalContacted,  color: '#E05540' },
    { label: 'Responderam', value: totalResponded,  color: '#E87060' },
    { label: 'Reuniões',    value: totalMeetings,   color: '#F09080' },
    { label: 'Propostas',   value: totalProposals,  color: '#F8B0A0' },
    { label: 'Fechamentos', value: totalClosed,     color: '#FDD0C8' },
  ]

  /* Month-over-month change for KPIs */
  const lastTwo = funnelMetrics.slice(-2)
  const momLeads = lastTwo.length === 2 && lastTwo[0].total_leads > 0
    ? Math.round(((lastTwo[1].total_leads - lastTwo[0].total_leads) / lastTwo[0].total_leads) * 100)
    : 0

  const SUMMARY_CARDS = [
    {
      label: 'Total Disparados',
      value: totalLeads,
      suffix: '',
      change: momLeads,
      sparkData: monthlyTotals,
      icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M2 5l8 5 8-5M2 5h16v12H2z"/></svg>,
    },
    {
      label: 'Taxa de Contato',
      value: contactRate,
      suffix: '%',
      change: 0,
      sparkData: funnelMetrics.map(m => m.contact_rate),
      icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M18 10c0 4.418-3.582 8-8 8a7.96 7.96 0 0 1-4-1.07L2 18l1.07-4A7.96 7.96 0 0 1 2 10C2 5.582 5.582 2 10 2s8 3.582 8 8Z"/></svg>,
    },
    {
      label: 'Interações IA',
      value: totalLogsCount,
      suffix: '',
      change: 0,
      sparkData: monthlyTotals.map(v => Math.round(v * 0.05)),
      icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6"/><path d="M14 5l1.5 1.5L18 4" strokeWidth="1.5"/></svg>,
    },
    {
      label: 'Sentimento Positivo',
      value: positiveRate,
      suffix: '%',
      change: 0,
      sparkData: funnelMetrics.map(m => m.contact_rate * 0.4),
      icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M7 11.5s.8 2 3 2 3-2 3-2"/><path d="M7.5 8h.01M12.5 8h.01"/></svg>,
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="animate-slide-up delay-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.02em' }}>Dashboard</div>
          <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>
            Performance comercial da IA
            {!loading && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--gray2)' }}>· {funnelMetrics.length} meses de dados</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {error && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-dim)', padding: '4px 10px', borderRadius: 100, border: '1px solid var(--primary-mid)' }}>
              ⚠ {error}
            </span>
          )}
          <button onClick={() => fetchData(period)} title="Atualizar dados" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--white)', border: '1px solid var(--gray3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray)' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M14 8A6 6 0 1 1 8 2"/><path d="M14 2v4h-4"/>
            </svg>
          </button>
          <PeriodFilter period={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {SUMMARY_CARDS.map((m, i) => (
          <SummaryCard key={i} {...m} delay={i + 1} loading={loading} />
        ))}
      </div>

      {/* Funnel */}
      <div className="animate-slide-up delay-6" style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--black)' }}>Funil de Atendimento IA</div>
            <div style={{ fontSize: 12, color: 'var(--gray2)', marginTop: 2 }}>Passe o mouse sobre cada etapa para detalhes</div>
          </div>
          <AskAIButton question={`Analise meu funil: ${totalLeads} disparados → ${totalContacted} contatados → ${totalResponded} responderam → ${totalMeetings} reuniões → ${totalProposals} propostas → ${totalClosed} fechamentos. Quais etapas têm maior perda?`} />
        </div>
        {loading
          ? <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Skeleton w="100%" h={120} r={8} /></div>
          : funnelData[0].value > 0
            ? <FunnelChart data={funnelData} />
            : <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray2)', fontSize: 13 }}>Nenhum dado no período selecionado</div>
        }
      </div>

      {/* Bottom: 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 380px', gap: 16 }}>
        {/* Monthly Volume */}
        <div className="animate-slide-up delay-7" style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)', marginBottom: 2 }}>Volume Mensal de Leads</div>
              <div style={{ fontSize: 11, color: 'var(--gray2)' }}>Disparos por mês · dados reais</div>
            </div>
            <AskAIButton question={`Analise meu volume mensal de leads: ${monthlyBars.map(m => `${m.label} ${m.value}`).join(', ')}. Qual o padrão de crescimento e como otimizar?`} />
          </div>
          {loading ? <Skeleton w="100%" h={140} /> : <MonthlyBars data={monthlyBars} />}
        </div>

        {/* Sentiment */}
        <div className="animate-slide-up delay-8" style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)', marginBottom: 2 }}>Sentimento das Conversas</div>
              <div style={{ fontSize: 11, color: 'var(--gray2)' }}>{totalLogsCount} interações analisadas</div>
            </div>
            <AskAIButton question={`Sentimento das ${totalInteractions} conversas da IA: ${positiveCount} positivos (${formatPercent(positiveRate)}), ${neutroCount} neutros, ${negativeCount} negativos. Analise e sugira melhorias.`} />
          </div>
          {loading
            ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 144 }}><Skeleton w={144} h={144} r={72} /></div>
            : <DonutChart data={donutData} />
          }
        </div>

        {/* Donut / Contact Rate by month */}
        <div className="animate-slide-up delay-7" style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)', marginBottom: 2 }}>Taxa de Contato por Mês</div>
              <div style={{ fontSize: 11, color: 'var(--gray2)' }}>% de leads contatados</div>
            </div>
          </div>
          {loading
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{Array.from({length: 5}).map((_,i) => <Skeleton key={i} w="100%" h={24} />)}</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {funnelMetrics.map((m, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray)' }}>
                        {new Date(m.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: m.contact_rate >= 90 ? '#1E8A3E' : 'var(--primary)' }}>
                        {formatPercent(m.contact_rate)}
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 100,
                        background: m.contact_rate >= 90 ? '#1E8A3E' : 'var(--primary)',
                        width: `${m.contact_rate}%`,
                        transition: `width 1s cubic-bezier(.4,0,.2,1) ${i*0.1}s`,
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'barSweep 2.5s ease infinite', animationDelay: `${i*0.3}s` }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 2 }}>
                      {formatNumber(m.contacted_count)} de {formatNumber(m.total_leads)} leads
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* Activity Feed */}
      <div className="animate-slide-up delay-8" style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)' }}>Conversas Recentes</div>
            <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 1 }}>Últimas interações registradas pela IA</div>
          </div>
          {!loading && recentChats.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)' }}>
              {recentChats.length} mensagens
            </span>
          )}
        </div>
        <ActivityFeed items={recentChats} loading={loading} />
      </div>
    </div>
  )
}
