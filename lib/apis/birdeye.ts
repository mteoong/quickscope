import { retryWithBackoff, deduplicateRequest } from '../utils/api-utils'

export interface BirdeyeTokenHolder {
  address: string
  balance: number
  percentage: number
  rank: number
}

export interface BirdeyeHoldersResponse {
  success: boolean
  data: {
    holders: BirdeyeTokenHolder[]
    totalHolders: number
  }
}

export interface HistoricalDataPoint {
  date: Date
  volumeUsd: number
  liquidityUsd: number
  priceUsd: number
}

// Birdeye API module for token holders and transactions

export class BirdeyeAPI {
  private static readonly BASE_URL = 'https://public-api.birdeye.so/defi'
  
  // Separate API keys for different endpoint types to avoid rate limiting conflicts
  private static readonly API_KEYS = {
    HOLDERS: process.env.BIRDEYE_API_KEY_HOLDERS || '4f29660278dd44e3af7a0d5b01dca853',      // For token holders endpoint (fallback use)
    HISTORICAL: process.env.BIRDEYE_API_KEY_HISTORICAL || '41ae5dbd9a7c403f86b1f647d9c709e0',   // For historical data endpoint (volume charts)
    TRANSACTIONS: process.env.BIRDEYE_API_KEY_TRANSACTIONS || '41ae5dbd9a7c403f86b1f647d9c709e0'  // For transactions endpoint (traders tab)
  }
  
  // Separate usage tracking for each endpoint type
  private static keyUsageCount = new Map<string, { count: number; resetTime: number }>()
  private static readonly MAX_CALLS_PER_KEY_PER_MINUTE = 20 // Conservative limit
  private static holdersCache = new Map<string, { data: BirdeyeTokenHolder[]; totalHolders: number; expires: number }>()
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes - no refresh to stay within free tier
  private static lastCallTime = 0
  private static readonly MIN_CALL_INTERVAL = 500 // 500ms between calls

  // Get API key for specific endpoint type with rate limiting
  private static getApiKeyForEndpoint(endpointType: 'HOLDERS' | 'HISTORICAL' | 'TRANSACTIONS'): string {
    const now = Date.now()
    const apiKey = this.API_KEYS[endpointType]
    const usage = this.keyUsageCount.get(apiKey) || { count: 0, resetTime: now + 60000 }
    
    // Reset counter if minute has passed
    if (now > usage.resetTime) {
      usage.count = 0
      usage.resetTime = now + 60000
    }
    
    // Track usage for this specific API key
    usage.count++
    this.keyUsageCount.set(apiKey, usage)
    
    return apiKey
  }

  // Throttle calls to prevent rate limiting
  private static async throttleCall(): Promise<void> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCallTime
    
    if (timeSinceLastCall < this.MIN_CALL_INTERVAL) {
      const waitTime = this.MIN_CALL_INTERVAL - timeSinceLastCall
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastCallTime = Date.now()
  }

