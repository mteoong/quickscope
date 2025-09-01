"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crosshair, TrendingUp, Square, Waves, Settings } from "lucide-react"
import { PriceChart } from "@/components/price-chart"
import type { CandleData } from "@/lib/types"

interface CandleChartProps {
  data?: CandleData[]
  timeframe?: string
  tokenAddress?: string
  tokenSymbol?: string
  addressType?: 'token' | 'pool'
}

export function CandleChart({ timeframe = "1d", tokenAddress = "ethereum", tokenSymbol = "ETH", addressType }: CandleChartProps) {
  return (
    <Card className="p-1 h-full flex flex-col">
      <PriceChart 
        tokenAddress={tokenAddress}
        addressType={addressType}
        initialTimeframe={timeframe}
        autoRefresh={true}
        refreshInterval={30000}
        className="border-none p-0 bg-transparent h-full"
      />
    </Card>
  )
}
