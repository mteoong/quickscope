export interface RugCheckTokenInfo {
  mintAuthority: string | null
  supply: string
  decimals: number
  isInitialized: boolean
  freezeAuthority: string | null
}

export interface RugCheckTokenMeta {
  name: string
  symbol: string
  uri: string
  mutable: boolean
  updateAuthority: string
}

export interface RugCheckTopHolder {
  address: string
  amount: string
  decimals: number
  pct: number
  uiAmount: number
  uiAmountString: string
  owner: string
  insider: boolean
}

export interface RugCheckResponse {
  mint: string
  tokenProgram: string
  creator: string
  creatorBalance: number
  token: RugCheckTokenInfo
  token_extensions: any
  tokenMeta: RugCheckTokenMeta
  topHolders: RugCheckTopHolder[]
}

export class RugCheckAPI {
  private static readonly BASE_URL = 'https://api.rugcheck.xyz/v1'

  static async getTokenReport(address: string): Promise<RugCheckResponse | null> {
    try {
      const url = `${this.BASE_URL}/tokens/${address}/report`
      console.log('[RugCheck] Fetching token report from:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`RugCheck API error: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.error('RugCheck error response:', errorText)
        return null
      }

      const data = await response.json()
      console.log('[RugCheck] Received token report:', data)
      return data
    } catch (error) {
      console.error('RugCheck API request failed:', error)
      return null
    }
  }

  static parseSecurityData(data: RugCheckResponse) {
    if (!data || !data.token) return null

    // Calculate security metrics from RugCheck data
    const token = data.token
    const tokenMeta = data.tokenMeta
    
    // Security flags based on RugCheck data
    const noMint = token.mintAuthority === null
    const noFreeze = token.freezeAuthority === null
    const immutableMetadata = !tokenMeta.mutable
    
    // Calculate concentration risk from top holders
    const topHoldersConcentration = data.topHolders?.slice(0, 10).reduce((sum, holder) => sum + holder.pct, 0) || 0
    const hasHighConcentration = topHoldersConcentration > 50 // Top 10 holders own > 50%
    
    // Check if creator still holds significant amount
    const creatorHolding = data.topHolders?.find(holder => holder.owner === data.creator)
    const creatorHoldsPct = creatorHolding?.pct || 0
    const creatorDumped = creatorHoldsPct < 1 // Less than 1% remaining
    
    return {
      // Core security flags
      honeypot: false, // RugCheck doesn't directly detect honeypots, but we can infer
      buyTax: 0, // RugCheck doesn't provide tax info
      sellTax: 0, // RugCheck doesn't provide tax info
      blacklist: false, // RugCheck doesn't provide blacklist info
      noMint: noMint,
      canBurn: !noFreeze, // If freeze authority exists, tokens can be frozen/burned
      isProxy: false, // RugCheck doesn't provide proxy info
      hasRenounced: noMint && noFreeze, // Both authorities renounced
      
      // Additional RugCheck specific data
      isInitialized: token.isInitialized,
      immutableMetadata: immutableMetadata,
      topHoldersConcentration: topHoldersConcentration,
      hasHighConcentration: hasHighConcentration,
      creatorHoldsPct: creatorHoldsPct,
      creatorDumped: creatorDumped,
      totalSupply: parseInt(token.supply) / Math.pow(10, token.decimals),
      decimals: token.decimals,
      
      // Metadata
      name: tokenMeta.name,
      symbol: tokenMeta.symbol,
      updateAuthority: tokenMeta.updateAuthority
    }
  }
}