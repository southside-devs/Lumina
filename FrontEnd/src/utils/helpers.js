export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatNumber(n) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('en-IN')
}

export function getRiskColor(score) {
  if (score >= 80) return '#da3633'
  if (score >= 60) return '#f0883e'
  if (score >= 30) return '#f5c518'
  return '#2ea043'
}

export function getRiskLabel(score) {
  if (score >= 80) return 'Critical'
  if (score >= 60) return 'High'
  if (score >= 30) return 'Medium'
  return 'Low'
}

export function paginate(total, limit, offset) {
  return {
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit),
    hasMore: offset + limit < total,
    hasPrev: offset > 0,
  }
}

export function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function toastError(msg) {
  console.error('[Lumina]', msg)
}

// Generate mock lat/lon within Karnataka for demo
export function mockKarnatakaCoord() {
  return {
    lat: 11.5 + Math.random() * 7,
    lon: 74.0 + Math.random() * 4.5,
  }
}
