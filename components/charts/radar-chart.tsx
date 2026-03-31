"use client"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart: RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} = require("recharts")
import { CHART_COLORS } from "./chart-colors"

interface RadarDataPoint {
  subject: string
  value: number
  fullMark?: number
}

interface RadarChartProps {
  data: RadarDataPoint[]
  height?: number
  color?: string
  fillOpacity?: number
  className?: string
}

export function RadarChart({
  data,
  height = 320,
  color = CHART_COLORS.blue,
  fillOpacity = 0.25,
  className,
}: RadarChartProps) {
  // Truncate long axis labels to prevent overflow
  const safeData = data.map((d) => ({
    ...d,
    subject: d.subject.length > 20 ? d.subject.slice(0, 18) + "…" : d.subject,
  }))

  return (
    <div style={{ width: "100%", height: `${height}px` }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={safeData} margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: "#374151" }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            tickLine={false}
          />
          <Radar
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={fillOpacity}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, "Score"]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}
