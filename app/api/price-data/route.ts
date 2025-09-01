import { NextRequest, NextResponse } from 'next/server'

// In-memory cache to avoid rate limits
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

// Timeframe to limit mapping (number of data points to fetch)
const TIMEFRAME_LIMITS: Record<string, number> = {
  '1m': 1440,  // 1 day worth of minutes
  '5m': 2016,  // 1 week worth of 5-minute intervals  
  '15m': 2016, // 3 weeks worth of 15-minute intervals
  '1h': 2000,  // ~3 months of hourly data
  '4h': 1800,  // ~1 year of 4-hour data
  '1d': 1000,  // ~3 years of daily data
  '1w': 520,   // ~10 years of weekly data
}

// Popular token contract addresses mapped to GeckoTerminal format
// For GeckoTerminal, we need to find the most liquid pool for each token
const TOKEN_ADDRESSES: Record<string, { network: string; address: string }> = {
  // Major tokens - use their most liquid pools on GeckoTerminal
  'ethereum': { network: 'eth', address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' }, // ETH/USDC 0.05% pool
  'bitcoin': { network: 'eth', address: '0x4585fe77225b41b697c938b018e2ac67ac5a20c0' }, // WBTC/ETH 0.05% pool  
  'solana': { network: 'solana', address: 'EP2ib6dYdEeqD8MfE2ezHCxX3kP3K2eLKkirfPm5eyMx' }, // WIF/SOL Raydium pool
  'wif': { network: 'solana', address: 'EP2ib6dYdEeqD8MfE2ezHCxX3kP3K2eLKkirfPm5eyMx' }, // WIF/SOL Raydium pool
  'usdc': { network: 'eth', address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' }, // USDC/ETH pool
  'usdt': { network: 'eth', address: '0x11b815efb8f581194ae79006d24e0d814b7697f6' }, // USDT/ETH pool
  
  // Newer tokens - these would be actual contract addresses provided by user
  'egl': { network: 'solana', address: 'EP2ib6dYdEeqD8MfE2ezHCxX3kP3K2eLKkirfPm5eyMx' }, // Default to WIF pool for demo
  'trump': { network: 'eth', address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' }, // Default to ETH/USDC for demo  
  'pepe': { network: 'eth', address: '0x11950d141ecb863f01007add7d1a342041227b58' }, // PEPE/ETH pool
  'doge': { network: 'eth', address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' }, // Default to ETH/USDC for demo
  'shib': { network: 'eth', address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' }, // Default to ETH/USDC for demo
  'bonk': { network: 'solana', address: 'EP2ib6dYdEeqD8MfE2ezHCxX3kP3K2eLKkirfPm5eyMx' }, // Default to WIF pool for demo
}

interface NormalizedCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface NormalizedResponse {
  success: boolean
  data: NormalizedCandle[]
  hasOHLC: boolean
  fallbackReason?: string
  symbol: string
  lastUpdate: number
}

// Generate realistic mock price data
function generateMockPriceData(tokenId: string, days: number): any {
  const basePrice = getBasePriceForToken(tokenId)
  const dataPoints = Math.min(Math.max(Math.floor(days * 24), 10), 168) // 10 min, 168 max (1 week hourly)
  const now = Date.now()
  const interval = (days * 24 * 60 * 60 * 1000) / dataPoints
  
  const prices: [number, number][] = []
  const volumes: [number, number][] = []
  
  let currentPrice = basePrice
  
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = now - (dataPoints - i - 1) * intervalMs
    
    // Simulate price movement with some volatility
    const volatility = 0.02 // 2% volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility
    currentPrice = currentPrice * (1 + randomChange)
    
    // Add some trend based on token
    const trendFactor = getTrendForToken(tokenId, i / dataPoints)
    currentPrice = currentPrice * (1 + trendFactor)
    
    prices.push([timestamp, currentPrice])
    
    // Generate mock volume
    const baseVolume = basePrice * 1000000 // Base volume
    const volumeVariation = Math.random() * 0.5 + 0.75 // 75% to 125% of base
    volumes.push([timestamp, baseVolume * volumeVariation])
  }
  
  return {
    priceData: {
      prices,
      total_volumes: volumes
    },
    hasOHLC: false
  }
}

function getBasePriceForToken(tokenId: string): number {
  const basePrices: Record<string, number> = {
    'ethereum': 2300,
    'bitcoin': 43000,
    'solana': 95,
    'binancecoin': 310,
    'cardano': 0.45,
    'avalanche-2': 28,
    'matic-network': 0.85,
  }
  
  return basePrices[tokenId] || Math.random() * 10 + 0.1
}

function getTrendForToken(tokenId: string, progress: number): number {
  // Simulate different trend patterns for different tokens
  const trends: Record<string, number> = {
    'ethereum': Math.sin(progress * Math.PI * 2) * 0.001, // Slight oscillation
    'bitcoin': progress * 0.001, // Slight upward trend
    'solana': -progress * 0.0005, // Slight downward trend
    'binancecoin': Math.sin(progress * Math.PI * 4) * 0.0008, // More volatile
  }
  
  return trends[tokenId] || 0
}

// Get token info for GeckoTerminal (pool address and network)
function getTokenInfo(tokenId: string): { network: string; address: string } {
  // If it looks like a contract address, try to determine network and use it directly
  if (tokenId.startsWith('0x') && tokenId.length === 42) {
    return { network: 'eth', address: tokenId } // Assume Ethereum if it's a valid address format
  }
  
  // If it's a Solana address (base58, typically longer)
  if (tokenId.length > 32 && tokenId.length < 50 && !/^0x/.test(tokenId)) {
    return { network: 'solana', address: tokenId }
  }
  
  // Use predefined token mappings
  return TOKEN_ADDRESSES[tokenId.toLowerCase()] || { network: 'eth', address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640' } // Default to ETH/USDC pool
}

// Convert our timeframes to GeckoTerminal timeframes
function getGeckoTerminalTimeframe(timeframe: string): string {
  const timeframeMap: Record<string, string> = {
    '1m': 'minute', 
    '1h': 'hour',
    '1d': 'day'
  }
  return timeframeMap[timeframe] || 'hour'
}

async function fetchPriceData(tokenId: string, timeframe: string, before?: number, limit?: number): Promise<any> {
  const actualLimit = limit || TIMEFRAME_LIMITS[timeframe] || 2000
  const cacheKey = `${tokenId}-${timeframe}-${before || 'latest'}-${actualLimit}`
  const cached = cache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    // Try GeckoTerminal API first (supports address-based queries)
    const tokenInfo = getTokenInfo(tokenId)
    
    // Build GeckoTerminal URL
    const gtTimeframe = getGeckoTerminalTimeframe(timeframe)
    const beforeParam = before ? `&before=${before}` : ''
    const gtUrl = `https://api.geckoterminal.com/api/v2/networks/${tokenInfo.network}/pools/${tokenInfo.address}/ohlcv/${gtTimeframe}?aggregate=1&limit=${Math.min(actualLimit, 1000)}${beforeParam}`
    
    console.log(`Fetching from GeckoTerminal (before: ${before ? new Date(before * 1000).toISOString() : 'none'}): ${gtUrl}`)
    
    const gtResponse = await fetch(gtUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Quickscope-Chart/1.0'
      }
    })
    
    if (gtResponse.ok) {
      const gtData = await gtResponse.json()
      
      if (gtData.data && gtData.data.attributes && gtData.data.attributes.ohlcv_list) {
        const ohlcvList = gtData.data.attributes.ohlcv_list
        
        if (ohlcvList.length > 0) {
          const mappedData = ohlcvList.map((item: any) => [
            item[0] * 1000, // timestamp to milliseconds
            parseFloat(item[1]), // open
            parseFloat(item[2]), // high  
            parseFloat(item[3]), // low
            parseFloat(item[4])  // close
          ]).sort((a: any, b: any) => a[0] - b[0]) // Sort by timestamp ascending (oldest first)
          
          // Remove duplicates by timestamp - keep the first occurrence
          const dedupedData = mappedData.filter((item: any, index: number) => 
            index === 0 || item[0] !== mappedData[index - 1][0]
          )
          
          const volumes = ohlcvList.map((item: any) => [
            item[0] * 1000, // timestamp
            parseFloat(item[5] || 0) // volume
          ]).sort((a: any, b: any) => a[0] - b[0]) // Sort by timestamp ascending
          
          // Remove duplicates from volumes too
          const dedupedVolumes = volumes.filter((item: any, index: number) => 
            index === 0 || item[0] !== volumes[index - 1][0]
          )
          
          // Debug: log data range
          if (dedupedData.length > 0) {
            const firstDate = new Date(dedupedData[0][0]).toISOString()
            const lastDate = new Date(dedupedData[dedupedData.length - 1][0]).toISOString()
            console.log(`GeckoTerminal data range: ${firstDate} to ${lastDate} (${dedupedData.length} points, deduped from ${mappedData.length})`)
          }
          
          const result = { 
            ohlcData: dedupedData, 
            hasOHLC: true,
            volumes: dedupedVolumes,
            isRealData: true
          }
          cache.set(cacheKey, { data: result, timestamp: Date.now() })
          return result
        }
      }
    }

    // Fallback to CryptoCompare for major tokens
    const cryptoSymbol = getCryptoCompareSymbol(tokenId)
    if (cryptoSymbol && ['BTC', 'ETH', 'SOL'].includes(cryptoSymbol)) {
      console.log(`GeckoTerminal failed, trying CryptoCompare fallback for ${cryptoSymbol}`)
      
      const toTs = before ? `&toTs=${before}` : ''
      const cryptoUrl = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${cryptoSymbol}&tsym=USD&limit=${Math.min(actualLimit, 2000)}${toTs}`
      
      const response = await fetch(cryptoUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Quickscope-Chart/1.0'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.Response === 'Success' && data.Data && data.Data.Data) {
          const ohlcData = data.Data.Data
          
          if (ohlcData.length > 0) {
            const mappedData = ohlcData.map((item: any) => [
              item.time * 1000, // Convert to milliseconds
              item.open,
              item.high,  
              item.low,
              item.close
            ])
            
            console.log(`CryptoCompare fallback data range: ${ohlcData.length} points`)
            
            const result = { 
              ohlcData: mappedData, 
              hasOHLC: true,
              volumes: ohlcData.map((item: any) => [item.time * 1000, item.volumeto || item.volumefrom || 0]),
              isRealData: true
            }
            cache.set(cacheKey, { data: result, timestamp: Date.now() })
            return result
          }
        }
      }
    }

    // Fallback to CoinGecko (try once more with different approach)
    const coinGeckoId = getCoinGeckoId(tokenId)
    if (coinGeckoId) {
      const days = getGeckoDaysFromTimeframe(timeframe)
      const gcUrl = `https://api.coingecko.com/api/v3/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=${days}&interval=hourly`
      
      console.log(`Trying CoinGecko as fallback: ${gcUrl}`)
      
      const gcResponse = await fetch(gcUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Quickscope-Chart/1.0'
        }
      })

      if (gcResponse.ok) {
        const gcData = await gcResponse.json()
        if (gcData.prices && gcData.prices.length > 0) {
          const result = { 
            priceData: gcData, 
            hasOHLC: false,
            isRealData: true
          }
          cache.set(cacheKey, { data: result, timestamp: Date.now() })
          return result
        }
      }
    }

    // Final fallback to enhanced mock data
    console.log(`All APIs failed for ${tokenId}, using enhanced mock data`)
    const result = generateEnhancedMockData(tokenId, timeframe)
    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result

  } catch (error) {
    console.error('Error fetching price data, using mock data:', error)
    const result = generateEnhancedMockData(tokenId, timeframe)
    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  }
}

