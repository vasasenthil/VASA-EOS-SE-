"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { NepThrustAreaProgress } from "../actions"

interface NepThrustChartProps {
  data: NepThrustAreaProgress[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Thrust Area</span>
            <span className="font-bold text-muted-foreground">{label}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">Avg. Progress</span>
            <span className="font-bold">{`${payload[0].value}%`}</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export function NepThrustChart({ data }: NepThrustChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{
          top: 5,
          right: 10,
          left: 10,
          bottom: 5,
        }}
      >
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          width={150}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          interval={0}
        />
        <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  )
}
