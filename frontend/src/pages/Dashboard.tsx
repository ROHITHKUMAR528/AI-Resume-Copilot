import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { analysisAPI, roadmapAPI, interviewAPI } from '@/services/api'
import ResumeUploader from '@/components/ResumeUploader'
import JobDescriptionInput from '@/components/JobDescriptionInput'
import MatchGauge from '@/components/MatchGauge'
import SkillGapPanel from '@/components/SkillGapPanel'
import RoadmapTimeline from '@/components/RoadmapTimeline'
import InterviewPanel from '@/components/InterviewPanel'
import ResumeMorphPanel from '@/components/ResumeMorphPanel'
import toast from 'react-hot-toast'
import {
  Zap, BarChart3, Target, BookOpen, MessageSquare,
  Wand2, AlertCircle,
  TrendingUp, DollarSign, Brain, Loader2
} from 'lucide-react'

interface Analysis {
  id: string
  match_percentage: number
  ats_score: number
  semantic_score: number
  matched_skills: string[]
  missing_skills: Array<{ skill_name: string; importance: string; category?: string }>
  skill_coverage: number
  ats_issues: Array<{ category: string; severity: string; message: string; suggestion: string }>
  resume_morphing: Array<{ original: string; suggested_revision: string; reason: string }>
  career_intelligence: {
    salary_range?: { min: number; max: number; currency: string; period: string }
    career_paths?: string[]
    recommended_skills?: string[]
    role_readiness_score?: number
    role_readiness_label?: string
  } | null
}

interface Roadmap {
  id: string
  skill_name: string
  importance: string
  steps: Array<{ step: number; title: string; description: string; resources: Array<{ type: string; title: string; url: string; platform?: string }> }>
  estimated_time?: string
}

interface Interview {
  technical: string[]
  behavioral: string[]
  gap_based: string[]
}

type ActiveSection = 'overview' | 'skills' | 'morph' | 'roadmap' | 'interview' | 'ats'