// Function to aggregate OHLC data to larger timeframes
function aggregateToTimeframe(data: any[], multiplier: number): any[] {
  if (data.length === 0 || multiplier <= 1) return data
  
  const aggregated: any[] = []
  
  for (let i = 0; i < data.length; i += multiplier) {
    const chunk = data.slice(i, i + multiplier)
    if (chunk.length === 0) continue
    
    const aggregatedItem = {
      time: chunk[0].time, // Use first timestamp
      open: chunk[0].open,
      high: Math.max(...chunk.map((item: any) => item.high)),
      low: Math.min(...chunk.map((item: any) => item.low)),
      close: chunk[chunk.length - 1].close, // Use last close
      volumeto: chunk.reduce((sum: number, item: any) => sum + (item.volumeto || 0), 0),
      volumefrom: chunk.reduce((sum: number, item: any) => sum + (item.volumefrom || 0), 0)
    }
    
    aggregated.push(aggregatedItem)
  }
  
  return aggregated
}

// Helper function to convert timeframe to CoinGecko days
function getGeckoDaysFromTimeframe(timeframe: string): number {
  const daysMap: Record<string, number> = {
    '1m': 1,     // 1 day
    '5m': 7,     // 1 week
    '15m': 30,   // 1 month
    '1h': 90,    // 3 months
    '4h': 365,   // 1 year
    '1d': 1095,  // 3 years
    '1w': 3650,  // 10 years
  }
  return daysMap[timeframe] || 90
}

