import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, Users, AlertCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

interface InterviewPanelProps {
  technical: string[]
  behavioral: string[]
  gapBased: string[]
}

type Tab = 'technical' | 'behavioral' | 'gap'

export default function InterviewPanel({ technical, behavioral, gapBased }: InterviewPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('technical')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const tabs = [
    { id: 'technical' as Tab, label: 'Technical', icon: Code2, count: technical.length, color: 'neon-cyan' },
    { id: 'behavioral' as Tab, label: 'Behavioral', icon: Users, count: behavioral.length, color: 'emerald' },
    { id: 'gap' as Tab, label: 'Gap-Based', icon: AlertCircle, count: gapBased.length, color: 'amber' },
  ]

  const currentQuestions =
    activeTab === 'technical' ? technical
    : activeTab === 'behavioral' ? behavioral
    : gapBased

  const copyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  if (!technical.length && !behavioral.length && !gapBased.length) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        Generate interview questions to see them here
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-bg-surface border border-bg-border">
        {tabs.map(({ id, label, icon: Icon, count, color }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setExpandedIndex(0) }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-200
              ${activeTab === id
                ? `bg-${color}/10 text-${color} border border-${color}/20`
                : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === id ? `bg-${color}/20` : 'bg-bg-hover'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Questions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {currentQuestions.map((q, i) => (
            <div
              key={i}
              className="glass-card overflow-hidden"
            >
              <button
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-bg-hover/50 transition-colors"
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
              >
                <span className="text-[10px] font-bold text-slate-600 bg-bg-surface rounded-full px-1.5 py-0.5 shrink-0 mt-0.5">
                  Q{i + 1}
                </span>
                <p className="flex-1 text-xs text-slate-300 font-medium leading-relaxed">{q}</p>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyQuestion(q, i) }}
                    className="p-1 rounded hover:bg-bg-hover text-slate-600 hover:text-slate-300 transition-colors"
                  >
                    {copiedIndex === i ? (
                      <Check className="w-3 h-3 text-emerald" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  {expandedIndex === i
                    ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  }
                </div>
              </button>

              <AnimatePresence>
                {expandedIndex === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 border-t border-bg-border">
                      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                        💡 <strong className="text-slate-400">Tip:</strong> Structure your answer using the STAR method
                        (Situation, Task, Action, Result). Be specific and quantify your impact where possible.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
