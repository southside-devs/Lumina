const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  })
  const json = await res.json()
  if (json.status === 'error') throw new Error(json.message || 'API Error')
  return json
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

// FIRs
export const firApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return api.get(`/firs${q ? '?' + q : ''}`)
  },
  search: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return api.get(`/firs/search${q ? '?' + q : ''}`)
  },
  get: (id) => api.get(`/firs/${id}`),
  create: (data) => api.post('/firs', data),
  update: (id, data) => api.put(`/firs/${id}`, data),
}

// Accused
export const accusedApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return api.get(`/accused${q ? '?' + q : ''}`)
  },
  get: (id) => api.get(`/accused/${id}`),
  create: (data) => api.post('/accused', data),
  update: (id, data) => api.put(`/accused/${id}`, data),
}

// Victims
export const victimApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return api.get(`/victims${q ? '?' + q : ''}`)
  },
  get: (id) => api.get(`/victims/${id}`),
  create: (data) => api.post('/victims', data),
}

// Case-Accused links
export const caseAccusedApi = {
  create: (data) => api.post('/case-accused', data),
  delete: (id) => api.delete(`/case-accused/${id}`),
}

// Districts
export const districtApi = {
  list: () => api.get('/districts?limit=100'),
}

// Stations
export const stationApi = {
  list: (districtId) => api.get(`/stations?limit=300${districtId ? '&district_id=' + districtId : ''}`),
}

// Dashboard
export const dashboardApi = {
  overview: () => api.get('/dashboard/overview'),
  trends: () => api.get('/dashboard/crime-trends'),
  districtSummary: () => api.get('/dashboard/district-summary'),
}

// Risk Scores
export const riskApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return api.get(`/risk-scores${q ? '?' + q : ''}`)
  },
}
