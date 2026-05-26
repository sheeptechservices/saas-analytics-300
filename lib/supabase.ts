import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(url, key)

/* ── Types ── */
export interface FunnelMetric {
  month: string
  total_leads: number
  contacted_count: number
  response_count: number
  meeting_count: number
  proposal_count: number
  closed_count: number
  contact_rate: number
  response_rate: number
  meeting_rate: number
  proposal_rate: number
  close_rate: number
  overall_conversion_rate: number
}

export interface LeadLog {
  id: string
  lead_id: string
  tipo_interacao: string
  mensagem_input: string
  mensagem_output: string
  sentimento: 'positivo' | 'neutro' | 'negativo' | null
  ocorreu_em: string
  criado_em: string
}

export interface LeadImport {
  id: string
  import_name: string
  file_name: string
  total_records: number
  successful_records: number
  failed_records: number
  status: string
  created_at: string
}

export interface ChatHistory {
  id: number
  session_id: string
  message: {
    type: 'human' | 'ai'
    content: string
    additional_kwargs?: Record<string, unknown>
    response_metadata?: Record<string, unknown>
  }
}
