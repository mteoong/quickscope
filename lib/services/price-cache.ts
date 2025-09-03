export interface PriceData {
  symbol: string
  address: string
  priceUSD: number
  lastUpdated: number
}

export interface CommonToken {
  address: string
  symbol: string
  decimals: number
}

export const COMMON_TOKENS: CommonToken[] = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    decimals: 9
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    decimals: 6
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT', 
    decimals: 6
  },
  {
    address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    symbol: 'mSOL',
    decimals: 9
  }
]

export class PriceCacheService {
  private static instance: PriceCacheService
  private priceCache = new Map<string, PriceData>()
  private updateInterval: NodeJS.Timeout | null = null
  private readonly CACHE_DURATION = 30 * 1000 // 30 seconds
  private readonly UPDATE_INTERVAL = 15 * 1000 // Update every 15 seconds
  
  private constructor() {
    this.initializeCache()
  }

  static getInstance(): PriceCacheService {
    if (!PriceCacheService.instance) {
      PriceCacheService.instance = new PriceCacheService()
    }
    return PriceCacheService.instance
  }

  private async initializeCache() {
    console.log('[PriceCache] Initializing price cache')
    await this.updatePrices()
    
    // Start periodic updates
    this.updateInterval = setInterval(() => {
      this.updatePrices()
    }, this.UPDATE_INTERVAL)
  }

  private async updatePrices() {
    try {
      console.log('[PriceCache] Updating token prices')
      
      // Update prices for common tokens
      for (const token of COMMON_TOKENS) {
        try {
          const price = await this.fetchTokenPrice(token.address)
          if (price !== null) {
            this.priceCache.set(token.address, {
              symbol: token.symbol,
              address: token.address,
              priceUSD: price,
              lastUpdated: Date.now()
            })
            console.log(`[PriceCache] Updated ${token.symbol}: $${price.toFixed(4)}`)
          }
        } catch (error) {
          console.error(`[PriceCache] Failed to update price for ${token.symbol}:`, error)
        }
      }
      
    } catch (error) {
      console.error('[PriceCache] Failed to update prices:', error)
    }
  }

  private async fetchTokenPrice(tokenAddress: string): Promise<number | null> {
    try {
      // Use DexScreener API for price data
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)
      
      if (!response.ok) {
        return null
      }

      const data = await response.json()
      
      if (data.pairs && data.pairs.length > 0) {
        // Get the pair with highest liquidity
        const bestPair = data.pairs.sort((a: any, b: any) => {
          const aLiq = parseFloat(a.liquidity?.usd || '0')
          const bLiq = parseFloat(b.liquidity?.usd || '0')
          return bLiq - aLiq
        })[0]

        const priceUSD = parseFloat(bestPair.priceUsd || '0')
        return priceUSD > 0 ? priceUSD : null
      }

      return null

    } catch (error) {
      console.error(`[PriceCache] Error fetching price for ${tokenAddress}:`, error)
      return null
    }
  }

  getPrice(tokenAddress: string): number | null {
    const cached = this.priceCache.get(tokenAddress)
    
    if (!cached) {
      return null
    }

    // Check if cache is still valid
    const age = Date.now() - cached.lastUpdated
    if (age > this.CACHE_DURATION) {
      console.log(`[PriceCache] Price for ${cached.symbol} is stale (${age}ms old)`)
      return null
    }

    return cached.priceUSD
  }

  getPriceBySymbol(symbol: string): number | null {
    const token = COMMON_TOKENS.find(t => t.symbol === symbol)
    if (!token) {
      return null
    }
    return this.getPrice(token.address)
  }

  getAllPrices(): Map<string, PriceData> {
    return new Map(this.priceCache)
  }

  // Get USD value for a token amount
  calculateUSDValue(tokenAddress: string, amount: number): number {
    const price = this.getPrice(tokenAddress)
    if (price === null) {
      return 0
    }
    return amount * price
  }

  // Calculate price per token from swap amounts
  calculateSwapPrice(
    inputTokenAddress: string,
    inputAmount: number,
    outputTokenAddress: string, 
    outputAmount: number
  ): number {
    // If one of the tokens is a stablecoin, use direct ratio
    const inputToken = COMMON_TOKENS.find(t => t.address === inputTokenAddress)
    const outputToken = COMMON_TOKENS.find(t => t.address === outputTokenAddress)

    if (inputToken?.symbol === 'USDC' || inputToken?.symbol === 'USDT') {
      return inputAmount / outputAmount
    }

    if (outputToken?.symbol === 'USDC' || outputToken?.symbol === 'USDT') {
      return outputAmount / inputAmount
    }

    // If one token is SOL, calculate relative to SOL price
    const solPrice = this.getPriceBySymbol('SOL')
    if (solPrice && inputToken?.symbol === 'SOL') {
      return (inputAmount * solPrice) / outputAmount
    }

    if (solPrice && outputToken?.symbol === 'SOL') {
      return (outputAmount * solPrice) / inputAmount
    }

    // Fallback: try to get USD values for both tokens
    const inputUSD = this.calculateUSDValue(inputTokenAddress, inputAmount)
    const outputUSD = this.calculateUSDValue(outputTokenAddress, outputAmount)

    if (inputUSD > 0 && outputUSD > 0) {
      return inputUSD / outputAmount // Price per output token in USD
    }

    return 0
  }

  // Add a specific token to cache
  async addToken(tokenAddress: string, symbol?: string): Promise<void> {
    try {
      const price = await this.fetchTokenPrice(tokenAddress)
      if (price !== null) {
        this.priceCache.set(tokenAddress, {
          symbol: symbol || tokenAddress.slice(0, 8),
          address: tokenAddress,
          priceUSD: price,
          lastUpdated: Date.now()
        })
        console.log(`[PriceCache] Added ${symbol || tokenAddress} to cache: $${price.toFixed(6)}`)
      }
    } catch (error) {
      console.error(`[PriceCache] Failed to add token ${tokenAddress}:`, error)
    }
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.priceCache.clear()
    console.log('[PriceCache] Cache destroyed')
  }
}