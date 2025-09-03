import type { WalletTransactionResponse } from '../types'
import { retryWithBackoff, deduplicateRequest } from '../utils/api-utils'

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
      tokenAddress: string
      owner: string
      tags: string[]
      type: string
      volume: number
      trade: number
      tradeBuy: number
      tradeSell: number
      volumeBuy: number
      volumeSell: number
      isScaledUiToken: boolean
      multiplier: number | null
    }>
    hasNext: boolean
  }
}

export class TrendingAPI {
  private static readonly BIRDEYE_BASE_URL = 'https://public-api.birdeye.so/defi'
  private static readonly BIRDEYE_API_KEY = '4f29660278dd44e3af7a0d5b01dca853'
  private static cache: { data: TrendingToken[]; expires: number } | null = null
  private static trendingAddressesCache: { addresses: string[]; expires: number } | null = null
  private static tradersCache: Map<string, { data: BirdeyeTrader[]; expires: number }> = new Map()
  private static readonly CACHE_DURATION = 60 * 60 * 1000 // 1 hour for trending addresses
  private static readonly TOKEN_DATA_CACHE_DURATION = 60 * 1000 // 1 minute for token data (reduced API calls)

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

      // console.log(`Returned ${trendingTokens.length} trending tokens with DexScreener data`)

      // Cache the final results for 1 minute (reduced API calls)
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
      // console.log('Fetching fresh trending addresses from Birdeye API...')
      
