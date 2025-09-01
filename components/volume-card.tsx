"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface VolumeCardProps {
  data?: unknown[]
}

export function VolumeCard({}: VolumeCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-2 px-3">
        <CardTitle className="text-xs font-medium">Volume — last 15 days</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        <div className="h-24">
          <img src="/volume-bar-chart-with-golden-bars-showing-trading-.png" alt="Volume Chart" className="w-full h-full object-cover rounded-sm" />
        </div>
      </CardContent>
    </Card>
  )
}
