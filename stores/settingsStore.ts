import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  brandName: string
  tagline: string
  logoUrl: string
  setBrandName: (v: string) => void
  setTagline: (v: string) => void
  setLogoUrl: (v: string) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      brandName: '300 Franchising',
      tagline: 'Analytics · Insights · IA',
      logoUrl: '',
      setBrandName: (v) => set({ brandName: v }),
      setTagline: (v) => set({ tagline: v }),
      setLogoUrl: (v) => set({ logoUrl: v }),
    }),
    { name: 'sasbi-settings' }
  )
)
