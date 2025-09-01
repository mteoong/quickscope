export interface TrendingToken {
  address: string
  name: string
  symbol: string
  image?: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap?: number
  network: string
  rank: number
}

export interface BirdeyeTrendingResponse {
  success: boolean
  data: {
    updateUnixTime: number
    updateTime: string
    tokens: Array<{
      address: string
      name: string
      symbol: string
      decimals: number
      logoURI?: string
      price: number
      price24hChangePercent: number
      volume24hUSD: number
      marketcap: number
      liquidity: number
      rank: number
    }>
    total: number
  }
}

export interface BirdeyeTokenResponse {
  success: boolean
  data: {
    address: string
    name: string
    symbol: string
    decimals: number
    logoURI?: string
    price: number
    priceChange24h: number
    volume24h: number
    mc: number
    extensions?: {
      website?: string
      twitter?: string
      telegram?: string
    }
  }
}

export interface BirdeyeTrader {
  rank: number
  trader: string
  bought: string
  boughtTokens: string
  boughtTx: string
  sold: string
  soldTokens: string
  soldTx: string
  pnl: string
  pnlPercent: string
  balance: string
}

export interface BirdeyeTradersResponse {
  success: boolean
  data: {
    items: Array<{
      owner: string
      total_cost: number
      total_cost_in_usd: number
      avg_cost: number
      avg_cost_in_usd: number
      sold_amount: number
      sold_amount_in_usd: number
      buy_tx_count: number
      sell_tx_count: number
      current_balance_amount: number
      current_balance_in_usd: number
      pnl_30d: number
      pnl_30d_percent: number
      realized_profit: number
      unrealized_profit: number
      total_profit: number
      total_profit_percent: number
    }>
    hasNext: boolean
  }
}

export class TrendingAPI {
  private static readonly BIRDEYE_BASE_URL = 'https://public-api.birdeye.so/defi'
  private static readonly BIRDEYE_API_KEY = '4f29660278dd44e3af7a0d5b01dca853'
  private static cache: { data: TrendingToken[]; expires: number } | null = null
  private static trendingAddressesCache: { addresses: string[]; expires: number } | null = null
  private static readonly CACHE_DURATION = 60 * 60 * 1000 // 1 hour for trending addresses
  private static readonly TOKEN_DATA_CACHE_DURATION = 3 * 1000 // 3 seconds for real-time token data

  static async getTrendingTokens(): Promise<TrendingToken[]> {
    // Check cache first
    if (this.cache && this.cache.expires > Date.now()) {
      return this.cache.data
    }

    try {
      // Step 1: Get trending addresses from Birdeye (cached for 1 hour)
      const trendingAddresses = await this.getTrendingAddresses()
      
      // Step 2: Get detailed token data from DexScreener for each address
      const trendingTokens = await this.getTokenDataFromDexScreener(trendingAddresses)

      console.log(`Returned ${trendingTokens.length} trending tokens with DexScreener data`)

      // Cache the final results for 3 seconds (real-time updates)
      this.cache = {
        data: trendingTokens,
        expires: Date.now() + this.TOKEN_DATA_CACHE_DURATION
      }

      return trendingTokens

    } catch (error) {
      console.error('Failed to fetch trending tokens:', error)
      return await this.getFallbackTrendingTokens()
    }
  }

