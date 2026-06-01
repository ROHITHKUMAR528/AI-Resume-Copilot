import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Building2, Briefcase, ChevronDown, ChevronUp } from 'lucide-react'

interface JobDescriptionInputProps {
  value: string
  onChange: (value: string) => void
  jobTitle: string
  onJobTitleChange: (v: string) => void
  companyName: string
  onCompanyNameChange: (v: string) => void
}

export default function JobDescriptionInput({
  value,
  onChange,
  jobTitle,
  onJobTitleChange,
  companyName,
  onCompanyNameChange,
}: JobDescriptionInputProps) {
  const [showMeta, setShowMeta] = useState(false)
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-4">
      <div className="section-title">Job Description</div>

      {/* Optional meta fields */}
      <button
        onClick={() => setShowMeta(!showMeta)}
        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <Briefcase className="w-3.5 h-3.5" />
        Optional job details
        {showMeta ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showMeta && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">
              <Briefcase className="w-3 h-3 inline mr-1" />Job Title
            </label>
            <input
              className="input-field"
              placeholder="e.g. Senior Software Engineer"
              value={jobTitle}
              onChange={(e) => onJobTitleChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">
              <Building2 className="w-3 h-3 inline mr-1" />Company
            </label>
            <input
              className="input-field"
              placeholder="e.g. Google"
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
            />
          </div>
        </motion.div>
      )}

      {/* Text area */}
      <div className="relative">
        <div className="absolute top-3 left-3 pointer-events-none">
          <FileText className="w-4 h-4 text-slate-600" />
        </div>
        <textarea
          className="input-field pl-10 min-h-[220px] resize-y font-mono text-xs leading-relaxed"
          placeholder="Paste the full job description here...

We are looking for a Senior Software Engineer with 5+ years of experience in:
• React / TypeScript for frontend development
• Python / FastAPI for backend services
• AWS / Docker for cloud infrastructure..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
        {/* Word count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {value.length > 0 && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              wordCount < 50
                ? 'text-amber border-amber/20 bg-amber/5'
                : wordCount >= 100
                  ? 'text-emerald border-emerald/20 bg-emerald/5'
                  : 'text-slate-500 border-bg-border'
            }`}>
              {wordCount} words
            </span>
          )}
        </div>
      </div>

      {/* Hint */}
      {wordCount > 0 && wordCount < 50 && (
        <p className="text-xs text-amber flex items-center gap-1.5">
          <span>⚠</span> Add more detail for better analysis accuracy (aim for 100+ words)
        </p>
      )}
    </div>
  )
}
