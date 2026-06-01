import { motion } from 'framer-motion'
import { BookOpen, Video, Code2, FileText, ExternalLink, Clock } from 'lucide-react'

interface Resource {
  type: string
  title: string
  url: string
  platform?: string
  duration?: string
}

interface Step {
  step: number
  title: string
  description: string
  resources: Resource[]
}

interface Roadmap {
  skill_name: string
  importance: string
  steps: Step[]
  estimated_time?: string
}

interface RoadmapTimelineProps {
  roadmaps: Roadmap[]
}

const resourceIcons: Record<string, React.ElementType> = {
  docs: FileText,
  video: Video,
  course: BookOpen,
  article: FileText,
  project: Code2,
}

const importanceColors: Record<string, string> = {
  Critical: 'text-danger border-danger/30 bg-danger/10',
  High: 'text-amber border-amber/30 bg-amber/10',
  Medium: 'text-purple border-purple/30 bg-purple/10',
  Low: 'text-slate-400 border-slate-700 bg-slate-800',
}

export default function RoadmapTimeline({ roadmaps }: RoadmapTimelineProps) {
  if (!roadmaps.length) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        Generate roadmap to see learning paths
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {roadmaps.map((roadmap, ri) => (
        <motion.div
          key={roadmap.skill_name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ri * 0.15 }}
          className="space-y-4"
        >
          {/* Skill header */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{roadmap.skill_name}</h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${importanceColors[roadmap.importance] || importanceColors.Medium}`}>
                  {roadmap.importance}
                </span>
              </div>
              {roadmap.estimated_time && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span className="text-[11px] text-slate-500">{roadmap.estimated_time}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline steps */}
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-neon-cyan/40 via-neon-cyan/20 to-transparent" />

            <div className="space-y-4">
              {roadmap.steps.map((step, si) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: ri * 0.15 + si * 0.1 }}
                  className="relative"
                >
                  {/* Step dot */}
                  <div className="absolute -left-[18px] top-2.5 w-4 h-4 rounded-full border-2 border-neon-cyan/50 bg-bg-primary flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                  </div>

                  <div className="glass-card p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-bold text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded-full border border-neon-cyan/20 shrink-0 mt-0.5">
                        Step {step.step}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{step.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                      </div>
                    </div>

                    {/* Resources */}
                    {step.resources.length > 0 && (
                      <div className="space-y-2">
                        {step.resources.map((res, ri) => {
                          const Icon = resourceIcons[res.type] || FileText
                          return (
                            <a
                              key={ri}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-surface border border-bg-border hover:border-neon-cyan/30 hover:bg-neon-cyan/[0.02] transition-all duration-200 group"
                            >
                              <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-neon-cyan shrink-0 transition-colors" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-300 truncate group-hover:text-white transition-colors">
                                  {res.title}
                                </p>
                                {res.platform && (
                                  <p className="text-[10px] text-slate-600">{res.platform}</p>
                                )}
                              </div>
                              {res.duration && (
                                <span className="text-[10px] text-slate-600 shrink-0">{res.duration}</span>
                              )}
                              <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-neon-cyan shrink-0 transition-colors" />
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
