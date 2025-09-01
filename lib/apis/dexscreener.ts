export interface DexScreenerToken {
  address: string
  name: string
  symbol: string
}

export interface DexScreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: DexScreenerToken
  quoteToken: DexScreenerToken
  priceNative: string
  priceUsd?: string
  txns: {
    m5: { buys: number; sells: number }
    h1: { buys: number; sells: number }
    h6: { buys: number; sells: number }
    h24: { buys: number; sells: number }
  }
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  liquidity?: {
    usd?: number
    base: number
    quote: number
  }
  fdv?: number
  marketCap?: number
  pairCreatedAt?: number
  info?: {
    imageUrl?: string
    header?: string
    openGraph?: string
    websites?: Array<{ label: string; url: string }>
    socials?: Array<{ type: string; url: string }>
  }
}

export interface DexScreenerResponse {
  schemaVersion: string
  pairs: DexScreenerPair[] | null
}

export class DexScreenerAPI {
  private static readonly BASE_URL = 'https://api.dexscreener.com/latest/dex'

  static async getTokenData(address: string): Promise<DexScreenerResponse | null> {
    try {
      const url = `${this.BASE_URL}/tokens/${address}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`DexScreener API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('DexScreener API request failed:', error)
      return null
    }
  }

  static async getPairData(pairAddress: string): Promise<DexScreenerResponse | null> {
    try {
      const url = `${this.BASE_URL}/pairs/${pairAddress}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`DexScreener API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('DexScreener API request failed:', error)
      return null
    }
  }

  static parseTokenData(data: DexScreenerResponse, tokenAddress: string) {
    if (!data.pairs || data.pairs.length === 0) return null

    // Find the most liquid pair for this token
    const relevantPairs = data.pairs.filter(pair => 
      pair.baseToken.address.toLowerCase() === tokenAddress.toLowerCase() ||
      pair.quoteToken.address.toLowerCase() === tokenAddress.toLowerCase()
    )

    if (relevantPairs.length === 0) return null

    // Sort by liquidity and take the most liquid pair
    const primaryPair = relevantPairs.sort((a, b) => 
      (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0]

    const isBaseToken = primaryPair.baseToken.address.toLowerCase() === tokenAddress.toLowerCase()
    const token = isBaseToken ? primaryPair.baseToken : primaryPair.quoteToken

    // Extract social links
    const socials = primaryPair.info?.socials?.reduce((acc, social) => {
      switch (social.type.toLowerCase()) {
        case 'twitter':
          acc.twitter = social.url
          break
        case 'telegram':
          acc.telegram = social.url
          break
        case 'discord':
          acc.discord = social.url
          break
      }
      return acc
    }, {} as Record<string, string>) || {}

    // Extract website
    const website = primaryPair.info?.websites?.[0]?.url

    return {
      token: {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        image: primaryPair.info?.imageUrl
      },
      price: parseFloat(primaryPair.priceUsd || '0'),
      marketCap: primaryPair.marketCap,
      liquidity: primaryPair.liquidity?.usd,
      volume24h: primaryPair.volume.h24,
      priceChanges: {
        change5m: primaryPair.priceChange.m5,
        change1h: primaryPair.priceChange.h1,
        change6h: primaryPair.priceChange.h6,
        change24h: primaryPair.priceChange.h24
      },
      socials: {
        website,
        ...socials
      },
      // Additional token info from primary pair
      totalSupply: primaryPair.fdv ? primaryPair.fdv / parseFloat(primaryPair.priceUsd || '1') : undefined,
      pairCreated: primaryPair.pairCreatedAt ? DexScreenerAPI.formatPairCreatedDate(primaryPair.pairCreatedAt) : undefined,
      pools: relevantPairs.map(pair => ({
        pairAddress: pair.pairAddress,
        pairCreated: pair.pairCreatedAt ? DexScreenerAPI.formatPairCreatedDate(pair.pairCreatedAt) : '',
        baseToken: {
          address: pair.baseToken.address,
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          amount: pair.liquidity?.base.toString() || '0'
        },
        quoteToken: {
          address: pair.quoteToken.address,
          name: pair.quoteToken.name,
          symbol: pair.quoteToken.symbol,
          amount: pair.liquidity?.quote.toString() || '0'
        },
        liquidity: pair.liquidity?.usd || 0
      }))
    }
  }

  private static formatPairCreatedDate(timestamp: number): string {
    try {
      // DexScreener timestamps are usually in seconds, but let's handle both cases
      let date: Date
      
      // If timestamp is in seconds (less than year 2100 when converted from seconds)
      if (timestamp < 4000000000) {
        date = new Date(timestamp * 1000)
      } else {
        // Already in milliseconds
        date = new Date(timestamp)
      }
      
      // Validate the date is reasonable (after 2020 and before 2030)
      if (date.getFullYear() < 2020 || date.getFullYear() > 2030) {
        console.warn('Invalid pair creation date:', timestamp, 'parsed as:', date)
        return new Date().toISOString() // Fallback to current date
      }
      
      return date.toISOString()
    } catch (error) {
      console.error('Error parsing pair creation date:', timestamp, error)
      return new Date().toISOString()
    }
  }
}