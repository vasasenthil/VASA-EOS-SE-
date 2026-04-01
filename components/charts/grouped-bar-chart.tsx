"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface SeriesDef {
  key: string
  name: string
  color: string
}

interface GroupedBarChartProps {
  data: Record<string, string | number>[]
  xKey: string
  series: SeriesDef[]
  height?: number
  unit?: string
  xAxisAngle?: number
  className?: string
}

export function GroupedBarChart({
  data,
  xKey,
  series,
  height = 320,
  unit = "",
  xAxisAngle = -30,
  className,
}: GroupedBarChartProps) {
  return (
    <div style={{ width: "100%", height: `${height}px` }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey={xKey}
            angle={xAxisAngle}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}${unit}`}
          />
          <Tooltip
            formatter={(value, name) => [`${value}${unit}`, `${name}`]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={28} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