// Map token symbols to CryptoCompare symbols
function getCryptoCompareSymbol(tokenId: string): string {
  const symbolMap: Record<string, string> = {
    'ethereum': 'ETH',
    'bitcoin': 'BTC', 
    'solana': 'SOL',
    'egl': 'SOL', // Map Eagle to SOL for demo
    'trump': 'ETH', // Fallback
    'pepe': 'PEPE',
    'doge': 'DOGE',
    'shib': 'SHIB',
    'bonk': 'BONK',
    'usdc': 'USDC',
    'usdt': 'USDT'
  }
  
  return symbolMap[tokenId.toLowerCase()] || 'ETH'
}

// Map token symbols to CoinGecko IDs
function getCoinGeckoId(tokenId: string): string | null {
  const idMap: Record<string, string> = {
    'ethereum': 'ethereum',
    'bitcoin': 'bitcoin',
    'solana': 'solana',
    'egl': 'solana', // Map Eagle to SOL for demo
    'pepe': 'pepe',
    'doge': 'dogecoin',
    'shib': 'shiba-inu'
  }
  
  return idMap[tokenId.toLowerCase()] || null
}

// Enhanced mock data with more realistic patterns
function generateEnhancedMockData(tokenId: string, timeframe: string): any {
  const basePrice = getBasePriceForToken(tokenId)
  const limit = TIMEFRAME_LIMITS[timeframe] || 1000
  const dataPoints = Math.min(limit, 2000) // Cap at 2000 points for performance
  const now = Date.now()
  
  // Calculate interval based on timeframe
  let intervalMs: number
  switch(timeframe) {
    case '1m': intervalMs = 60 * 1000; break         // 1 minute
    case '5m': intervalMs = 5 * 60 * 1000; break     // 5 minutes
    case '15m': intervalMs = 15 * 60 * 1000; break   // 15 minutes
    case '1h': intervalMs = 60 * 60 * 1000; break    // 1 hour
    case '4h': intervalMs = 4 * 60 * 60 * 1000; break // 4 hours
    case '1d': intervalMs = 24 * 60 * 60 * 1000; break // 1 day
    case '1w': intervalMs = 7 * 24 * 60 * 60 * 1000; break // 1 week
    default: intervalMs = 60 * 60 * 1000; break      // Default 1 hour
  }
  
  const ohlcData: number[][] = []
  const volumes: [number, number][] = []
  
  let price = basePrice
  
  for (let i = 0; i < dataPoints; i++) {
    // Generate timestamps going backwards from current time
    const timestamp = now - i * intervalMs
    
    // More sophisticated price movement
    const volatility = getVolatilityForToken(tokenId)
    const trend = getTrendForToken(tokenId, i / dataPoints)
    const marketCycle = Math.sin((i / dataPoints) * Math.PI * 2) * 0.005 // Market cycle
    
    // Calculate OHLC
    const open = price
    const randomness = (Math.random() - 0.5) * 2 * volatility
    const trendEffect = trend + marketCycle
    
    price = price * (1 + randomness + trendEffect)
    
    // Generate realistic OHLC within the period
    const priceVar = price * volatility * 0.5
    const high = price + Math.random() * priceVar
    const low = price - Math.random() * priceVar
    const close = low + Math.random() * (high - low)
    
    // Update price for next iteration
    price = close
    
    ohlcData.push([timestamp, open, high, low, close])
    
    // Generate realistic volume
    const baseVolume = basePrice * 1000000 * getVolumeMultiplierForToken(tokenId)
    const volumeVariation = 0.5 + Math.random() * 1.5 // 50% to 200% of base
    volumes.push([timestamp, baseVolume * volumeVariation])
  }
  
  // Reverse arrays to get chronological order (oldest first)
  return {
    ohlcData: ohlcData.reverse(),
    hasOHLC: true,
    volumes: volumes.reverse(),
    isRealData: false
  }
}

