import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface Revision {
  original: string
  suggested_revision: string
  reason: string
}

interface ResumeMorphPanelProps {
  revisions: Revision[]
}

export default function ResumeMorphPanel({ revisions }: ResumeMorphPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  if (!revisions.length) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        Run analysis to get AI-powered resume improvements
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {revisions.map((rev, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card p-4 space-y-3"
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
            <span className="text-xs font-semibold text-neon-cyan">AI Suggestion #{i + 1}</span>
          </div>

          {/* Before */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Original</p>
            <div className="px-3 py-2 rounded-lg bg-danger/5 border border-danger/10 relative">
              <p className="text-xs text-slate-400 leading-relaxed">{rev.original}</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gradient-to-r from-danger/20 via-neon-cyan/30 to-emerald/20" />
            <ArrowRight className="w-4 h-4 text-neon-cyan shrink-0" />
            <div className="flex-1 h-px bg-gradient-to-r from-emerald/20 to-transparent" />
          </div>

          {/* After */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Improved</p>
            <div className="px-3 py-2 rounded-lg bg-emerald/5 border border-emerald/10 relative group">
              <p className="text-xs text-emerald-300 leading-relaxed font-medium">{rev.suggested_revision}</p>
              <button
                onClick={() => copy(rev.suggested_revision, i)}
                className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-hover text-slate-500 hover:text-slate-300 transition-all"
              >
                {copiedIndex === i
                  ? <Check className="w-3 h-3 text-emerald" />
                  : <Copy className="w-3 h-3" />
                }
              </button>
            </div>
          </div>

          {/* Reason */}
          {rev.reason && (
            <div className="px-3 py-2 rounded-lg bg-neon-cyan/[0.03] border border-neon-cyan/10">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                <span className="text-neon-cyan font-semibold">Why: </span>
                {rev.reason}
              </p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
