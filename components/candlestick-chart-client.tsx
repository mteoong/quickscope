"use client"

import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickSeries, HistogramSeries, Time } from 'lightweight-charts'

interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface CandlestickChartClientProps {
  data: CandleData[]
  height?: number
  onCrosshairMove?: (price: number | null) => void
  tokenAddress?: string
  timeframe?: string
}

export function CandlestickChartClient({ 
  data, 
  height = 320,
  onCrosshairMove,
  tokenAddress = 'ethereum',
  timeframe = '1h'
}: CandlestickChartClientProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [allData, setAllData] = useState<CandleData[]>([])
  const [loading, setLoading] = useState(false)
  const [earliestTime, setEarliestTime] = useState<number | null>(null)
  const [hasReachedEnd, setHasReachedEnd] = useState(false)

  // Function to load more historical data
  const loadMoreHistoricalData = async () => {
    if (loading || !earliestTime || hasReachedEnd) return
    
    setLoading(true)
    
    try {
      // Calculate how far back to go (50 more periods)
      const timeframMs = getTimeframeMs(timeframe)
      const endTime = earliestTime - timeframMs // Start just before earliest data
      const startTime = endTime - (50 * timeframMs) // Load 50 more periods
      
      const beforeTimestamp = Math.floor(endTime / 1000)
      console.log('Loading more data before:', new Date(endTime))
      
      const response = await fetch(`/api/price-data?address=${tokenAddress}&timeframe=${timeframe}&before=${beforeTimestamp}&limit=50`)
      const result = await response.json()
      
      console.log('Historical data response:', result.success, result.data?.length || 0, 'points')
      
      if (result.success && result.data.length > 0) {
        const newHistoricalData = result.data
        const combinedData = [...newHistoricalData, ...allData]
        setAllData(combinedData)
        setEarliestTime(newHistoricalData[0].time)
        
        // Check if we got less data than requested - indicates we've reached the end
        if (result.data.length < 50) {
          console.log('Reached end of available data - disabling infinite scroll')
          setHasReachedEnd(true)
        }
        
        // Update chart with combined data
        if (candlestickSeriesRef.current && volumeSeriesRef.current) {
          updateChartData(combinedData)
        }
      } else {
        // No data returned - we've reached the end
        console.log('No more historical data available - disabling infinite scroll')
        setHasReachedEnd(true)
      }
    } catch (error) {
      console.error('Error loading historical data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get timeframe in milliseconds
  const getTimeframeMs = (tf: string): number => {
    const timeframes: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    }
    return timeframes[tf] || 60 * 60 * 1000
  }

  // Helper function to update chart data
  const updateChartData = (chartData: CandleData[]) => {
    if (!candlestickSeriesRef.current) return

    const candlestickData = chartData.map(item => ({
      time: Math.floor(item.time / 1000) as Time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }))

    candlestickSeriesRef.current.setData(candlestickData)

    if (volumeSeriesRef.current) {
      const volumeData = chartData.map(item => ({
        time: Math.floor(item.time / 1000) as Time,
        value: item.volume,
        color: item.close >= item.open ? '#22c55e88' : '#ef444488',
      }))
      volumeSeriesRef.current.setData(volumeData)
    }
  }

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9CA3AF',
        fontSize: 12,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: '#EAB308',
          width: 1,
          style: 3, // LineStyle.Dashed
        },
        horzLine: {
          color: '#EAB308',
          width: 1,
          style: 3, // LineStyle.Dashed
        },
      },
      rightPriceScale: {
        borderColor: '#2E2F30',
        textColor: '#9CA3AF',
        scaleMargins: {
          top: 0.1,
          bottom: 0.3, // Space for volume
        },
      },
      timeScale: {
        borderColor: '#2E2F30',
        textColor: '#9CA3AF',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    try {
      // Create candlestick series using v5.0.0 API
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e', // Green for bullish
        downColor: '#ef4444', // Red for bearish
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        borderVisible: true,
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      })

      // Create volume series using v5.0.0 API
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.7, // Volume takes bottom 30% of chart
          bottom: 0,
        },
      })

      // Set up volume price scale
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      })

      // Store references
      chartRef.current = chart
      candlestickSeriesRef.current = candlestickSeries
      volumeSeriesRef.current = volumeSeries

      // Set up crosshair move handler
      chart.subscribeCrosshairMove((param) => {
        if (onCrosshairMove) {
          if (param && param.seriesPrices.size > 0) {
            const candlestickData = param.seriesPrices.get(candlestickSeries) as any
            if (candlestickData && candlestickData.close) {
              onCrosshairMove(candlestickData.close)
            }
          } else {
            onCrosshairMove(null)
          }
        }
      })

      // Set up infinite history loading
      chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
        if (logicalRange && logicalRange.from < 10 && !loading && earliestTime && !hasReachedEnd) {
          console.log('Triggering infinite load, earliest time:', new Date(earliestTime))
          loadMoreHistoricalData()
        }
      })

      setIsReady(true)

    } catch (error) {
      console.error('Error creating chart series:', error)
    }

    // Handle resize
    const resizeHandler = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', resizeHandler)

    return () => {
      window.removeEventListener('resize', resizeHandler)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        candlestickSeriesRef.current = null
        volumeSeriesRef.current = null
      }
    }
  }, [height, onCrosshairMove])

  // Initialize data when it changes
  useEffect(() => {
    if (data.length > 0) {
      setAllData(data)
      setEarliestTime(data[0]?.time || null)
      setHasReachedEnd(false) // Reset end flag when new data comes in
    }
  }, [data])

  // Update chart when allData or ready state changes
  useEffect(() => {
    if (!isReady || !candlestickSeriesRef.current || !allData.length) return

    try {
      updateChartData(allData)

      // Fit content to show all data on initial load
      if (chartRef.current && allData.length === data.length) {
        chartRef.current.timeScale().fitContent()
      }
    } catch (error) {
      console.error('Error updating chart data:', error)
    }
  }, [allData, isReady])

  return (
    <div className="w-full">
      <div 
        ref={chartContainerRef} 
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}