export default function Dashboard() {
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [interview, setInterview] = useState<Interview | null>(null)
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview')

  // ─── Analyze mutation ────────────────────────────────────────────────────
  const analyzeMutation = useMutation({
    mutationFn: () => analysisAPI.analyze({
      resume_id: resumeId!,
      job_description: jobDescription,
      job_title: jobTitle || undefined,
      company_name: companyName || undefined,
    }),
    onSuccess: (res) => {
      setAnalysis(res.data)
      setRoadmaps([])
      setInterview(null)
      toast.success('Analysis complete!')
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail || 'Analysis failed')
    },
  })

  // ─── Roadmap mutation ────────────────────────────────────────────────────
  const roadmapMutation = useMutation({
    mutationFn: () => roadmapAPI.generate(analysis!.id),
    onSuccess: (res) => {
      setRoadmaps(res.data)
      setActiveSection('roadmap')
      toast.success('Learning roadmap generated!')
    },
    onError: () => toast.error('Failed to generate roadmap'),
  })

  // ─── Interview mutation ──────────────────────────────────────────────────
  const interviewMutation = useMutation({
    mutationFn: () => interviewAPI.generate(analysis!.id),
    onSuccess: (res) => {
      setInterview(res.data)
      setActiveSection('interview')
      toast.success('Interview questions ready!')
    },
    onError: () => toast.error('Failed to generate questions'),
  })

  const canAnalyze = resumeId && jobDescription.trim().length >= 50
  const isAnalyzing = analyzeMutation.isPending

  const sections = [
    { id: 'overview' as ActiveSection, label: 'Overview', icon: BarChart3 },
    { id: 'skills' as ActiveSection, label: 'Skills', icon: Target },
    { id: 'morph' as ActiveSection, label: 'Improvements', icon: Wand2 },
    { id: 'roadmap' as ActiveSection, label: 'Roadmap', icon: BookOpen },
    { id: 'interview' as ActiveSection, label: 'Interview', icon: MessageSquare },
    { id: 'ats' as ActiveSection, label: 'ATS Audit', icon: AlertCircle },
  ]

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">
          Resume <span className="gradient-text-cyan">Intelligence</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload your resume and paste a job description to get AI-powered insights
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        {/* ─── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Resume Upload */}
          <div className="glass-card p-5">
            <ResumeUploader
              onUploaded={(id, _name) => { setResumeId(id) }}
            />
          </div>

          {/* Job Description */}
          <div className="glass-card p-5">
            <JobDescriptionInput
              value={jobDescription}
              onChange={setJobDescription}
              jobTitle={jobTitle}
              onJobTitleChange={setJobTitle}
              companyName={companyName}
              onCompanyNameChange={setCompanyName}
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={!canAnalyze || isAnalyzing}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-sm transition-all duration-300
              ${canAnalyze && !isAnalyzing
                ? 'bg-neon-cyan text-bg-primary shadow-neon-cyan hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] active:scale-[0.98]'
                : 'bg-bg-surface text-slate-600 cursor-not-allowed border border-bg-border'
              }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analyze Resume
                {canAnalyze && <span className="text-bg-primary/70 text-xs font-normal">GPT-4o</span>}
              </>
            )}
          </button>

          {/* Validation hints */}
          {!resumeId && (
            <p className="text-xs text-slate-600 text-center">← Upload resume to continue</p>
          )}
          {resumeId && jobDescription.trim().length < 50 && (
            <p className="text-xs text-slate-600 text-center">← Paste job description (50+ words)</p>
          )}
        </div>

        {/* ─── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!analysis && !isAnalyzing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-12 flex flex-col items-center justify-center text-center min-h-[400px]"
              >
                <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-6 animate-pulse-slow">
                  <Brain className="w-8 h-8 text-neon-cyan" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">AI Analysis Ready</h2>
                <p className="text-sm text-slate-500 max-w-sm">
                  Upload your resume and paste a job description, then click{' '}
                  <span className="text-neon-cyan font-semibold">Analyze Resume</span> to get
                  your personalized AI report.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-8 text-xs text-slate-600">
                  {['Match Score', 'ATS Audit', 'Skill Gaps', 'AI Rewrites', 'Roadmap', 'Interview Prep'].map(f => (
                    <div key={f} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan/40" />
                      {f}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-12 flex flex-col items-center justify-center text-center min-h-[400px]"
              >
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/20" />
                  <div className="absolute inset-0 rounded-full border-t-2 border-neon-cyan animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-neon-cyan/10" />
                  <div className="absolute inset-2 rounded-full border-b-2 border-purple animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  <Brain className="absolute inset-0 m-auto w-8 h-8 text-neon-cyan" />
                </div>
                <p className="text-lg font-bold text-white">Analyzing with GPT-4o...</p>
                <div className="space-y-2 mt-4 text-sm text-slate-500">
                  {['Extracting job requirements', 'Semantic skill matching', 'ATS compatibility check', 'Generating improvements'].map((step, i) => (
                    <motion.p
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.5 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="w-3 h-3 animate-spin text-neon-cyan" />
                      {step}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            )}

            {analysis && !isAnalyzing && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Score Cards */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-bold text-white">Analysis Results</h2>
                    {(jobTitle || companyName) && (
                      <div className="text-right">
                        {jobTitle && <p className="text-xs font-semibold text-slate-300">{jobTitle}</p>}
                        {companyName && <p className="text-[10px] text-slate-500">{companyName}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-around">
                    <MatchGauge
                      label="Match Score"
                      value={analysis.match_percentage}
                      color={analysis.match_percentage >= 75 ? 'emerald' : analysis.match_percentage >= 50 ? 'amber' : 'danger'}
                      size="lg"
                      subtitle="Resume vs JD"
                    />
                    <div className="h-24 w-px bg-bg-border" />
                    <MatchGauge
                      label="ATS Score"
                      value={analysis.ats_score}
                      color={analysis.ats_score >= 75 ? 'cyan' : analysis.ats_score >= 50 ? 'amber' : 'danger'}
                      size="md"
                      subtitle="ATS Compatibility"
                    />
                    <div className="h-24 w-px bg-bg-border" />
                    <MatchGauge
                      label="Semantic"
                      value={analysis.semantic_score}
                      color="purple"
                      size="md"
                      subtitle="Skill Graph"
                    />
                  </div>
                </div>

                {/* Career Intelligence */}
                {analysis.career_intelligence && (
                  <div className="glass-card p-5">
                    <div className="section-title">Career Intelligence</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {analysis.career_intelligence.salary_range && (
                        <div className="text-center">
                          <DollarSign className="w-4 h-4 text-emerald mx-auto mb-1" />
                          <p className="text-xs text-slate-500">Salary Range</p>
                          <p className="text-sm font-bold text-white">
                            ${(analysis.career_intelligence.salary_range.min / 1000).toFixed(0)}K–${(analysis.career_intelligence.salary_range.max / 1000).toFixed(0)}K
                          </p>
                        </div>
                      )}
                      {analysis.career_intelligence.role_readiness_score !== undefined && (
                        <div className="text-center">
                          <TrendingUp className="w-4 h-4 text-neon-cyan mx-auto mb-1" />
                          <p className="text-xs text-slate-500">Readiness</p>
                          <p className="text-sm font-bold text-neon-cyan">
                            {analysis.career_intelligence.role_readiness_label || `${analysis.career_intelligence.role_readiness_score}%`}
                          </p>
                        </div>
                      )}
                      {analysis.career_intelligence.career_paths?.slice(0, 2).map((path) => (
                        <div key={path} className="text-center">
                          <Brain className="w-4 h-4 text-purple mx-auto mb-1" />
                          <p className="text-xs text-slate-500">Path</p>
                          <p className="text-xs font-semibold text-white truncate">{path}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Navigation */}
                <div className="flex gap-2 flex-wrap">
                  {sections.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveSection(id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                        ${activeSection === id
                          ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                          : 'text-slate-500 hover:text-slate-300 border border-bg-border hover:border-slate-600'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Section Content */}
                <div className="glass-card p-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeSection === 'overview' && (
                        <div className="space-y-4">
                          <div className="section-title">Score Breakdown</div>
                          {[
                            { label: 'Skill Coverage', value: analysis.skill_coverage, color: 'bg-neon-cyan' },
                            { label: 'ATS Score', value: analysis.ats_score, color: 'bg-emerald' },
                            { label: 'Semantic Match', value: analysis.semantic_score, color: 'bg-purple' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400">{label}</span>
                                <span className="font-semibold text-white">{value?.toFixed(0) || 0}%</span>
                              </div>
                              <div className="progress-bar">
                                <motion.div
                                  className={`progress-fill ${color}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${value || 0}%` }}
                                  transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeSection === 'skills' && (
                        <SkillGapPanel
                          matchedSkills={analysis.matched_skills}
                          missingSkills={analysis.missing_skills as Array<{ skill_name: string; importance: 'Critical' | 'High' | 'Medium' | 'Low'; category?: string }>}
                          skillCoverage={analysis.skill_coverage}
                        />
                      )}

                      {activeSection === 'morph' && (
                        <ResumeMorphPanel revisions={analysis.resume_morphing} />
                      )}

                      {activeSection === 'roadmap' && (
                        <div className="space-y-4">
                          {!roadmaps.length ? (
                            <div className="text-center py-6 space-y-3">
                              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                              <p className="text-sm text-slate-500">Generate a personalized learning roadmap for your skill gaps</p>
                              <button
                                onClick={() => roadmapMutation.mutate()}
                                disabled={roadmapMutation.isPending}
                                className="btn-primary"
                              >
                                {roadmapMutation.isPending ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                                ) : (
                                  <><BookOpen className="w-4 h-4" /> Generate Roadmap</>
                                )}
                              </button>
                            </div>
                          ) : (
                            <RoadmapTimeline roadmaps={roadmaps} />
                          )}
                        </div>
                      )}

                      {activeSection === 'interview' && (
                        <div className="space-y-4">
                          {!interview ? (
                            <div className="text-center py-6 space-y-3">
                              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                              <p className="text-sm text-slate-500">Get AI-generated interview questions tailored to this role</p>
                              <button
                                onClick={() => interviewMutation.mutate()}
                                disabled={interviewMutation.isPending}
                                className="btn-primary"
                              >
                                {interviewMutation.isPending ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                                ) : (
                                  <><MessageSquare className="w-4 h-4" /> Generate Questions</>
                                )}
                              </button>
                            </div>
                          ) : (
                            <InterviewPanel
                              technical={interview.technical}
                              behavioral={interview.behavioral}
                              gapBased={interview.gap_based}
                            />
                          )}
                        </div>
                      )}

                      {activeSection === 'ats' && (
                        <div className="space-y-4">
                          <div className="section-title">ATS Issues ({analysis.ats_issues.length})</div>
                          {analysis.ats_issues.length === 0 ? (
                            <p className="text-sm text-emerald text-center py-4">✓ No major ATS issues found!</p>
                          ) : (
                            analysis.ats_issues.map((issue, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className={`p-4 rounded-lg border space-y-2 ${
                                  issue.severity === 'High' ? 'bg-danger/5 border-danger/20'
                                  : issue.severity === 'Medium' ? 'bg-amber/5 border-amber/20'
                                  : 'bg-bg-surface border-bg-border'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    issue.severity === 'High' ? 'bg-danger/20 text-danger'
                                    : issue.severity === 'Medium' ? 'bg-amber/20 text-amber'
                                    : 'bg-slate-700 text-slate-400'
                                  }`}>
                                    {issue.severity}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-300">{issue.category}</span>
                                </div>
                                <p className="text-xs text-slate-400">{issue.message}</p>
                                <p className="text-xs text-slate-500">
                                  <span className="text-neon-cyan font-medium">Fix: </span>{issue.suggestion}
                                </p>
                              </motion.div>
                            ))
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
