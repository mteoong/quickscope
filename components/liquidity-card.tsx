"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface LiquidityCardProps {
  data?: unknown[]
}

export function LiquidityCard({}: LiquidityCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Liquidity — last 15 days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-24">
          <img
            src="/liquidity-bar-chart-with-golden-bars-showing-liqui.png"
            alt="Liquidity Chart"
            className="w-full h-full object-cover rounded-sm"
          />
        </div>
      </CardContent>
    </Card>
  )
}
