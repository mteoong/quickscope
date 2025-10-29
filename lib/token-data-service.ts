import { TokenData, TokenSecurity, TokenSocials, PriceChanges, PoolData, TraderData } from './types'
import { GoPlusAPI } from './apis/goplus'
import { DexScreenerAPI } from './apis/dexscreener'
import { HeliusAPI } from './apis/helius'
import { TrendingAPI } from './apis/trending'
import { BirdeyeAPI } from './apis/birdeye'
// import { getUpdateRate } from './config/api-config' // Commented out for debugging

export class TokenDataService {
  private static cache = new Map<string, { data: TokenData; expires: number }>()
  private static readonly CACHE_DURATION = 3 * 60 * 1000 // 3 minutes

  static async getTokenData(address: string, network: string = 'solana'): Promise<TokenData> {
    // Check cache first
    const cacheKey = `${address}-${network}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }

    // Initialize with loading state
    const tokenData: TokenData = {
      address,
      name: '',
      symbol: '',
      price: 0,
      priceChanges: {
        change5m: 0,
        change1h: 0,
        change6h: 0,
        change24h: 0
      },
      security: {
        honeypot: false,
        buyTax: 0,
        sellTax: 0,
        blacklist: false,
        noMint: false,
        canBurn: false,
        isProxy: false,
        hasRenounced: false
      },
      socials: {},
      pools: [],
      network,
      fetchedAt: Date.now(),
      isLoading: true
    }

    try {
      // Fetch data from multiple sources in parallel
      const [dexScreenerData, goPlusData, heliusData] = await Promise.allSettled([
        DexScreenerAPI.getTokenData(address),
        network === 'solana' ? GoPlusAPI.getSolanaTokenSecurity(address) : Promise.resolve(null),
        network === 'solana' ? HeliusAPI.getTokenMetadata(address) : Promise.resolve(null)
      ])

      // Process DexScreener data
      if (dexScreenerData.status === 'fulfilled' && dexScreenerData.value) {
        const parsedDexData = DexScreenerAPI.parseTokenData(dexScreenerData.value, address)
        if (parsedDexData) {
          tokenData.name = parsedDexData.token.name
          tokenData.symbol = parsedDexData.token.symbol
          tokenData.image = parsedDexData.token.image
          tokenData.price = parsedDexData.price
          tokenData.marketCap = parsedDexData.marketCap
          tokenData.liquidity = parsedDexData.liquidity
          tokenData.volume24h = parsedDexData.volume24h
          tokenData.priceChanges = parsedDexData.priceChanges
          tokenData.socials = parsedDexData.socials
          tokenData.pools = parsedDexData.pools
          
          // Additional token info
          tokenData.totalSupply = parsedDexData.totalSupply
          tokenData.pairCreated = parsedDexData.pairCreated
        }
      }

      // Process GoPlus security data
      if (goPlusData.status === 'fulfilled' && goPlusData.value) {
        const parsedSecurityData = GoPlusAPI.parseSecurityData(goPlusData.value, address)
        if (parsedSecurityData) {
          tokenData.security = {
            ...tokenData.security,
            ...parsedSecurityData
          }
          // Also update token metadata from GoPlus if available
          if (parsedSecurityData.supply && !tokenData.totalSupply) {
            tokenData.totalSupply = parseFloat(parsedSecurityData.supply)
          }
          // Update creator info from GoPlus if available
          if (parsedSecurityData.creator && !tokenData.creator) {
            tokenData.creator = parsedSecurityData.creator
          }
        }
      }

      // Process Helius data (Solana only) - for creator and mint info
      if (network === 'solana' && heliusData.status === 'fulfilled' && heliusData.value) {
        const parsedHeliusData = HeliusAPI.parseTokenMetadata(heliusData.value)
        if (parsedHeliusData) {
          tokenData.totalSupply = parsedHeliusData.totalSupply
          tokenData.creator = parsedHeliusData.mintAuthority
          // Update security data with Helius info
          if (tokenData.security) {
            tokenData.security.noMint = parsedHeliusData.noMint
          }
        }
      }

      // Get holder count from Birdeye API
      if (network === 'solana' && !tokenData.holderCount) {
        try {
          const holdersData = await BirdeyeAPI.getTokenHolders(address, 1) // Only need 1 holder to get totalHolders
          if (holdersData.totalHolders > 0) {
            tokenData.holderCount = holdersData.totalHolders
          }
        } catch (error) {
          // Silently fail if holder count cannot be fetched
        }
      }

      // If we couldn't get basic token info, try to get it from token metadata
      if (!tokenData.name || !tokenData.symbol) {
        const metadataResult = await this.getTokenMetadata(address, network)
        if (metadataResult) {
          tokenData.name = (metadataResult as any).name || tokenData.name
          tokenData.symbol = (metadataResult as any).symbol || tokenData.symbol
          tokenData.image = (metadataResult as any).image || tokenData.image
          tokenData.totalSupply = (metadataResult as any).totalSupply
        }
      }


      tokenData.isLoading = false
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: tokenData,
        expires: Date.now() + this.CACHE_DURATION
      })

      return tokenData

    } catch (error) {
      console.error('Error fetching token data:', error)
      tokenData.isLoading = false
      tokenData.error = error instanceof Error ? error.message : 'Unknown error'
      return tokenData
    }
  }

  private static async getTokenMetadata(address: string, network: string) {
    try {
      if (network === 'solana') {
        return await this.getSolanaTokenMetadata(address)
      } else {
        return await this.getEthereumTokenMetadata(address, network)
      }
    } catch (error) {
      console.error('Error fetching token metadata:', error)
      return null
    }
  }

  private static async getSolanaTokenMetadata(address: string) {
    try {
      // For Solana, we could use Jupiter API or Solana RPC
      // This is a placeholder - you'd implement actual Solana metadata fetching
      const response = await fetch(`https://api.jupiter.ag/quote?inputMint=${address}&outputMint=So11111111111111111111111111111111111111112&amount=1000000`)
      
      if (!response.ok) return null
      
      // This is just an example - Jupiter API doesn't provide metadata directly
      // You'd need to use Metaplex or similar for actual metadata
      return null
    } catch {
      return null
    }
  }

  private static async getEthereumTokenMetadata(_address: string, network: string) {
    try {
      // For Ethereum, you could use Moralis, Alchemy, or direct RPC calls
      // This is a placeholder implementation
      const rpcUrls: Record<string, string> = {
        ethereum: 'https://eth.llamarpc.com',
        polygon: 'https://polygon.llamarpc.com',
        arbitrum: 'https://arbitrum.llamarpc.com'
      }

      const rpcUrl = rpcUrls[network]
      if (!rpcUrl) return null

      // Get token name, symbol, decimals via RPC calls
      // This would require implementing proper RPC calls
      // For now, return null to use DexScreener data
      return null
    } catch {
      return null
    }
  }

  static async refreshTokenData(address: string, network: string = 'solana'): Promise<TokenData> {
    // Clear cache and fetch fresh data
    const cacheKey = `${address}-${network}`
    this.cache.delete(cacheKey)
    return this.getTokenData(address, network)
  }

  static clearCache(): void {
    this.cache.clear()
  }

  static getCachedTokenData(address: string, network: string = 'solana'): TokenData | null {
    const cacheKey = `${address}-${network}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    return null
  }

  static async getTokenLargestAccounts(address: string, network: string = 'solana') {
    try {
      if (network !== 'solana') {
        return []
      }

      // Get current token data for price and total supply calculation
      const tokenData = await this.getTokenData(address, network)
      const tokenPrice = tokenData.price || 0
      const totalSupply = tokenData.totalSupply || 0

      // Use Helius RPC getTokenLargestAccounts method for more reliable data
      const holdersData = await HeliusAPI.getTokenLargestAccounts(address, 20)

      if (!holdersData || holdersData.length === 0) {
        return []
      }

      // Parse the Helius holders data using the existing parser
      const parsedHolders = HeliusAPI.parseHoldersData(holdersData, tokenPrice, totalSupply)

      return parsedHolders
    } catch (error) {
      console.error('Error fetching token largest accounts from Helius:', error)
      return []
    }
  }

  private static formatTokenAmount(amount: number): string {
    if (amount >= 1000000000000) return `${(amount / 1000000000000).toFixed(2)}T`
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(2)}B`
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    if (amount >= 1) return amount.toFixed(2)
    if (amount >= 0.01) return amount.toFixed(4)
    if (amount > 0) return amount.toFixed(6)
    return '0'
  }

  static async getTokenTransactions(address: string, network: string = 'solana', limit: number = 50) {
    try {
      if (network !== 'solana') {
        return []
      }

      const transactions = await HeliusAPI.getTokenTransactions(address, limit)
      return transactions

    } catch (error) {
      console.error('Error fetching token transactions:', error)
      return []
    }
  }

  static async getTopTraders(address: string): Promise<TraderData[]> {
    try {
      const tradersData = await TrendingAPI.getTopTraders(address)
      return tradersData.map(trader => ({
        rank: trader.rank,
        trader: trader.trader,
        bought: trader.bought,
        boughtTokens: trader.boughtTokens,
        boughtTx: trader.boughtTx,
        sold: trader.sold,
        soldTokens: trader.soldTokens,
        soldTx: trader.soldTx,
        pnl: trader.pnl,
        pnlPercent: trader.pnlPercent,
        balance: trader.balance
      }))
    } catch (error) {
      console.error('Error fetching top traders:', error)
      return []
    }
  }
}