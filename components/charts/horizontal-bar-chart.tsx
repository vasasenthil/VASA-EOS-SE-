"use client"

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { CHART_COLORS } from "./chart-colors"

interface HBarItem {
  label: string
  value: number
  color?: string
}

interface HorizontalBarChartProps {
  data: HBarItem[]
  height?: number
  unit?: string
  yAxisWidth?: number
  barColor?: string
  className?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  unit: string
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white px-3 py-2 shadow-md text-sm">
        <p className="font-medium text-gray-700 mb-1">{label}</p>
        <p className="text-blue-600 font-bold">
          {payload[0].value}
          {unit}
        </p>
      </div>
    )
  }
  return null
}

export function HorizontalBarChart({
  data,
  height = 300,
  unit = "%",
  yAxisWidth = 210,
  barColor = CHART_COLORS.blue,
  className,
}: HorizontalBarChartProps) {
  return (
    <div style={{ width: "100%", height: `${height}px` }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickFormatter={(v) => `${v}${unit}`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={yAxisWidth}
            tick={{ fontSize: 11, fill: "#374151" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip unit={unit} />}
            cursor={{ fill: "#F3F4F6" }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color ?? barColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
