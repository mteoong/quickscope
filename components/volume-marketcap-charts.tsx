"use client"

import { useState, useEffect, useRef, memo } from "react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { VolumeMarketCapService, VolumeMarketCapDataPoint } from "@/lib/services/volume-marketcap-service"

interface VolumeMarketCapChartsProps {
  tokenAddress: string
  className?: string
  layout?: 'stack' | 'split'
}

type Timeframe = '1W' | '2W' | '1M'

interface ChartDataPoint {
  date: string
  volumeUsd: number
  marketCapUsd: number
  priceUsd: number
}

function formatCompactUSD(value: number): string {
  const safeValue = Number(value ?? 0)
  if (safeValue >= 1e9) {
    return `$${(safeValue / 1e9).toFixed(1)}B`
  }
  if (safeValue >= 1e6) {
    return `$${(safeValue / 1e6).toFixed(1)}M`
  }
  if (safeValue >= 1e3) {
    return `$${(safeValue / 1e3).toFixed(1)}K`
  }
  return `$${safeValue.toFixed(0)}`
}

function formatExactUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

function VolumeMarketCapChartsComponent({ tokenAddress, className = "", layout = 'stack' }: VolumeMarketCapChartsProps) {
  console.log('VolumeMarketCapCharts: Component rendered with tokenAddress:', tokenAddress)
  
  const [timeframe, setTimeframe] = useState<Timeframe>('1W')
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMarketCapFDV, setIsMarketCapFDV] = useState(false)

  const lastFetchKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!tokenAddress) {
        console.log('VolumeMarketCapCharts: No token address provided')
        return
      }
      
      const fetchKey = `${tokenAddress}-${timeframe}`
      if (lastFetchKeyRef.current === fetchKey && data.length > 0) {
        return
      }

      console.log('VolumeMarketCapCharts: Starting fetch for', tokenAddress, 'timeframe:', timeframe)
      setIsLoading(true)
      setError(null)
      
      try {
        console.log('VolumeMarketCapCharts: Calling VolumeMarketCapService.getVolumeMarketCapData')
        const volumeMarketCapData = await VolumeMarketCapService.getVolumeMarketCapData(tokenAddress, timeframe)
        
        if (volumeMarketCapData.length === 0) {
          console.log('VolumeMarketCapCharts: No data received')
          setError('No historical data available')
          setData([])
          return
        }

        const chartData: ChartDataPoint[] = volumeMarketCapData.map((point: VolumeMarketCapDataPoint) => ({
          date: point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          volumeUsd: point.volumeUsd,
          marketCapUsd: point.marketCapUsd,
          priceUsd: point.priceUsd
        }))
        
        setData(chartData)
        lastFetchKeyRef.current = fetchKey
        console.log('VolumeMarketCapCharts: Chart data loaded:', chartData)
      } catch (err) {
        console.error('VolumeMarketCapCharts: Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tokenAddress, timeframe, data.length])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/90 border border-border/40 rounded-lg p-3 shadow-lg">
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
      <div className={`p-2 overflow-hidden ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Volume & Market Cap</h3>
          <div className="flex gap-1">
            {(['1W', '2W', '1M'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                className="px-2 py-1 text-xs bg-muted rounded cursor-not-allowed opacity-50"
                disabled
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className={`${layout === 'split' ? 'grid grid-cols-2 gap-4' : 'space-y-6'}`}>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading charts...
          </div>
          {layout === 'split' && (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Loading charts...
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-2 overflow-hidden ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Volume & Market Cap</h3>
          <div className="flex gap-1">
            {(['1W', '2W', '1M'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
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
        <div className={`${layout === 'split' ? 'grid grid-cols-2 gap-4' : 'space-y-6'}`}>
          <div className="h-64 flex items-center justify-center text-red-400">
            {error}
          </div>
          {layout === 'split' && (
            <div className="h-64 flex items-center justify-center text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`p-2 overflow-hidden ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Volume & Market Cap</h3>
          <div className="flex gap-1">
            {(['1W', '2W', '1M'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
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
        <div className={`${layout === 'split' ? 'grid grid-cols-2 gap-4' : 'space-y-6'}`}>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
          {layout === 'split' && (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`p-2 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Volume & {isMarketCapFDV ? 'FDV' : 'Market Cap'}</h3>
        <div className="flex gap-1">
          {(['1W', '2W', '1M'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
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

      <div className={`${layout === 'split' ? 'grid grid-cols-2 gap-4' : 'space-y-6'}`}>
        {/* Volume Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Daily Volume</h4>
          <div className="h-64 overflow-hidden">
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
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Cap Line Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Daily {isMarketCapFDV ? 'FDV' : 'Market Cap'}
          </h4>
          <div className="h-64 overflow-hidden">
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
                  dataKey="marketCapUsd" 
                  stroke="#10B981" 
                  name={isMarketCapFDV ? "FDV" : "Market Cap"}
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#10B981' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export const VolumeMarketCapCharts = memo(VolumeMarketCapChartsComponent)
