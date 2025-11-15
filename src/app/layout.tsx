'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { RootAdapters } from '@/client/providers/RootAdapters'
import { FjellErrorBoundary } from '@/client/components/ErrorBoundary'
import './globals.css'
import { ReferenceLoaders } from '@/client/providers/ReferenceLoaders'

const navItems = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/cache-demo', icon: '🎮', label: 'Cache Demo' },
  { href: '/cache-debug', icon: '🔍', label: 'Debug' },
  { href: '/cache-controls', icon: '🧪', label: 'Controls' },
  { href: '/certification', icon: '🏆', label: 'Certification' },
  { href: '/api', icon: '📡', label: 'API', isExternal: true },
];

function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="text-3xl">⚡</span>
        <div>
          <h1 className="text-xl font-bold text-white">Fjell</h1>
          <p className="text-xs text-gray-400">Sample App</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ href, icon, label, isExternal }) => {
          const isActive = !isExternal && pathname === href
          const linkClass = `nav-link ${isActive ? 'nav-link-active' : ''}`
          
          if (isExternal) {
            return (
              <a key={href} href={href} className={linkClass} target="_blank" rel="noopener noreferrer">
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{label}</span>
              </a>
            )
          }

          return (
            <Link key={href} href={href} className={linkClass}>
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <p className="text-xs">Built with Fjell</p>
      </div>
    </aside>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Fjell Sample App</title>
        <meta name="description" content="Widget Management System built with Fjell Framework" />
      </head>
      <body>
        <FjellErrorBoundary>
          <RootAdapters>
            <ReferenceLoaders>
              <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                  <FjellErrorBoundary>
                    {children}
                  </FjellErrorBoundary>
                </main>
              </div>
            </ReferenceLoaders>
          </RootAdapters>
        </FjellErrorBoundary>
      </body>
    </html>
  )
}