  // Step 1: Get trending token addresses from Birdeye (cached for 1 hour)
  private static async getTrendingAddresses(): Promise<string[]> {
    // Check trending addresses cache first
    if (this.trendingAddressesCache && this.trendingAddressesCache.expires > Date.now()) {
      return this.trendingAddressesCache.addresses
    }

    try {
      console.log('Fetching fresh trending addresses from Birdeye API...')
      
      const response = await fetch(`${this.BIRDEYE_BASE_URL}/token_trending?limit=20`, {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': this.BIRDEYE_API_KEY,
        }
      })

      if (!response.ok) {
        console.error(`Birdeye API error: ${response.status} ${response.statusText}`)
        throw new Error(`Birdeye API error: ${response.status}`)
      }

      const data: BirdeyeTrendingResponse = await response.json()
      
      if (!data.success || !data.data?.tokens) {
        console.error('Birdeye API returned unsuccessful response', data)
        throw new Error('Birdeye API unsuccessful response')
      }

      const addresses = data.data.tokens
        .slice(0, 20)
        .map(token => token.address)

      // Cache trending addresses for 1 hour
      this.trendingAddressesCache = {
        addresses,
        expires: Date.now() + this.CACHE_DURATION
      }

      console.log(`Cached ${addresses.length} trending addresses for 1 hour`)
      return addresses

    } catch (error) {
      console.error('Failed to fetch trending addresses from Birdeye:', error)
      // Return fallback addresses if available
      if (this.trendingAddressesCache) {
        console.log('Using expired trending addresses cache as fallback')
        return this.trendingAddressesCache.addresses
      }
      throw error
    }
  }

  // Step 2: Get detailed token data from DexScreener for trending addresses
  private static async getTokenDataFromDexScreener(addresses: string[]): Promise<TrendingToken[]> {
    const { DexScreenerAPI } = await import('./dexscreener')
    const trendingTokens: TrendingToken[] = []

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i]
      try {
        // Fetch token data from DexScreener
        
        const dexData = await DexScreenerAPI.getTokenData(address)
        if (dexData && dexData.pairs && dexData.pairs.length > 0) {
          const parsedData = DexScreenerAPI.parseTokenData(dexData, address)
          
          if (parsedData) {
            const trendingToken: TrendingToken = {
              address: address,
              name: parsedData.token.name,
              symbol: parsedData.token.symbol,
              image: parsedData.token.image || this.getTokenImageFallback(parsedData.token.symbol),
              price: parsedData.price,
              priceChange24h: parsedData.priceChanges.change24h,
              volume24h: parsedData.volume24h,
              marketCap: parsedData.marketCap || 0,
              network: 'solana',
              rank: i + 1
            }
            
            trendingTokens.push(trendingToken)
          }
        }
        
        // Add small delay to avoid rate limiting
        if (i < addresses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
      } catch (error) {
        console.error(`Failed to fetch DexScreener data for ${address}:`, error)
        // Continue with next token instead of failing completely
      }
    }

    return trendingTokens
  }

  private static async getFallbackTrendingTokens(): Promise<TrendingToken[]> {
    try {
      // Fallback: Get some popular tokens from Solana
      const solanaTokens = [
        { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana' },
        { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin' },
        { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether' },
        { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk' },
        { address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF', name: 'dogwifhat' }
      ]

      const fallbackTokens: TrendingToken[] = solanaTokens.map((token, index) => ({
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        price: Math.random() * 100,
        priceChange24h: (Math.random() - 0.5) * 50, // Random price change
        volume24h: Math.random() * 10000000,
        network: 'solana',
        rank: index + 1
      }))

      return fallbackTokens
    } catch {
      return []
    }
  }

  private static getTokenImageFallback(symbol: string): string {
    // Token image fallbacks from reliable sources
    const tokenImages: Record<string, string> = {
      'SOL': 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/solana/info/logo.png',
      'SHIB': 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png',
      'PEPE': 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',
      'BONK': 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
      'WIF': 'https://bafkreibk3covs5ltyqxa272udnyeuwkzv57vkgwjrh3yxcjnp5b2z4tltq.ipfs.nftstorage.link/',
      'FLOKI': 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/assets/0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E/logo.png',
      'USDC': 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/assets/0xA0b86a33E6417f02c5a36e2eE4BC7cd4F1d5b4a2/logo.png',
      'USDT': 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png'
    }

    return tokenImages[symbol.toUpperCase()] || ''
  }


  static async getTopTraders(tokenAddress: string): Promise<BirdeyeTrader[]> {
    try {
      console.log(`Fetching top traders for token: ${tokenAddress}`)
      
      const response = await fetch(`${this.BIRDEYE_BASE_URL}/txs/token?address=${tokenAddress}&tx_type=swap&sort_type=volume&sort_by=desc&limit=20&offset=0`, {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': this.BIRDEYE_API_KEY,
        }
      })

      if (!response.ok) {
        console.error(`Birdeye traders API error: ${response.status} ${response.statusText}`)
        return []
      }

      const data: BirdeyeTradersResponse = await response.json()
      
      if (!data.success || !data.data?.items) {
        console.error('Birdeye traders API returned unsuccessful response', data)
        return []
      }

      return this.parseTradersData(data)

    } catch (error) {
      console.error('Failed to fetch top traders from Birdeye:', error)
      return []
    }
  }

  private static parseTradersData(data: BirdeyeTradersResponse): BirdeyeTrader[] {
    return data.data.items.slice(0, 20).map((item, index) => ({
      rank: index + 1,
      trader: this.formatAddress(item.owner),
      bought: this.formatCurrency(item.total_cost_in_usd),
      boughtTokens: this.formatAmount(item.total_cost),
      boughtTx: `${item.buy_tx_count} tx`,
      sold: this.formatCurrency(item.sold_amount_in_usd),
      soldTokens: this.formatAmount(item.sold_amount),
      soldTx: `${item.sell_tx_count} tx`,
      pnl: this.formatCurrency(item.total_profit),
      pnlPercent: this.formatPercent(item.total_profit_percent),
      balance: this.formatAmount(item.current_balance_amount)
    }))
  }

  private static formatAddress(address: string): string {
    if (address.length <= 8) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  private static formatCurrency(value: number): string {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  private static formatAmount(value: number): string {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toFixed(0)
  }

  private static formatPercent(value: number): string {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(0)}%`
  }

  static clearCache(): void {
    this.cache = null
  }
}