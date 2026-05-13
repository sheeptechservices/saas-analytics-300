import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'SASBI 3D',
  description: 'Analytics · Insights · IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={manrope.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
