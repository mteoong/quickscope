export interface PoolInfo {
  pairAddress: string
  dexId: string
  baseToken: {
    address: string
    symbol: string
    name: string
  }
  quoteToken: {
    address: string
    symbol: string
    name: string
  }
  liquidity: number
  volume24h: number
}

export interface DexScreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd?: string
  liquidity?: {
    usd: number
    base: number
    quote: number
  }
  volume?: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
}

export interface DexScreenerResponse {
  schemaVersion: string
  pairs: DexScreenerPair[]
}

export class PoolDiscoveryService {
  private static readonly DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex'
  private static poolCache = new Map<string, { pools: PoolInfo[]; expires: number }>()
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static async discoverPools(tokenAddress: string): Promise<PoolInfo[]> {
    // console.log(`[PoolDiscovery] Discovering pools for token: ${tokenAddress}`)
    
    // Check cache first
    const cached = this.poolCache.get(tokenAddress)
    if (cached && cached.expires > Date.now()) {
      // console.log(`[PoolDiscovery] Using cached pools (${cached.pools.length} pools)`)
      return cached.pools
    }

    try {
      // Fetch pairs from DexScreener
      const url = `${this.DEXSCREENER_API}/tokens/${tokenAddress}`
      // console.log(`[PoolDiscovery] Fetching from DexScreener: ${url}`)
      
      const response = await fetch(url)
      if (!response.ok) {
        // console.error(`[PoolDiscovery] DexScreener API error: ${response.status}`)
        return []
      }

      const data: DexScreenerResponse = await response.json()
      // console.log(`[PoolDiscovery] DexScreener response:`, data)

      if (!data.pairs || data.pairs.length === 0) {
        // console.log(`[PoolDiscovery] No pairs found for token ${tokenAddress}`)
        return []
      }

      // Filter for Solana pairs only and convert to our format
      const solanaPairs = data.pairs.filter(pair => pair.chainId === 'solana')
      // console.log(`[PoolDiscovery] Found ${solanaPairs.length} Solana pairs`)

      const pools: PoolInfo[] = solanaPairs.map(pair => ({
        pairAddress: pair.pairAddress,
        dexId: pair.dexId,
        baseToken: {
          address: pair.baseToken.address,
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name
        },
        quoteToken: {
          address: pair.quoteToken.address,
          symbol: pair.quoteToken.symbol,
          name: pair.quoteToken.name
        },
        liquidity: pair.liquidity?.usd || 0,
        volume24h: pair.volume?.h24 || 0
      }))

      // Sort by liquidity (highest first) and take top 10
      const topPools = pools
        .sort((a, b) => b.liquidity - a.liquidity)
        .slice(0, 10)

      // console.log(`[PoolDiscovery] Top pools for ${tokenAddress}:`)
      topPools.forEach((pool, i) => {
        // console.log(`  ${i + 1}. ${pool.dexId}: ${pool.baseToken.symbol}/${pool.quoteToken.symbol} - $${pool.liquidity.toFixed(0)} liquidity`)
      })

      // Cache the results
      this.poolCache.set(tokenAddress, {
        pools: topPools,
        expires: Date.now() + this.CACHE_DURATION
      })

      return topPools

    } catch (error) {
      // console.error('[PoolDiscovery] Error discovering pools:', error)
      return []
    }
  }

  static getKnownDexPrograms(): string[] {
    return [
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM
      'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',  // Orca
      'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',  // Jupiter v4
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',  // Jupiter v6
      'CAMMCzo5YL8w4VFF8KVHrK22GGUQpMUdUHNNFVU3gF8',  // Raydium CLMM
      'obriQr1JpxDUTgE5YUwLzrQ6CKdqNYaC1bN7vgmNnEs'   // OpenBook (Serum)
    ]
  }

  static getDexDisplayName(dexId: string): string {
    const dexNames: Record<string, string> = {
      'raydium': 'Raydium',
      'orca': 'Orca', 
      'jupiter': 'Jupiter',
      'serum': 'OpenBook',
      'aldrin': 'Aldrin',
      'lifinity': 'Lifinity',
      'mercurial': 'Mercurial',
      'saber': 'Saber',
      'cropper': 'Cropper',
      'cykura': 'Cykura'
    }
    return dexNames[dexId.toLowerCase()] || dexId
  }

  static clearCache(tokenAddress?: string) {
    if (tokenAddress) {
      this.poolCache.delete(tokenAddress)
    } else {
      this.poolCache.clear()
    }
  }
}