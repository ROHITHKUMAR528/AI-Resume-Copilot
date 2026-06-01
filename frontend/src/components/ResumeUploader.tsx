import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { resumeAPI } from '@/services/api'
import toast from 'react-hot-toast'

interface ResumeUploaderProps {
  onUploaded: (resumeId: string, filename: string) => void
}

export default function ResumeUploader({ onUploaded }: ResumeUploaderProps) {
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null)
  const [parseData, setParseData] = useState<Record<string, unknown> | null>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumeAPI.upload(file),
    onSuccess: (response) => {
      const data = response.data
      setParseData(data.parsed_data)
      onUploaded(data.id, data.original_filename)
      toast.success('Resume parsed successfully!')
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail || 'Upload failed. Please try again.')
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploadedFile({ name: file.name, size: file.size })
    uploadMutation.mutate(file)
  }, [uploadMutation])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const clear = () => {
    setUploadedFile(null)
    setParseData(null)
  }

  return (
    <div className="space-y-4">
      <div className="section-title">Resume Upload</div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden
          ${isDragActive
            ? 'border-neon-cyan bg-neon-cyan/5 scale-[1.01]'
            : uploadMutation.isSuccess
              ? 'border-emerald/40 bg-emerald/5'
              : 'border-bg-border bg-bg-surface hover:border-neon-cyan/40 hover:bg-neon-cyan/[0.02]'
          }`}
      >
        <input {...getInputProps()} />

        {/* Scan line animation */}
        {isDragActive && (
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent animate-scan pointer-events-none" />
        )}

        <div className="px-6 py-8 flex flex-col items-center gap-3 text-center">
          <AnimatePresence mode="wait">
            {uploadMutation.isPending ? (
              <motion.div
                key="loading"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-12 h-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center"
              >
                <Loader2 className="w-6 h-6 text-neon-cyan animate-spin" />
              </motion.div>
            ) : uploadMutation.isSuccess ? (
              <motion.div
                key="success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-12 h-12 rounded-xl bg-emerald/10 border border-emerald/20 flex items-center justify-center"
              >
                <CheckCircle className="w-6 h-6 text-emerald" />
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                  ${isDragActive ? 'bg-neon-cyan/20 border-neon-cyan/40' : 'bg-bg-card border border-bg-border'}
                  border`}
              >
                <Upload className={`w-6 h-6 ${isDragActive ? 'text-neon-cyan' : 'text-slate-500'}`} />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            {uploadMutation.isPending ? (
              <>
                <p className="text-sm font-semibold text-neon-cyan">Parsing resume...</p>
                <p className="text-xs text-slate-500 mt-1">Extracting skills, experience, education</p>
              </>
            ) : uploadMutation.isSuccess ? (
              <>
                <p className="text-sm font-semibold text-emerald">Resume uploaded!</p>
                <p className="text-xs text-slate-500 mt-1">{uploadedFile?.name}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-300">
                  {isDragActive ? 'Drop your resume here' : 'Drop resume or click to browse'}
                </p>
                <p className="text-xs text-slate-500 mt-1">PDF, DOCX · Max 10MB</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* File rejection errors */}
      {fileRejections.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/5 border border-danger/20 text-xs text-danger">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {fileRejections[0].errors[0].message}
        </div>
      )}

      {/* Parsed data preview */}
      <AnimatePresence>
        {parseData && uploadMutation.isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-neon-cyan" />
                <span className="text-sm font-semibold text-white">Parsed Data</span>
              </div>
              <button onClick={clear} className="p-1 rounded hover:bg-bg-hover text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="cyber-divider" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              {(parseData as { name?: string }).name && (
                <InfoRow label="Name" value={(parseData as { name?: string }).name!} />
              )}
              {(parseData as { email?: string }).email && (
                <InfoRow label="Email" value={(parseData as { email?: string }).email!} />
              )}
              {(parseData as { phone?: string }).phone && (
                <InfoRow label="Phone" value={(parseData as { phone?: string }).phone!} />
              )}
              <InfoRow
                label="Skills"
                value={`${((parseData as { skills?: string[] }).skills || []).length} detected`}
              />
            </div>

            {((parseData as { skills?: string[] }).skills || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {((parseData as { skills?: string[] }).skills || []).slice(0, 8).map((s, i) => (
                  <span key={i} className="badge-cyan text-[10px]">{s}</span>
                ))}
                {((parseData as { skills?: string[] }).skills || []).length > 8 && (
                  <span className="badge text-[10px] bg-bg-hover text-slate-400">
                    +{((parseData as { skills?: string[] }).skills || []).length - 8} more
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-slate-300 font-medium truncate">{value}</p>
    </div>
  )
}
