import { AlertCircle, Loader } from 'lucide-react'

export function Card({ children, style, className }) {
  return (
    <div className={className} style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, style }) {
  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      ...style,
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}

export function Badge({ children, color = 'var(--accent)', bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600,
      color, background: bg || `${color}22`,
      border: `1px solid ${color}44`,
    }}>
      {children}
    </span>
  )
}

export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, style, type = 'button' }) {
  const sizes = { sm: '6px 12px', md: '8px 16px', lg: '10px 20px' }
  const variants = {
    primary: { background: 'var(--accent)', color: '#fff', border: 'none' },
    secondary: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    danger: { background: 'var(--danger)', color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: sizes[size], borderRadius: 6,
        fontSize: 13, fontWeight: 500,
        cursor: disabled ? 'not-allowed', opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'all 0.15s',
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Input({ label, error, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <input
        style={{
          padding: '8px 12px', borderRadius: 6,
          background: 'var(--bg-elevated)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          color: 'var(--text-primary)', fontSize: 13,
          outline: 'none',
          ...style,
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

export function Select({ label, error, children, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>}
      <select
        style={{
          padding: '8px 12px', borderRadius: 6,
          background: 'var(--bg-elevated)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          color: 'var(--text-primary)', fontSize: 13,
          outline: 'none',
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

export function Spinner({ size = 20 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Loader size={size} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function ErrorState({ message }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 8, padding: 40, color: 'var(--text-secondary)',
    }}>
      <AlertCircle size={32} color="var(--danger)" />
      <div style={{ fontSize: 14 }}>{message || 'Something went wrong'}</div>
    </div>
  )
}

export function EmptyState({ message, icon }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 8, padding: 48, color: 'var(--text-secondary)',
    }}>
      <div style={{ fontSize: 32 }}>{icon || '📭'}</div>
      <div style={{ fontSize: 13 }}>{message || 'No data found'}</div>
    </div>
  )
}

export function StatCard({ label, value, sub, color = 'var(--accent)', icon }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

export function Table({ columns, rows, onRowClick }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: '10px 16px', textAlign: 'left',
                fontWeight: 600, fontSize: 11, letterSpacing: '0.05em',
                color: 'var(--text-secondary)', textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.ROWID || i}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => onRowClick && (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => onRowClick && (e.currentTarget.style.background = 'transparent')}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '10px 16px', color: 'var(--text-primary)' }}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({ total, limit, offset, onChange }) {
  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderTop: '1px solid var(--border)',
      fontSize: 12, color: 'var(--text-secondary)',
    }}>
      <span>Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <Button variant="ghost" size="sm" disabled={page <= 1}
          onClick={() => onChange(offset - limit)}>← Prev</Button>
        <span style={{ padding: '6px 10px', fontSize: 12 }}>Page {page} of {totalPages}</span>
        <Button variant="ghost" size="sm" disabled={page >= totalPages}
          onClick={() => onChange(offset + limit)}>Next →</Button>
      </div>
    </div>
  )
}
