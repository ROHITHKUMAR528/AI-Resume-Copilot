import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Info, XCircle, TrendingUp } from 'lucide-react'

interface SkillGap {
  skill_name: string
  importance: 'Critical' | 'High' | 'Medium' | 'Low'
  category?: string
}

interface SkillGapPanelProps {
  matchedSkills: string[]
  missingSkills: SkillGap[]
  skillCoverage?: number
}

const importanceConfig = {
  Critical: { color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', icon: XCircle },
  High: { color: 'text-amber', bg: 'bg-amber/10', border: 'border-amber/20', icon: AlertTriangle },
  Medium: { color: 'text-purple', bg: 'bg-purple/10', border: 'border-purple/20', icon: Info },
  Low: { color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700', icon: Info },
}

export default function SkillGapPanel({ matchedSkills, missingSkills, skillCoverage }: SkillGapPanelProps) {
  const sortedMissing = [...missingSkills].sort((a, b) => {
    const order = { Critical: 0, High: 1, Medium: 2, Low: 3 }
    return order[a.importance] - order[b.importance]
  })

  return (
    <div className="space-y-5">
      {/* Coverage bar */}
      {skillCoverage !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Skill Coverage</span>
            <span className={`font-semibold ${
              skillCoverage >= 70 ? 'text-emerald' : skillCoverage >= 50 ? 'text-amber' : 'text-danger'
            }`}>
              {skillCoverage.toFixed(0)}%
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              className={`progress-fill ${
                skillCoverage >= 70 ? 'bg-emerald' : skillCoverage >= 50 ? 'bg-amber' : 'bg-danger'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${skillCoverage}%` }}
              transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
            />
          </div>
        </div>
      )}

      {/* Matched Skills */}
      {matchedSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-3.5 h-3.5 text-emerald" />
            <span className="text-xs font-semibold text-emerald">
              Matched Skills ({matchedSkills.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.slice(0, 12).map((skill, i) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="badge-emerald text-[11px]"
              >
                {skill}
              </motion.span>
            ))}
            {matchedSkills.length > 12 && (
              <span className="badge text-[11px] bg-bg-hover text-slate-400">
                +{matchedSkills.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Skill Gaps */}
      {sortedMissing.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-amber" />
            <span className="text-xs font-semibold text-amber">
              Skills to Learn ({sortedMissing.length})
            </span>
          </div>
          <div className="space-y-2">
            {sortedMissing.map((skill, i) => {
              const cfg = importanceConfig[skill.importance]
              const Icon = cfg.icon
              return (
                <motion.div
                  key={skill.skill_name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${cfg.bg} ${cfg.border}`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold ${cfg.color}`}>
                      {skill.skill_name}
                    </span>
                    {skill.category && (
                      <span className="text-[10px] text-slate-600 ml-2 capitalize">
                        {skill.category}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold ${cfg.color} shrink-0`}>
                    {skill.importance}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {sortedMissing.length === 0 && matchedSkills.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          Run analysis to see skill gaps
        </div>
      )}
    </div>
  )
}