function getVolatilityForToken(tokenId: string): number {
  const volatilityMap: Record<string, number> = {
    'bitcoin': 0.02,      // 2% - relatively stable
    'ethereum': 0.025,    // 2.5%
    'solana': 0.035,      // 3.5% - more volatile
    'pepe': 0.08,         // 8% - very volatile meme coin
    'shib': 0.07,         // 7%
    'bonk': 0.09,         // 9%
    'egl': 0.04,          // 4%
  }
  
  return volatilityMap[tokenId.toLowerCase()] || 0.03
}

function getVolumeMultiplierForToken(tokenId: string): number {
  const volumeMap: Record<string, number> = {
    'bitcoin': 10,        // High volume
    'ethereum': 8,
    'solana': 5,
    'pepe': 15,           // Meme coins often have high volume
    'shib': 12,
    'bonk': 8,
    'egl': 2,             // Lower volume
  }
  
  return volumeMap[tokenId.toLowerCase()] || 3
}


// Generate mock data based on current real price
function generateMockPriceDataFromCurrent(tokenId: string, days: number, currentPrice: number): any {
  const dataPoints = Math.min(Math.max(Math.floor(days * 24), 10), 168)
  const now = Date.now()
  const interval = (days * 24 * 60 * 60 * 1000) / dataPoints
  
  const prices: [number, number][] = []
  const volumes: [number, number][] = []
  
  let price = currentPrice * (0.9 + Math.random() * 0.1) // Start slightly below current
  
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = now - (dataPoints - i - 1) * intervalMs
    
    // Simulate gradual movement toward current price
    const targetProgress = i / (dataPoints - 1)
    const targetPrice = currentPrice
    const blendFactor = 0.1
    
    price = price * (1 - blendFactor) + targetPrice * blendFactor
    
    // Add volatility
    const volatility = 0.02
    const randomChange = (Math.random() - 0.5) * 2 * volatility
    price = price * (1 + randomChange)
    
    prices.push([timestamp, price])
    
    // Generate volume based on price
    const baseVolume = price * 500000
    const volumeVariation = Math.random() * 0.5 + 0.75
    volumes.push([timestamp, baseVolume * volumeVariation])
  }
  
  return {
    priceData: {
      prices,
      total_volumes: volumes
    },
    hasOHLC: false,
    isRealPrice: true
  }
}

