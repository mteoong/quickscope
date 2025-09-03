"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { BirdeyeAPI, HistoricalDataPoint } from "@/lib/apis/birdeye"

interface VolumeLiquidityChartsProps {
  tokenAddress: string
  className?: string
}

type Timeframe = '1W' | '2W' | '1M'

interface ChartDataPoint {
  date: string
  volumeUsd: number
  liquidityUsd: number
  priceUsd: number
}

function formatCompactUSD(value: number): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`
  }
  return `$${value.toFixed(0)}`
}

function formatExactUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export function VolumeLiquidityCharts({ tokenAddress, className = "" }: VolumeLiquidityChartsProps) {
  console.log('VolumeLiquidityCharts: Component rendered with tokenAddress:', tokenAddress)
  
  const [timeframe, setTimeframe] = useState<Timeframe>('1W')
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!tokenAddress) {
        console.log('VolumeLiquidityCharts: No token address provided')
        return
      }
      
      console.log('VolumeLiquidityCharts: Starting fetch for', tokenAddress, 'timeframe:', timeframe)
      setIsLoading(true)
      setError(null)
      
      try {
        console.log('VolumeLiquidityCharts: Calling BirdeyeAPI.getHistoricalData')
        const historicalData = await BirdeyeAPI.getHistoricalData(tokenAddress, timeframe)
        
        const chartData: ChartDataPoint[] = historicalData.map((point: HistoricalDataPoint) => ({
          date: point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          volumeUsd: point.volumeUsd,
          liquidityUsd: point.liquidityUsd,
          priceUsd: point.priceUsd
        }))
        
        setData(chartData)
        console.log('Historical data loaded:', chartData)
      } catch (err) {
        console.error('Error fetching historical data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tokenAddress, timeframe])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatExactUSD(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Volume & Liquidity</h3>
          <div className="flex gap-1">
            {(['1W', '2W', '1M'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                className="px-3 py-1 text-sm bg-muted rounded"
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          Loading charts...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Volume & Liquidity</h3>
          <div className="flex gap-1">
            {(['1W', '2W', '1M'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  timeframe === tf 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80 flex items-center justify-center text-red-400">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      {/* Header with timeframe toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Volume & Liquidity</h3>
        <div className="flex gap-1">
          {(['1W', '2W', '1M'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                timeframe === tf 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Volume Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Daily Volume</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                  tickFormatter={formatCompactUSD}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="volumeUsd" 
                  fill="#3B82F6"
                  name="Volume"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Liquidity Line Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Daily Liquidity</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                  tickFormatter={formatCompactUSD}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="liquidityUsd" 
                  stroke="#10B981" 
                  name="Liquidity"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}