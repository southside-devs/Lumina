import { useLocation } from 'react-router-dom'
import { Bell, User, Search } from 'lucide-react'
import { getMockUser } from '../../utils/auth.js'

const PAGE_TITLES = {
  '/dashboard': 'Overview Dashboard',
  '/firs': 'Case Search',
  '/firs/new': 'File New FIR',
  '/accused': 'Accused Profiles',
  '/repeat-offenders': 'Repeat Offenders',
  '/crime-map': 'Crime Map',
  '/risk-board': 'Risk Score Board',
  '/network': 'Criminal Network Graph',
  '/trends': 'Crime Trends',
  '/ai-query': 'AI Query Assistant',
}

export default function Topbar() {
  const location = useLocation()
  const user = getMockUser()

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path) && path !== '/'
  )?.[1] || 'Lumina'

  return (
    <header style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 16,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <h1 style={{ fontSize: 15, fontWeight: 600, flex: 1, color: 'var(--text-primary)' }}>
        {title}
      </h1>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 6, padding: '5px 10px',
        color: 'var(--text-secondary)', fontSize: 12,
      }}>
        <Search size={12} />
        <span>Quick search... (⌘K)</span>
      </div>

      <button style={{
        width: 32, height: 32, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
        position: 'relative',
      }}>
        <Bell size={15} />
        <span style={{
          position: 'absolute', top: 5, right: 5,
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--danger)',
        }} />
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 10px 4px 6px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 6, cursor: 'pointer',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--accent-bg)', border: '1px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={12} color="var(--accent)" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{user.first_name} {user.last_name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{user.role}</div>
        </div>
      </div>
    </header>
  )
}