      const response = await fetch(`${this.BIRDEYE_BASE_URL}/token_trending?limit=20`, {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': this.BIRDEYE_API_KEY,
        }
      })

      if (!response.ok) {
        console.error(`Birdeye API error: ${response.status} ${response.statusText}`)
        
        // Handle rate limiting gracefully
        if (response.status === 429) {
          console.log('Rate limit hit - using cached data or fallback')
          // Return cached data if available, even if expired
          if (this.trendingAddressesCache) {
            // console.log('Using expired trending addresses cache due to rate limit')
            return this.trendingAddressesCache.addresses
          }
          // If no cache, return fallback addresses
          return [
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
            'So11111111111111111111111111111111111111112',  // SOL
            'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',  // USDT
            'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
            'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'  // WIF
          ]
        }
        
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

      // console.log(`Cached ${addresses.length} trending addresses for 1 hour`)
      return addresses

    } catch (error) {
      console.error('Failed to fetch trending addresses from Birdeye:', error)
      // Return fallback addresses if available
      if (this.trendingAddressesCache) {
        // console.log('Using expired trending addresses cache as fallback')
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
    console.group(`🔍 [TRADERS API] Starting request for token: ${tokenAddress}`)
    
    // Check cache first
    const cached = this.tradersCache.get(tokenAddress)
    if (cached && cached.expires > Date.now()) {
      console.log(`✅ [CACHE HIT] Using cached traders data, expires in ${Math.round((cached.expires - Date.now()) / 1000)}s`)
      console.groupEnd()
      return cached.data
    }
    console.log(`❌ [CACHE MISS] No valid cache found, making API request`)

    try {
      // Enhanced token address validation
      console.log(`🧪 [VALIDATION] Token address: "${tokenAddress}"`)
      console.log(`🧪 [VALIDATION] Address length: ${tokenAddress?.length || 0}`)
      console.log(`🧪 [VALIDATION] Address type: ${typeof tokenAddress}`)
      
      if (!tokenAddress || tokenAddress.length < 32) {
        console.warn(`❌ [VALIDATION FAILED] Invalid token address, using mock data`)
        console.log(`📝 [FALLBACK] Returning mock traders data`)
        console.groupEnd()
        return this.getMockTraders()
      }
      console.log(`✅ [VALIDATION PASSED] Token address is valid`)

      const apiUrl = `${this.BIRDEYE_BASE_URL}/v2/tokens/top_traders?address=${tokenAddress}&network=solana&limit=10`
      console.log(`🌐 [REQUEST] URL: ${apiUrl}`)
      console.log(`🔑 [REQUEST] API Key: ${this.BIRDEYE_API_KEY.substring(0, 8)}...${this.BIRDEYE_API_KEY.substring(-4)}`)
      
      const startTime = Date.now()
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'X-API-KEY': this.BIRDEYE_API_KEY,
        }
      })
      
      const responseTime = Date.now() - startTime
      console.log(`⏱️ [TIMING] Request completed in ${responseTime}ms`)
      console.log(`📊 [RESPONSE] Status: ${response.status} ${response.statusText}`)
      console.log(`📊 [RESPONSE] Headers:`, Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        console.error(`🚨 [ERROR] Birdeye traders API error: ${response.status} ${response.statusText}`)
        
        // Try to get the error response body
        let errorBody = null
        try {
          errorBody = await response.text()
          console.error(`🚨 [ERROR BODY] Raw response:`, errorBody)
          
          // Try to parse as JSON
          try {
            const errorJson = JSON.parse(errorBody)
            console.error(`🚨 [ERROR JSON] Parsed response:`, errorJson)
          } catch {
            console.error(`🚨 [ERROR] Response is not valid JSON`)
          }
        } catch (e) {
          console.error(`🚨 [ERROR] Could not read response body:`, e)
        }
        
        // Handle specific error codes
        if (response.status === 401) {
          console.warn(`🔐 [AUTH ERROR] Authentication failed - API key invalid or expired`)
          const mockData = this.getMockTraders()
          console.log(`📝 [FALLBACK] Using mock traders data (${mockData.length} items)`)
          console.groupEnd()
          return mockData
        }
        
        if (response.status === 400) {
          console.warn(`📝 [BAD REQUEST] Invalid request parameters`)
          console.warn(`📝 [DEBUG] Token address: ${tokenAddress}`)
          console.warn(`📝 [DEBUG] Request URL: ${apiUrl}`)
          const mockData = this.getMockTraders()
          console.log(`📝 [FALLBACK] Using mock traders data (${mockData.length} items)`)
          console.groupEnd()
          return mockData
        }
        
        if (response.status === 429) {
          console.warn(`⏳ [RATE LIMIT] Too many requests - backing off`)
          const mockData = this.getMockTraders()
          console.log(`📝 [FALLBACK] Using mock traders data (${mockData.length} items)`)
          console.groupEnd()
          return mockData
        }
        
        console.error(`❌ [UNHANDLED ERROR] Status ${response.status} - returning empty array`)
        console.groupEnd()
        return []
      }
      
      console.log(`✅ [SUCCESS] Response OK, parsing data...`)

      const data: BirdeyeTradersResponse = await response.json()
      console.log(`📦 [DATA] Raw API response:`, data)
      console.log(`📦 [DATA] Response structure:`, {
        success: data?.success,
        hasData: !!data?.data,
        hasItems: !!data?.data?.items,
        itemsLength: data?.data?.items?.length || 0
      })
      
      if (!data.success || !data.data?.items) {
        console.error(`❌ [DATA ERROR] Invalid response structure`)
        console.error(`❌ [DATA ERROR] Success: ${data?.success}`)
        console.error(`❌ [DATA ERROR] Has data: ${!!data?.data}`)
        console.error(`❌ [DATA ERROR] Has items: ${!!data?.data?.items}`)
        console.error(`📝 [FALLBACK] Using mock traders data`)
        const mockData = this.getMockTraders()
        console.groupEnd()
        return mockData
      }

      const traders = this.parseTradersData(data)
      console.log(`🏆 [SUCCESS] Parsed ${traders.length} traders`)
      console.log(`💾 [CACHE] Caching traders data for 5 minutes`)
      
      // Cache the results for 5 minutes
      this.tradersCache.set(tokenAddress, {
        data: traders,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
      })

      console.groupEnd()
      return traders

    } catch (error) {
      console.error(`🔥 [EXCEPTION] Unexpected error in getTopTraders:`, error)
      
      if (error instanceof Error) {
        console.error(`🔥 [EXCEPTION] Error name: ${error.name}`)
        console.error(`🔥 [EXCEPTION] Error message: ${error.message}`)
        console.error(`🔥 [EXCEPTION] Stack trace:`, error.stack)
      } else {
        console.error(`🔥 [EXCEPTION] Unknown error type:`, typeof error)
        console.error(`🔥 [EXCEPTION] Error value:`, error)
      }
      
      const mockData = this.getMockTraders()
      console.log(`📝 [EXCEPTION FALLBACK] Using mock traders data (${mockData.length} items)`)
      console.log(`💾 [CACHE] Caching mock data for 1 minute to reduce error spam`)
      
      // Cache mock data for 1 minute to reduce error spam
      this.tradersCache.set(tokenAddress, {
        data: mockData,
        expires: Date.now() + 60 * 1000 // 1 minute
      })
      
      console.groupEnd()
      return mockData
    }
  }

  private static getMockTraders(): BirdeyeTrader[] {
    return [
      {
        rank: 1,
        trader: "DCjuur...Ljbi",
        bought: "$2,197",
        boughtTokens: "19.79M",
        boughtTx: "4 tx",
        sold: "$14.2K",
        soldTokens: "19.79M",
        soldTx: "2 tx",
        pnl: "$12K",
        pnlPercent: "+547%",
        balance: "19.8M",
      },
      {
        rank: 2,
        trader: "6Tvwam...3vzZ",
        bought: "$1,145",
        boughtTokens: "9.482M",
        boughtTx: "3 tx",
        sold: "$10K",
        soldTokens: "9.482M",
        soldTx: "3 tx",
        pnl: "$8,887",
        pnlPercent: "+776%",
        balance: "9.48M",
      },
      {
        rank: 3,
        trader: "Ca3pTj...ZL2R",
        bought: "$1,433",
        boughtTokens: "18.97M",
        boughtTx: "2 tx",
        sold: "$9,401",
        soldTokens: "8.889M",
        soldTx: "6 tx",
        pnl: "$8,730",
        pnlPercent: "+131%",
        balance: "19M",
      },
      {
        rank: 4,
        trader: "3K4mKD...KBVg",
        bought: "$460",
        boughtTokens: "28.52M",
        boughtTx: "1 tx",
        sold: "$8,584",
        soldTokens: "28.52M",
        soldTx: "6 tx",
        pnl: "$8,124",
        pnlPercent: "+177%",
        balance: "28.5M",
      },
      {
        rank: 5,
        trader: "GHH3Rk...wG9D",
        bought: "$1,624",
        boughtTokens: "9.531M",
        boughtTx: "5 tx",
        sold: "$8,714",
        soldTokens: "8.531M",
        soldTx: "8 tx",
        pnl: "$7,260",
        pnlPercent: "+499%",
        balance: "9.53M",
      },
    ]
  }

  private static parseTradersData(data: BirdeyeTradersResponse): BirdeyeTrader[] {
    console.log(`🔄 [PARSE] Processing ${data.data.items.length} trader items`)
    
    return data.data.items.slice(0, 10).map((item, index) => {
      // Generate mock current balance in USD for now
      const mockBalanceUSD = Math.round(Math.random() * 100000)
      
      const trader = {
        rank: index + 1,
        trader: item.owner, // Full wallet address, will be formatted in UI
        bought: this.formatCurrency(item.volumeBuy), // Buy volume in USD
        boughtTokens: `${item.tradeBuy.toLocaleString()}`, // Number of buy transactions
        boughtTx: `${item.tradeBuy} txs`,
        sold: this.formatCurrency(item.volumeSell), // Sell volume in USD
        soldTokens: `${item.tradeSell.toLocaleString()}`, // Number of sell transactions
        soldTx: `${item.tradeSell} txs`,
        pnl: this.formatCurrency(item.volume), // Total volume (buy + sell)
        pnlPercent: this.formatCurrency(mockBalanceUSD), // Current balance in USD (mock)
        balance: `${item.tradeBuy + item.tradeSell} txs` // Total transactions
      }
      
      if (index === 0) {
        console.log(`📊 [PARSE] Sample parsed trader:`, JSON.stringify(trader, null, 2))
      }
      
      return trader
    })
  }


  private static formatCurrency(value: number): string {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }



  static clearCache(): void {
    this.cache = null
  }

  /**
   * Get wallet transactions for a specific token
   */
  static async getWalletTransactions(wallet: string, mint: string): Promise<WalletTransactionResponse> {
    console.group(`🔍 [WALLET TRANSACTIONS API] Starting request for wallet: ${wallet}`)
    
    // Validate wallet address format
    if (!wallet || wallet.length < 32) {
      console.error(`❌ [VALIDATION] Invalid wallet address: ${wallet}`)
      console.groupEnd()
      return this.getMockWalletTransactions()
    }

    // Validate mint address format
    if (!mint || mint.length < 32) {
      console.error(`❌ [VALIDATION] Invalid mint address: ${mint}`)
      console.groupEnd()
      return this.getMockWalletTransactions()
    }

    console.log(`✅ [VALIDATION PASSED] Addresses are valid`)

    const requestKey = `wallet-txs-${wallet}-${mint}`

    return deduplicateRequest(requestKey, async () => {
      return retryWithBackoff(async () => {
        console.log(`📋 Request Parameters:`)
        console.log(`  • Wallet Address: ${wallet}`)
        console.log(`  • Token Mint: ${mint}`)
        console.log(`  • Network: solana`)
        console.log(`  • Limit: 100`)

        const apiUrl = `${this.BIRDEYE_BASE_URL}/v2/tokens/transactions?address=${mint}&wallet=${wallet}&network=solana&limit=100`
        console.log(`🌐 [REQUEST] URL: ${apiUrl}`)
        console.log(`🔑 [REQUEST] API Key: ${this.BIRDEYE_API_KEY.substring(0, 8)}...${this.BIRDEYE_API_KEY.substring(-4)}`)
        
        const startTime = Date.now()
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'X-API-KEY': this.BIRDEYE_API_KEY,
          }
        })
        
        const requestTime = Date.now() - startTime
        console.log(`📊 Response Status: ${response.status} ${response.statusText}`)
        console.log(`⏱️ Request Time: ${requestTime.toFixed(2)}ms`)

        if (!response.ok) {
          console.error(`❌ HTTP Error Response:`)
          console.error(`  • Status: ${response.status}`)
          console.error(`  • Status Text: ${response.statusText}`)
          console.error(`  • URL: ${response.url}`)
          
          // Create error object with status for retry logic
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
          ;(error as any).status = response.status
          ;(error as any).response = { status: response.status, headers: response.headers }
          
          try {
            const errorText = await response.text()
            console.error(`  • Response Body: ${errorText}`)
          } catch (bodyError) {
            console.error(`  • Could not read response body:`, bodyError)
          }

          if (response.status === 400) {
            console.error(`🔧 Bad Request - Check wallet and mint address parameters`)
          } else if (response.status === 401) {
            console.error(`🔐 Unauthorized - Check API key`)
          } else if (response.status === 429) {
            console.error(`🚦 Rate Limited - Will retry with backoff`)
          }
          
          throw error
        }

        const data: WalletTransactionResponse = await response.json()
        console.log(`📦 [DATA] Raw API response:`, data)
        console.log(`📦 [DATA] Response structure:`, {
          success: data?.success,
          hasData: !!data?.data,
          hasItems: !!data?.data?.items,
          itemsLength: data?.data?.items?.length || 0
        })
        
        if (!data.success || !data.data?.items) {
          console.error(`❌ [DATA ERROR] Invalid response structure`)
          console.error(`❌ [DATA ERROR] Success: ${data?.success}`)
          console.error(`❌ [DATA ERROR] Has data: ${!!data?.data}`)
          console.error(`❌ [DATA ERROR] Has items: ${!!data?.data?.items}`)
          throw new Error('Invalid response structure')
        }

        console.log(`✅ Successfully retrieved ${data.data.items.length} transactions`)
        console.log(`⏱️ Total processing time: ${(Date.now() - startTime).toFixed(2)}ms`)
        console.groupEnd()
        return data

      }, { maxRetries: 3, baseDelay: 2000, maxDelay: 30000 })
        .catch((error) => {
          console.error(`💥 All retries failed:`)
          
          if (error instanceof Error) {
            console.error(`  • Error Name: ${error.name}`)
            console.error(`  • Error Message: ${error.message}`)
          } else {
            console.error(`  • Unknown error type:`, typeof error)
            console.error(`  • Error value:`, error)
          }
          
          // Check for specific error types
          if (error instanceof TypeError && error.message.includes('fetch')) {
            console.error(`🌐 Network Error Detected - likely connectivity issue`)
          } else if (error instanceof SyntaxError) {
            console.error(`📝 JSON Parsing Error - invalid response format`)
          }
          
          console.log('🔄 Falling back to mock data due to retry failure')
          console.groupEnd()
          return this.getMockWalletTransactions()
        })
    })
  }

  /**
   * Mock wallet transactions for testing and fallback
   */
  private static getMockWalletTransactions(): WalletTransactionResponse {
    return {
      success: true,
      data: {
        items: [
          {
            txHash: "5J8...",
            blockTime: Date.now() - 86400000, // 1 day ago
            side: 'buy',
            tokenAmount: 1000,
            quoteAmount: 10,
            price: 0.01,
            fee: 0.05,
            source: 'Raydium'
          },
          {
            txHash: "3K9...",
            blockTime: Date.now() - 43200000, // 12 hours ago
            side: 'buy',
            tokenAmount: 2000,
            quoteAmount: 30,
            price: 0.015,
            fee: 0.10,
            source: 'Raydium'
          },
          {
            txHash: "7L2...",
            blockTime: Date.now() - 21600000, // 6 hours ago
            side: 'sell',
            tokenAmount: 500,
            quoteAmount: 10,
            price: 0.02,
            fee: 0.05,
            source: 'Raydium'
          }
        ],
        hasNext: false
      }
    }
  }
}