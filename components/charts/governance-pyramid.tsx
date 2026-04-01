"use client"

interface PyramidTier {
  tier: number
  label: string
  description: string
  users: string
  institutions: string
}

interface GovernancePyramidProps {
  tiers: PyramidTier[]
  className?: string
}

const TIER_COLORS = [
  "#8B5CF6", // National — purple
  "#3B82F6", // State/UT — blue
  "#6366F1", // District — indigo
  "#14B8A6", // Block — teal
  "#06B6D4", // Cluster — cyan
  "#22C55E", // School — green
  "#F97316", // Learner — orange
]

export function GovernancePyramid({ tiers, className }: GovernancePyramidProps) {
  const cx = 300
  const tierHeight = 52
  const topY = 10

  return (
    <div className={className}>
      <svg
        viewBox="0 0 600 420"
        width="100%"
        style={{ maxHeight: 420 }}
        aria-label="VASA-EOS 7-Tier Governance Hierarchy Pyramid"
      >
        {tiers.map((tier, i) => {
          const topW = 110 + i * 75
          const botW = 110 + (i + 1) * 75
          const yTop = topY + i * (tierHeight + 2)
          const yBot = yTop + tierHeight

          const tl = { x: cx - topW / 2, y: yTop }
          const tr = { x: cx + topW / 2, y: yTop }
          const br = { x: cx + botW / 2, y: yBot }
          const bl = { x: cx - botW / 2, y: yBot }

          const points = `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`
          const color = TIER_COLORS[i] ?? "#6B7280"
          const midY = yTop + tierHeight / 2

          return (
            <g key={tier.tier}>
              <title>
                Tier {tier.tier}: {tier.label} — {tier.institutions} institutions, {tier.users} users
              </title>
              <polygon
                points={points}
                fill={color}
                stroke="white"
                strokeWidth={1.5}
                opacity={0.92}
              />
              {/* Tier label */}
              <text
                x={cx}
                y={midY - 7}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill="white"
              >
                T{tier.tier}: {tier.label}
              </text>
              {/* Users / institutions */}
              <text
                x={cx}
                y={midY + 10}
                textAnchor="middle"
                fontSize={10}
                fill="rgba(255,255,255,0.85)"
              >
                {tier.institutions !== "0" && tier.institutions !== ""
                  ? `${tier.institutions} inst · `
                  : ""}
                {tier.users} users
              </text>
            </g>
          )
        })}

        {/* Legend label bottom */}
        <text
          x={cx}
          y={400}
          textAnchor="middle"
          fontSize={11}
          fill="#6B7280"
        >
          VASA-EOS 7-Tier Governance Hierarchy (NEP 2020 / Samagra Shiksha)
        </text>
      </svg>
    </div>
  )
}