function normalizeOHLCData(ohlcData: number[][], volumes?: [number, number][]): NormalizedCandle[] {
  return ohlcData.map(([timestamp, open, high, low, close], index) => {
    const volumeData = volumes && volumes[index] ? volumes[index][1] : 0
    return {
      time: timestamp,
      open,
      high,
      low,
      close,
      volume: volumeData
    }
  })
}

function normalizePriceData(priceData: any): NormalizedCandle[] {
  const prices = priceData.prices || []
  const volumes = priceData.total_volumes || []
  
  return prices.map(([timestamp, price]: [number, number], index: number) => {
    const volume = volumes[index] ? volumes[index][1] : 0
    return {
      time: timestamp,
      open: price,
      high: price,
      low: price,
      close: price,
      volume
    }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address') || 'ethereum'
    const timeframe = searchParams.get('timeframe') || '1d'
    const chain = searchParams.get('chain') || 'ethereum'
    const before = searchParams.get('before') ? parseInt(searchParams.get('before')!) : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    // Use the provided address/symbol 
    const tokenId = address.toLowerCase()

    const result = await fetchPriceData(tokenId, timeframe, before, limit)
    
    let normalizedData: NormalizedCandle[]
    let hasOHLC = false
    let fallbackReason: string | undefined

    if (result.hasOHLC && result.ohlcData) {
      normalizedData = normalizeOHLCData(result.ohlcData, result.volumes)
      hasOHLC = true
      if (!result.isRealData) {
        fallbackReason = 'Using simulated OHLC data - real data temporarily unavailable'
      }
    } else if (result.priceData) {
      normalizedData = normalizePriceData(result.priceData)
      hasOHLC = false
      if (result.isRealData) {
        fallbackReason = 'Real price data - OHLC not available from provider'
      } else {
        fallbackReason = 'Using simulated price data - real data temporarily unavailable'
      }
    } else {
      throw new Error('No data available')
    }

    const response: NormalizedResponse = {
      success: true,
      data: normalizedData,
      hasOHLC,
      fallbackReason,
      symbol: typeof tokenId === 'string' ? tokenId.toUpperCase() : 'UNKNOWN',
      lastUpdate: Date.now()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Price data API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      hasOHLC: false,
      symbol: typeof address === 'string' ? address.toUpperCase() : 'UNKNOWN',
      lastUpdate: Date.now()
    }, { status: 500 })
  }
}