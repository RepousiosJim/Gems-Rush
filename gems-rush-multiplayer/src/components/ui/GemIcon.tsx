'use client'

import { useId } from 'react'
import { GemType } from '@/types/game'

const SHAPES: Record<GemType, { d: string; spec: [number, number] }> = {
  fire: { d: 'M50 4 L80 42 L50 96 L20 42 Z', spec: [40, 28] },
  water: { d: 'M6 50 A44 44 0 1 0 94 50 A44 44 0 1 0 6 50 Z', spec: [34, 32] },
  earth: { d: 'M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z', spec: [34, 30] },
  nature: {
    d: 'M50 4 L62.9 32.2 L93.8 35.8 L70.9 56.8 L77 87.2 L50 72 L23 87.2 L29.1 56.8 L6.3 35.8 L37.1 32.2 Z',
    spec: [41, 42]
  },
  lightning: { d: 'M50 8 L94 88 L6 88 Z', spec: [40, 52] }
}

interface GemIconProps {
  type: GemType
  size?: number
  className?: string
}

export default function GemIcon({ type, size = 32, className }: GemIconProps) {
  const clipId = useId()
  const { d, spec } = SHAPES[type]

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={`var(--gem-${type})`} />
      <g clipPath={`url(#${clipId})`}>
        <path d="M0 0 H100 L0 100 Z" fill="#fff" opacity="0.28" />
        <path d="M100 0 V100 H0 Z" fill="#000" opacity="0.22" />
        {/* strokeWidth 6 clipped to the silhouette leaves a 3-unit rim inside the edge */}
        <path d={d} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="6" />
        <ellipse
          cx={spec[0]}
          cy={spec[1]}
          rx="8"
          ry="4.5"
          fill="#fff"
          opacity="0.7"
          transform={`rotate(-35 ${spec[0]} ${spec[1]})`}
        />
      </g>
    </svg>
  )
}
