import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Cyber grid background */}
        <div className="fixed inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Hero glow */}
        <div className="fixed top-0 right-0 w-[600px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(6,182,212,0.06), transparent 70%)',
          }}
        />
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
