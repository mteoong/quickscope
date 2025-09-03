import { DexScreenerAPI, DexScreenerPair } from '@/lib/apis/dexscreener'
import { GeckoTerminalAPI, PoolOHLCVData } from '@/lib/apis/geckoterminal'

export interface VolumeMarketCapDataPoint {
  date: Date
  volumeUsd: number
  marketCapUsd: number
  priceUsd: number
}

export interface TokenSupplyInfo {
  circulatingSupply?: number
  totalSupply?: number
  isCirculating: boolean // true if using circulating supply, false if using total (FDV)
}

export class VolumeMarketCapService {
  private static cache = new Map<string, { data: VolumeMarketCapDataPoint[]; expires: number }>()
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static async getVolumeMarketCapData(
    tokenAddress: string,
    timeframe: '1W' | '2W' | '1M'
  ): Promise<VolumeMarketCapDataPoint[]> {
    const cacheKey = `${tokenAddress}-${timeframe}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }

    try {
      console.log('[VolumeMarketCapService] Fetching data for token:', tokenAddress, 'timeframe:', timeframe)

      // Step 1: Resolve primary pool using DexScreener
      const primaryPool = await this.resolvePrimaryPool(tokenAddress)
      if (!primaryPool) {
        console.log('[VolumeMarketCapService] No primary pool found')
        return []
      }

      console.log('[VolumeMarketCapService] Primary pool:', primaryPool.pairAddress)

      // Step 2: Get supply info 
      const supplyInfo = this.getSupplyInfo(primaryPool, tokenAddress)
      console.log('[VolumeMarketCapService] Supply info:', supplyInfo)

      // Step 3: Fetch OHLCV from GeckoTerminal
      const days = timeframe === '1W' ? 7 : timeframe === '2W' ? 14 : 30
      const ohlcvData = await GeckoTerminalAPI.getPoolOHLCV(
        'solana', // Assuming Solana for now
        primaryPool.pairAddress,
        'day', // timeframe (use 'day' not '1d')
        1, // aggregate = 1 day
        undefined, // before_timestamp (latest)
        days + 5 // Get a few extra days to ensure we have enough data
      )

      console.log('[VolumeMarketCapService] OHLCV data points:', ohlcvData.length)

      if (ohlcvData.length === 0) {
        console.log('[VolumeMarketCapService] No OHLCV data received')
        return []
      }

      // Step 4: Compute Volume + Market Cap
      const result = this.computeVolumeMarketCap(ohlcvData, supplyInfo, days)
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: result,
        expires: Date.now() + this.CACHE_DURATION
      })

      console.log('[VolumeMarketCapService] Final result points:', result.length)
      return result

    } catch (error) {
      console.error('[VolumeMarketCapService] Error:', error)
      return []
    }
  }

  private static async resolvePrimaryPool(tokenAddress: string): Promise<DexScreenerPair | null> {
    try {
      const dexData = await DexScreenerAPI.getTokenData(tokenAddress)
      if (!dexData?.pairs || dexData.pairs.length === 0) {
        return null
      }

      // Filter pairs for this token
      const relevantPairs = dexData.pairs.filter(pair => 
        pair.baseToken.address.toLowerCase() === tokenAddress.toLowerCase() ||
        pair.quoteToken.address.toLowerCase() === tokenAddress.toLowerCase()
      )

      if (relevantPairs.length === 0) {
        return null
      }

      // Sort by liquidity and take the most liquid pair
      const primaryPair = relevantPairs.sort((a, b) => 
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )[0]

      return primaryPair

    } catch (error) {
      console.error('[VolumeMarketCapService] Error resolving primary pool:', error)
      return null
    }
  }

  private static getSupplyInfo(pool: DexScreenerPair, tokenAddress: string): TokenSupplyInfo {
    // Try to get supply from FDV and current price
    const currentPrice = parseFloat(pool.priceUsd || '0')
    
    if (pool.fdv && currentPrice > 0) {
      const totalSupply = pool.fdv / currentPrice
      
      // For now, assume total supply = circulating supply
      // In a real implementation, you might want to fetch actual circulating supply
      return {
        totalSupply,
        circulatingSupply: totalSupply, // Assuming no locked tokens
        isCirculating: true
      }
    }

    // Fallback - estimate from market cap if available
    if (pool.marketCap && currentPrice > 0) {
      const circulatingSupply = pool.marketCap / currentPrice
      return {
        circulatingSupply,
        totalSupply: circulatingSupply, // Best guess
        isCirculating: true
      }
    }

    // Default fallback for popular tokens (this should be configurable)
    return {
      totalSupply: 1000000000, // 1B tokens default
      circulatingSupply: 1000000000,
      isCirculating: false // Mark as FDV since we're guessing
    }
  }

  private static computeVolumeMarketCap(
    ohlcvData: PoolOHLCVData[], 
    supplyInfo: TokenSupplyInfo,
    requestedDays: number
  ): VolumeMarketCapDataPoint[] {
    // Take the most recent requestedDays
    const recentData = ohlcvData.slice(-requestedDays)
    
    const supply = supplyInfo.isCirculating 
      ? (supplyInfo.circulatingSupply || supplyInfo.totalSupply || 1000000000)
      : (supplyInfo.totalSupply || 1000000000)

    return recentData.map(item => ({
      date: item.date,
      volumeUsd: item.volume,
      marketCapUsd: item.close * supply,
      priceUsd: item.close
    }))
  }

  static clearCache(tokenAddress?: string) {
    if (tokenAddress) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(`${tokenAddress}-`)
      )
      keysToDelete.forEach(key => this.cache.delete(key))
    } else {
      this.cache.clear()
    }
  }
}