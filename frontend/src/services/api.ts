import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60 seconds for AI operations
})

// ─── Request Interceptor: Attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response Interceptor: Token Refresh ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          })
          useAuthStore.getState().setTokens(data.access_token, data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  updateProfile: (data: { name?: string; avatar_url?: string }) =>
    api.patch('/api/auth/me', data),
}

// ─── Resume API ───────────────────────────────────────────────────────────────
export const resumeAPI = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list: () => api.get('/api/resumes'),
  get: (id: string) => api.get(`/api/resumes/${id}`),
  delete: (id: string) => api.delete(`/api/resumes/${id}`),
}

// ─── Analysis API ─────────────────────────────────────────────────────────────
export const analysisAPI = {
  analyze: (data: {
    resume_id: string
    job_description: string
    job_title?: string
    company_name?: string
  }) => api.post('/api/analyze', data),
  history: () => api.get('/api/history'),
  get: (id: string) => api.get(`/api/analyses/${id}`),
}

// ─── Roadmap API ──────────────────────────────────────────────────────────────
export const roadmapAPI = {
  generate: (analysisId: string) =>
    api.post(`/api/upskill-roadmap/${analysisId}`),
  get: (analysisId: string) => api.get(`/api/roadmaps/${analysisId}`),
}

// ─── Interview API ────────────────────────────────────────────────────────────
export const interviewAPI = {
  generate: (analysisId: string) =>
    api.post('/api/interview', { analysis_id: analysisId }),
  get: (analysisId: string) => api.get(`/api/interview/${analysisId}`),
}
