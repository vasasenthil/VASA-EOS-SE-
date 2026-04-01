"use client"

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

interface DonutItem {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutItem[]
  height?: number
  innerRadius?: number
  outerRadius?: number
  showLegend?: boolean
  centerLabel?: string
  centerValue?: string
  className?: string
}

export function DonutChart({
  data,
  height = 280,
  innerRadius = 55,
  outerRadius = 90,
  showLegend = true,
  centerLabel,
  centerValue,
  className,
}: DonutChartProps) {
  return (
    <div
      style={{ width: "100%", height: `${height}px`, position: "relative" }}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy={showLegend ? "45%" : "50%"}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value}`, `${name}`]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => <span style={{ color: "#374151" }}>{value}</span>}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div
          style={{
            position: "absolute",
            top: showLegend ? "45%" : "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {centerValue && (
            <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>
              {centerValue}
            </p>
          )}
          {centerLabel && (
            <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{centerLabel}</p>
          )}
        </div>
      )}
    </div>
  )
}
