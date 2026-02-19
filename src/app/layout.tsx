import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: '코드앤버터 CRM | 세일즈 관리',
  description: '코드앤버터 SaaS 세일즈 파이프라인 관리',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <header className="border-b border-[#2d1f42] bg-[#1a1128]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                CB
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  코드앤버터 CRM
                </h1>
                <p className="text-xs text-[#a78bbc]">세일즈 파이프라인 관리</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 overflow-auto min-h-[calc(100vh-65px)]">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
