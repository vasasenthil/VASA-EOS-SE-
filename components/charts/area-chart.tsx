"use client"

import {
  Area,
  AreaChart as RechartsAreaChart,
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

interface AreaChartProps {
  data: Record<string, string | number>[]
  xKey: string
  series: SeriesDef[]
  height?: number
  unit?: string
  yDomain?: [number, number]
  fillOpacity?: number
  className?: string
}

export function AreaChart({
  data,
  xKey,
  series,
  height = 260,
  unit = "%",
  yDomain,
  fillOpacity = 0.2,
  className,
}: AreaChartProps) {
  return (
    <div style={{ width: "100%", height: `${height}px` }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
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
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
