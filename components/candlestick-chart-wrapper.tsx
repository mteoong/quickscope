"use client"

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface CandlestickChartProps {
  data: CandleData[]
  height?: number
  onCrosshairMove?: (price: number | null) => void
  tokenAddress?: string
  timeframe?: string
}

// Dynamically import the candlestick chart with no SSR
const DynamicCandlestickChart = dynamic(
  () => import('./candlestick-chart-client').then(mod => ({ default: mod.CandlestickChartClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full flex items-center justify-center" style={{ height: '320px' }}>
        <div className="flex items-center space-x-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading candlestick chart...</span>
        </div>
      </div>
    )
  }
)

export function CandlestickChart(props: CandlestickChartProps) {
  return <DynamicCandlestickChart {...props} />
}