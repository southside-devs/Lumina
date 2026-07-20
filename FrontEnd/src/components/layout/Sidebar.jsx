import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, PlusCircle, Users, AlertTriangle,
  Map, BarChart3, Network, Target, Bot, ChevronRight,
  Shield, Activity,
} from 'lucide-react'

const OPERATIONAL = [
  { to: '/firs', icon: FileText, label: 'Case Search' },
  { to: '/firs/new', icon: PlusCircle, label: 'File FIR' },
  { to: '/accused', icon: Users, label: 'Accused' },
  { to: '/repeat-offenders', icon: AlertTriangle, label: 'Repeat Offenders' },
]

const ANALYTICS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/crime-map', icon: Map, label: 'Crime Map' },
  { to: '/risk-board', icon: Target, label: 'Risk Board' },
  { to: '/network', icon: Network, label: 'Network Graph' },
  { to: '/trends', icon: BarChart3, label: 'Crime Trends' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()

  return (
    <aside style={{
      width: collapsed ? 56 : 220,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center',
        padding: collapsed ? '0 16px' : '0 16px',
        borderBottom: '1px solid var(--border)',
        gap: 10, cursor: 'pointer', flexShrink: 0,
      }} onClick={onToggle}>
        <Shield size={22} color="var(--accent)" style={{ flexShrink: 0 }} />
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            Lumina
          </span>
        )}
      </div>

      {/* Live pulse bar */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, transparent, var(--accent), transparent)`,
        animation: 'pulse-live 2s ease-in-out infinite',
        flexShrink: 0,
      }} />

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {/* Operations */}
        <SectionLabel collapsed={collapsed} label="Operations" />
        {OPERATIONAL.map(item => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}

        <div style={{ height: 1, background: 'var(--border)', margin: '12px 8px' }} />

        {/* Intelligence */}
        <SectionLabel collapsed={collapsed} label="Intelligence" />
        {ANALYTICS.map(item => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}

        <div style={{ height: 1, background: 'var(--border)', margin: '12px 8px' }} />

        {/* AI Assistant - coming soon */}
        <NavItem
          to="/ai-query"
          icon={Bot}
          label="AI Query"
          collapsed={collapsed}
          badge="Preview"
        />
      </nav>

      {/* Activity indicator */}
      <div style={{
        padding: collapsed ? '12px 16px' : '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Activity size={14} color="var(--success)" style={{ flexShrink: 0 }} />
        {!collapsed && (
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>System Live</span>
        )}
      </div>
    </aside>
  )
}

function SectionLabel({ collapsed, label }) {
  if (collapsed) return null
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
      color: 'var(--text-muted)', textTransform: 'uppercase',
      padding: '4px 16px 6px',
    }}>
      {label}
    </div>
  )
}

function NavItem({ to, icon: Icon, label, collapsed, badge }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center',
        gap: 10, padding: collapsed ? '9px 16px' : '9px 16px',
        margin: '1px 6px',
        borderRadius: 6,
        fontSize: 13, fontWeight: 500,
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: isActive ? 'var(--bg-elevated)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'all 0.15s',
        textDecoration: 'none',
        whiteSpace: 'nowrap', overflow: 'hidden',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={16} color={isActive ? 'var(--accent)' : undefined} style={{ flexShrink: 0 }} />
          {!collapsed && (
            <>
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: '2px 5px',
                  background: 'var(--accent-bg)', color: 'var(--accent)',
                  borderRadius: 3, letterSpacing: '0.05em',
                }}>
                  {badge}
                </span>
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  )
}
