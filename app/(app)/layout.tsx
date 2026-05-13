import { AppShell } from '@/components/layout/AppShell'
import { AIAssistant } from '@/components/AIAssistant'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <AIAssistant />
    </>
  )
}
