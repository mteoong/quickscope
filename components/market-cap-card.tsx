"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { formatNumber } from "@/lib/utils"
import type { VolumeData } from "@/lib/types"

interface MarketCapCardProps {
  data: VolumeData[]
}

export function MarketCapCard({ data }: MarketCapCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Market Cap — last 15 days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => new Date(value).getDate().toString()}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`$${formatNumber(value)}`, "Market Cap"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Area dataKey="value" fill="#FFD700" fillOpacity={0.3} stroke="#FFD700" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
