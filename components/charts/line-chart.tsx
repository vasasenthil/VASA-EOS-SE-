"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
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

interface LineChartProps {
  data: Record<string, string | number>[]
  xKey: string
  series: SeriesDef[]
  height?: number
  unit?: string
  yDomain?: [number, number]
  dot?: boolean
  className?: string
}

export function LineChart({
  data,
  xKey,
  series,
  height = 300,
  unit = "%",
  yDomain,
  dot = true,
  className,
}: LineChartProps) {
  return (
    <div style={{ width: "100%", height: `${height}px` }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}${unit}`}
          />
          <Tooltip
            formatter={(value, name) => [`${value}${unit}`, `${name}`]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={dot ? { r: 4, fill: s.color, strokeWidth: 0 } : false}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
