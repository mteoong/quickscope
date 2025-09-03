export interface GeckoTerminalOHLCVItem {
  data: {
    id: string
    type: string
    attributes: {
      ohlcv_list: Array<[number, number, number, number, number, number]> // [timestamp, open, high, low, close, volume]
    }
  }
}

export interface GeckoTerminalOHLCVResponse {
  data: GeckoTerminalOHLCVItem
}

export interface PoolOHLCVData {
  timestamp: number
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export class GeckoTerminalAPI {
  private static readonly BASE_URL = 'https://api.geckoterminal.com/api/v2'
  private static cache = new Map<string, { data: PoolOHLCVData[]; expires: number }>()
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static async getPoolOHLCV(
    network: string,
    poolAddress: string, 
    timeframe: 'day' | 'hour' | 'minute',
    aggregate: number = 1,
    before_timestamp?: number,
    limit: number = 100
  ): Promise<PoolOHLCVData[]> {
    const cacheKey = `${network}-${poolAddress}-${timeframe}-${aggregate}-${before_timestamp || 'latest'}-${limit}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }

    try {
      // Format: /networks/{network}/pools/{poolAddress}/ohlcv/{timeframe}
      let url = `${this.BASE_URL}/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}`
      
      const params = new URLSearchParams()
      params.append('aggregate', aggregate)
      params.append('limit', limit.toString())
      if (before_timestamp) {
        params.append('before_timestamp', before_timestamp.toString())
      }
      
      url += `?${params.toString()}`
      console.log('[GeckoTerminal] Fetching OHLCV from:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`GeckoTerminal API error: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        return []
      }

      const data: GeckoTerminalOHLCVResponse = await response.json()
      console.log('[GeckoTerminal] Raw response:', JSON.stringify(data, null, 2))
      
      if (!data.data?.attributes?.ohlcv_list) {
        console.log('[GeckoTerminal] No OHLCV data in response')
        return []
      }

      const parsedData = this.parseOHLCVData(data.data.attributes.ohlcv_list)
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: parsedData,
        expires: Date.now() + this.CACHE_DURATION
      })

      return parsedData

    } catch (error) {
      console.error('GeckoTerminal API request failed:', error)
      return []
    }
  }

  private static parseOHLCVData(ohlcvList: Array<[number, number, number, number, number, number]>): PoolOHLCVData[] {
    return ohlcvList.map(([timestamp, open, high, low, close, volume]) => ({
      timestamp,
      date: new Date(timestamp * 1000),
      open,
      high,
      low, 
      close,
      volume
    })).sort((a, b) => a.timestamp - b.timestamp)
  }

  static clearCache(network?: string, poolAddress?: string) {
    if (network && poolAddress) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(`${network}-${poolAddress}-`)
      )
      keysToDelete.forEach(key => this.cache.delete(key))
    } else {
      this.cache.clear()
    }
  }
}