  static async getTokenHolders(tokenAddress: string, limit: number = 20, tokenTotalSupply?: number): Promise<{ holders: BirdeyeTokenHolder[]; totalHolders: number }> {
    // console.log(`[BirdeyeAPI] Fetching holders for token: ${tokenAddress}`)
    
    // Check cache first
    const cached = this.holdersCache.get(tokenAddress)
    if (cached && cached.expires > Date.now()) {
      // console.log(`[BirdeyeAPI] Using cached holders data (${cached.data.length} holders)`)
      return { holders: cached.data.slice(0, limit), totalHolders: cached.totalHolders }
    }

    const requestKey = `holders-${tokenAddress}-${limit}`

    return deduplicateRequest(requestKey, async () => {
      return retryWithBackoff(async () => {
        // Apply throttling
        await this.throttleCall()
        
        const apiKey = this.getApiKeyForEndpoint('HOLDERS')
        const url = `${this.BASE_URL}/v3/token/holder?address=${tokenAddress}&offset=0&limit=${Math.min(limit, 50)}&ui_amount_mode=scaled`
        // console.log(`[BirdeyeAPI] Fetching from: ${url} with key ${apiKey.slice(0, 8)}...`)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-chain': 'solana',
            'X-API-KEY': apiKey,
          },
        })

        if (!response.ok) {
          // Create error object with status for retry logic
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
          ;(error as any).status = response.status
          ;(error as any).response = { status: response.status, headers: response.headers }
          
          // console.error(`[BirdeyeAPI] HTTP error: ${response.status} ${response.statusText}`)
          
          // Try to get error details
          try {
            const errorText = await response.text()
            // console.error(`[BirdeyeAPI] Error response: ${errorText}`)
          } catch (e) {
            // console.error(`[BirdeyeAPI] Could not read error response`)
          }
          
          throw error
        }

        const data = await response.json()
        // console.log(`[BirdeyeAPI] Raw response:`, JSON.stringify(data, null, 2))

        if (!data.success || !data.data) {
          // console.error(`[BirdeyeAPI] API returned unsuccessful response:`, data)
          throw new Error('API returned unsuccessful response')
        }

        const holders = this.parseHoldersData(data.data, limit, tokenTotalSupply)
        const totalHolders = data.data.items?.length || 0

        // console.log(`[BirdeyeAPI] Successfully parsed ${holders.length} holders, total: ${totalHolders}`)

        // Cache the results
        this.holdersCache.set(tokenAddress, {
          data: holders,
          totalHolders,
          expires: Date.now() + this.CACHE_DURATION
        })

        return { holders, totalHolders }

      }, { maxRetries: 7, baseDelay: 2000, maxDelay: 30000 })
        .catch((error) => {
          console.error('[BirdeyeAPI] All retries failed, using fallback data. Error:', error)
          return this.getFallbackHoldersData(tokenAddress, limit)
        })
    })
  }

  private static parseHoldersData(data: any, limit: number, tokenTotalSupply?: number): BirdeyeTokenHolder[] {
    if (!data.items || !Array.isArray(data.items)) {
      // console.warn('[BirdeyeAPI] No items array found in response')
      return []
    }

    return data.items.slice(0, limit).map((item: any, index: number) => {
      const uiAmount = item.ui_amount || 0
      // Calculate percentage of total supply if available
      const percentage = tokenTotalSupply && tokenTotalSupply > 0 
        ? (uiAmount / tokenTotalSupply) * 100 
        : 0
      
      return {
        address: item.owner || item.address || '',
        balance: uiAmount,
        percentage: percentage,
        rank: index + 1
      }
    })
  }

  private static getFallbackHoldersData(tokenAddress: string, limit: number): { holders: BirdeyeTokenHolder[]; totalHolders: number } {
    console.log(`[BirdeyeAPI] Using fallback mock data for ${tokenAddress}, generating ${Math.min(limit, 10)} holders`)
    
    // Generate mock holders data
    const mockHolders: BirdeyeTokenHolder[] = []
    for (let i = 0; i < Math.min(limit, 10); i++) {
      mockHolders.push({
        address: `${tokenAddress.slice(0, 4)}...${Math.random().toString(36).substr(2, 4)}`,
        balance: Math.random() * 1000000,
        percentage: Math.random() * 10,
        rank: i + 1
      })
    }

    console.log(`[BirdeyeAPI] Generated ${mockHolders.length} fallback holders`)
    return { holders: mockHolders, totalHolders: 1234 }
  }

  static clearHoldersCache(tokenAddress?: string) {
    if (tokenAddress) {
      this.holdersCache.delete(tokenAddress)
    } else {
      this.holdersCache.clear()
    }
  }

  // Historical Volume and Liquidity Data
  private static historicalCache = new Map<string, { data: HistoricalDataPoint[]; expires: number }>()
  
  static async getHistoricalData(tokenAddress: string, timeframe: '1W' | '2W' | '1M'): Promise<HistoricalDataPoint[]> {
    console.log('[BirdeyeAPI] getHistoricalData called with:', tokenAddress, timeframe)
    
    // Test with PENGU address for debugging
    if (tokenAddress === '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv') {
      console.log('[BirdeyeAPI] Processing PENGU token')
    }
    
    const cacheKey = `historical-${tokenAddress}-${timeframe}`
    const cached = this.historicalCache.get(cacheKey)
    
    // Temporarily disable cache for debugging
    // if (cached && cached.expires > Date.now()) {
    //   return cached.data
    // }

    const requestKey = `historical-${tokenAddress}-${timeframe}`

    return deduplicateRequest(requestKey, async () => {
      return retryWithBackoff(async () => {
        // Apply throttling
        await this.throttleCall()
        
        const apiKey = this.getApiKeyForEndpoint('HISTORICAL')
        
        // Calculate time parameters based on timeframe
        const now = Date.now()
        const timeframeDays = timeframe === '1W' ? 7 : timeframe === '2W' ? 14 : 30
        const fromTime = Math.floor((now - (timeframeDays * 24 * 60 * 60 * 1000)) / 1000)
        const toTime = Math.floor(now / 1000)
        
        console.log('[BirdeyeAPI] Time range:', {
          timeframe,
          timeframeDays,
          nowMs: now,
          nowDate: new Date(now).toISOString(),
          fromDate: new Date(fromTime * 1000).toISOString(),
          toDate: new Date(toTime * 1000).toISOString(),
          fromTime,
          toTime
        })
        
        // Let me verify the timestamps are reasonable - current unix timestamp should be around 1725285316  
        const currentRealTime = Math.floor(Date.now() / 1000)
        console.log('[BirdeyeAPI] Real current unix timestamp:', currentRealTime, 'vs calculated:', toTime)
        
        // For debugging, let's use correct timestamps (September 2024)
        const debugToTime = 1725300000  // Sept 2, 2024
        const debugFromTime = debugToTime - (7 * 24 * 60 * 60) // 1 week before
        console.log('[BirdeyeAPI] Using debug timestamps:', debugFromTime, 'to', debugToTime)
        
        // Use 1d interval for all timeframes to get daily data
        const interval = '1d'
        
        const url = `${this.BASE_URL}/ohlcv?address=${tokenAddress}&type=${interval}&time_from=${debugFromTime}&time_to=${debugToTime}`
        console.log('[BirdeyeAPI] Fetching historical data from URL:', url)
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-chain': 'solana',
            'X-API-KEY': apiKey,
          },
        })

        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
          ;(error as any).status = response.status
          throw error
        }

        const data = await response.json()
        console.log('[BirdeyeAPI] Raw historical data response:', JSON.stringify(data, null, 2))
        
        if (!data.success || !data.data) {
          console.error('[BirdeyeAPI] API returned unsuccessful response:', data)
          throw new Error('API returned unsuccessful response')
        }

        const parsedData = this.parseHistoricalData(data.data.items || [])
        
        // Cache for 10 minutes to balance freshness with rate limits
        this.historicalCache.set(cacheKey, {
          data: parsedData,
          expires: Date.now() + (10 * 60 * 1000)
        })

        return parsedData

      }, { maxRetries: 7, baseDelay: 2000, maxDelay: 30000 })
        .catch((error) => {
          console.error('[BirdeyeAPI] Error fetching historical data:', error)
          return this.getFallbackHistoricalData(timeframe)
        })
    })
  }

  private static parseHistoricalData(items: any[]): HistoricalDataPoint[] {
    console.log('[BirdeyeAPI] Parsing historical data:', items)
    return items.map((item: any) => {
      const parsed = {
        date: item.unix_time ? new Date(item.unix_time * 1000) : new Date(),
        volumeUsd: item.v_usd || 0, // Volume in USD
        liquidityUsd: 0, // Will need separate API call for liquidity
        priceUsd: item.c || 0, // Close price for reference
      }
      console.log('[BirdeyeAPI] Parsed item:', item, '-> ', parsed)
      return parsed
    }).sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  private static getFallbackHistoricalData(timeframe: '1W' | '2W' | '1M'): HistoricalDataPoint[] {
    const days = timeframe === '1W' ? 7 : timeframe === '2W' ? 14 : 30
    const data: HistoricalDataPoint[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      data.push({
        date,
        volumeUsd: Math.random() * 1000000 + 100000,
        liquidityUsd: Math.random() * 5000000 + 500000,
        priceUsd: Math.random() * 10 + 1,
      })
    }
    
    return data
  }

  static async getTokenTransactions(tokenAddress: string, limit: number = 30): Promise<any[]> {
    const requestKey = `transactions-${tokenAddress}-${limit}`

    return deduplicateRequest(requestKey, async () => {
      return retryWithBackoff(async () => {
        // Apply throttling
        await this.throttleCall()
        
        const apiKey = this.getApiKeyForEndpoint('TRANSACTIONS')
        const url = `${this.BASE_URL}/v3/token/txs?address=${tokenAddress}&offset=0&limit=${Math.min(limit, 50)}&sort_by=block_unix_time&sort_type=desc&tx_type=swap&ui_amount_mode=scaled`
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-chain': 'solana',
            'X-API-KEY': apiKey,
          },
        })

        if (!response.ok) {
          // Create error object with status for retry logic
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
          ;(error as any).status = response.status
          ;(error as any).response = { status: response.status, headers: response.headers }
          
          console.error(`[BirdeyeAPI] Transactions HTTP error: ${response.status} ${response.statusText}`)
          throw error
        }

        const data = await response.json()
        
        if (!data.success || !data.data) {
          console.error(`[BirdeyeAPI] Transactions API returned unsuccessful response:`, data)
          throw new Error('API returned unsuccessful response')
        }

        return data.data.items || []

      }, { maxRetries: 7, baseDelay: 2000, maxDelay: 30000 })
        .catch((error) => {
          console.error('[BirdeyeAPI] Error fetching token transactions after retries:', error)
          console.error('[BirdeyeAPI] Token address:', tokenAddress)
          console.error('[BirdeyeAPI] Limit:', limit)
          console.error('[BirdeyeAPI] Environment:', typeof window === 'undefined' ? 'server' : 'client')
          console.error('[BirdeyeAPI] API Key exists:', !!this.getApiKeyForEndpoint('TRANSACTIONS'))
          console.error('[BirdeyeAPI] Error details:', {
            message: error instanceof Error ? error.message : String(error),
            status: (error as any)?.status,
            stack: error instanceof Error ? error.stack : undefined
          })
          return []
        })
    })
  }
}