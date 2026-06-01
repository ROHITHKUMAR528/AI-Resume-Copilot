import { useQuery } from '@tanstack/react-query'
import { analysisAPI } from '@/services/api'
import { motion } from 'framer-motion'
import { History as HistoryIcon, TrendingUp, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface AnalysisItem {
  id: string
  job_title: string | null
  company_name: string | null
  match_percentage: number | null
  ats_score: number | null
  status: string
  created_at: string
}

function ScoreBadge({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <span className="text-slate-600 text-xs">—</span>
  const color = value >= 75 ? 'text-emerald' : value >= 50 ? 'text-amber' : 'text-danger'
  return (
    <div className="text-center">
      <p className={`text-lg font-black ${color}`}>{Math.round(value)}%</p>
      <p className="text-[10px] text-slate-600">{label}</p>
    </div>
  )
}

export default function History() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => analysisAPI.history().then(r => r.data as AnalysisItem[]),
  })

  const analyses = data || []

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <HistoryIcon className="w-6 h-6 text-neon-cyan" />
          <div>
            <h1 className="text-2xl font-black text-white">Analysis History</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track your resume performance over time</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-5 flex gap-4 items-center">
              <div className="skeleton w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
              <div className="skeleton h-10 w-20 rounded" />
              <div className="skeleton h-10 w-20 rounded" />
            </div>
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <HistoryIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-400">No analyses yet</p>
          <p className="text-sm text-slate-600 mt-2">
            Run your first resume analysis from the{' '}
            <button onClick={() => navigate('/dashboard')} className="text-neon-cyan hover:underline">
              Dashboard
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/dashboard?analysis=${item.id}`)}
              className="glass-card-hover p-5 cursor-pointer flex items-center gap-5"
            >
              {/* Status indicator */}
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                item.status === 'completed' ? 'bg-emerald' : 'bg-amber animate-pulse'
              }`} />

              {/* Job info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {item.job_title || 'Untitled Position'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {item.company_name && (
                    <span className="text-xs text-slate-500">{item.company_name}</span>
                  )}
                  <span className="text-slate-700">·</span>
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <Clock className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* Scores */}
              <div className="flex items-center gap-6 shrink-0">
                <ScoreBadge value={item.match_percentage} label="Match" />
                <div className="w-px h-10 bg-bg-border" />
                <ScoreBadge value={item.ats_score} label="ATS" />
              </div>

              {/* Trend icon placeholder */}
              <TrendingUp className="w-4 h-4 text-slate-700 shrink-0" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
