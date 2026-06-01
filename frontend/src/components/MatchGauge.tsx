import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface ScoreGaugeProps {
  label: string
  value: number
  color: 'cyan' | 'emerald' | 'amber' | 'danger' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  subtitle?: string
}

const colorMap = {
  cyan: { stroke: '#06B6D4', text: 'text-neon-cyan', glow: 'rgba(6,182,212,0.4)', bg: 'bg-neon-cyan/10' },
  emerald: { stroke: '#10B981', text: 'text-emerald', glow: 'rgba(16,185,129,0.4)', bg: 'bg-emerald/10' },
  amber: { stroke: '#F59E0B', text: 'text-amber', glow: 'rgba(245,158,11,0.4)', bg: 'bg-amber/10' },
  danger: { stroke: '#EF4444', text: 'text-danger', glow: 'rgba(239,68,68,0.4)', bg: 'bg-danger/10' },
  purple: { stroke: '#8B5CF6', text: 'text-purple', glow: 'rgba(139,92,246,0.4)', bg: 'bg-purple/10' },
}

const sizeMap = {
  sm: { r: 36, cx: 48, viewBox: '0 0 96 96', size: 96, strokeWidth: 6, fontSize: 'text-xl' },
  md: { r: 52, cx: 64, viewBox: '0 0 128 128', size: 128, strokeWidth: 8, fontSize: 'text-3xl' },
  lg: { r: 64, cx: 80, viewBox: '0 0 160 160', size: 160, strokeWidth: 10, fontSize: 'text-4xl' },
}

export default function MatchGauge({ label, value, color, size = 'md', subtitle }: ScoreGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const { stroke, text, glow } = colorMap[color]
  const { r, cx, viewBox, size: svgSize, strokeWidth, fontSize } = sizeMap[size]

  const circumference = 2 * Math.PI * r
  const dash = (animatedValue / 100) * circumference
  const gap = circumference - dash

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  const getLabel = (v: number) => {
    if (v >= 85) return 'Excellent'
    if (v >= 70) return 'Good'
    if (v >= 50) return 'Fair'
    return 'Poor'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={viewBox}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background ring */}
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke="rgba(30, 45, 69, 0.8)"
            strokeWidth={strokeWidth}
          />
          {/* Glow filter */}
          <defs>
            <filter id={`glow-${color}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Score ring */}
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{
              transition: 'stroke-dasharray 1.5s cubic-bezier(0.25, 1, 0.5, 1)',
              filter: `drop-shadow(0 0 6px ${glow})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-black ${text} leading-none`} style={{
            textShadow: `0 0 20px ${glow}`,
          }}>
            {Math.round(animatedValue)}
          </span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5">/ 100</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-slate-200">{label}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        <span className={`text-[10px] font-semibold ${text} mt-1 block`}>
          {getLabel(value)}
        </span>
      </div>
    </motion.div>
  )
}
