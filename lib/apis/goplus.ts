import { createHash } from 'crypto'
import { retryWithBackoff } from '../utils/api-utils'

interface GoPlusAuthResponse {
  code: number
  message: string
  result: {
    access_token: string
  }
}

interface GoPlusTokenSecurityResponse {
  code: number
  message: string
  result: {
    [mint: string]: {
      // Core security flags
      honeypot?: boolean | string
      can_sell?: boolean | string
      buy_tax?: string
      sell_tax?: string
      blacklist?: boolean | string
      
      // Authority information
      mint_authority?: string | null
      freeze_authority?: string | null
      
      // Additional fields that may be present
      is_mintable?: boolean | string
      is_freezable?: boolean | string
      supply?: string
      decimals?: number
      
      // Transfer restrictions
      transfer_pausable?: boolean | string
      can_take_back_ownership?: boolean | string
      
      // Ownership info
      owner_change_balance?: boolean | string
      hidden_owner?: boolean | string
      
      // Other potential fields
      proxy_contract?: boolean | string
      external_call?: boolean | string
      gas_abuse?: boolean | string
      
      // Creator information
      creators?: Array<{
        address: string
        malicious_address: number
      }>
      creator_address?: string
      creator_balance?: string
      creator_percent?: string
    }
  }
}

export class GoPlusAPI {
  private static readonly BASE_URL = 'https://api.gopluslabs.io/api/v1'
  private static accessTokenCache: { token: string; expires: number } | null = null
  // Removed security cache - fetch fresh data each time
  private static readonly TOKEN_TTL = 5 * 60 * 1000 // 5 minutes
  private static readonly SECURITY_CACHE_TTL = 15 * 60 * 1000 // 15 minutes

  private static getEnvVars() {
    return {
      appKey: "E3KzRxmtSbS0s2ZTHXrr",
      appSecret: "KEy1Pr12sfjZKkQk6s2rgWWQCG5QBG7m"
    }
  }

  private static generateSignature(appKey: string, time: string, appSecret: string): string {
    const data = appKey + time + appSecret
    return createHash('sha1').update(data).digest('hex').toLowerCase()
  }

  static async getGoPlusAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessTokenCache && this.accessTokenCache.expires > Date.now()) {
      console.log('[GoPlus] Using cached access token')
      return this.accessTokenCache.token
    }

    console.log('[GoPlus] Fetching new access token')
    
    const { appKey, appSecret } = this.getEnvVars()
    const time = Math.floor(Date.now() / 1000).toString()
    const sign = this.generateSignature(appKey, time, appSecret)

    const response = await fetch(`${this.BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        app_key: appKey,
        time,
        sign
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[GoPlus] Auth error: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`GoPlus auth failed: ${response.status} ${response.statusText}`)
    }

    const data: GoPlusAuthResponse = await response.json()
    
    if (data.code !== 1) {
      console.error('[GoPlus] Auth response error:', data)
      throw new Error(`GoPlus auth failed: ${data.message}`)
    }

    console.log('[GoPlus] Successfully obtained access token')
    
    // Cache the token with TTL
    this.accessTokenCache = {
      token: data.result.access_token,
      expires: Date.now() + this.TOKEN_TTL
    }

    return data.result.access_token
  }

  private static getMockSecurityData(mint: string): GoPlusTokenSecurityResponse {
    console.log('[GoPlus] Providing mock security data for', mint)
    return {
      code: 1,
      message: 'success',
      result: {
        [mint]: {
          honeypot: false,
          can_sell: true,
          buy_tax: '2.5',
          sell_tax: '2.5', 
          blacklist: false,
          mint_authority: null,
          freeze_authority: null,
          is_mintable: false,
          is_freezable: false,
          proxy_contract: false,
          transfer_pausable: false,
          can_take_back_ownership: false,
          hidden_owner: false,
          external_call: false,
          gas_abuse: false,
        }
      }
    }
  }

  static async getSolanaTokenSecurity(mints: string | string[]): Promise<any> {
    const mintArray = Array.isArray(mints) ? mints : [mints]
    const mintString = mintArray.join(',')
    
    console.log('[GoPlus] Fetching fresh security data for mints:', mintString)

    return retryWithBackoff(async () => {
      let accessToken: string
      
      try {
        accessToken = await this.getGoPlusAccessToken()
      } catch (error) {
        console.error('[GoPlus] Failed to get access token:', error)
        throw error
      }

      const url = `${this.BASE_URL}/solana/token_security?contract_addresses=${encodeURIComponent(mintString)}`
      console.log('[GoPlus] Fetching from URL:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': accessToken,  // Just the token, no "Bearer" prefix
          'Accept': 'application/json',
        }
      })

      // Handle 401 - token expired, refresh once and retry
      if (response.status === 401) {
        console.log('[GoPlus] Access token expired, refreshing...')
        this.accessTokenCache = null // Clear cache
        accessToken = await this.getGoPlusAccessToken()
        
        // Retry with new token
        const retryResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': accessToken,  // Just the token, no "Bearer" prefix
            'Accept': 'application/json',
          }
        })
        
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text()
          console.error(`[GoPlus] Retry failed: ${retryResponse.status} ${retryResponse.statusText}`, errorText)
          const error = new Error(`GoPlus API error: ${retryResponse.status} ${retryResponse.statusText}`)
          ;(error as any).status = retryResponse.status
          throw error
        }
        
        const retryData: GoPlusTokenSecurityResponse = await retryResponse.json()
        return retryData
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[GoPlus] API error: ${response.status} ${response.statusText}`, errorText)
        
        // Create error with status for retry logic
        const error = new Error(`GoPlus API error: ${response.status} ${response.statusText}`)
        ;(error as any).status = response.status
        throw error
      }

      const data: GoPlusTokenSecurityResponse = await response.json()
      console.log('[GoPlus] Raw security response:', JSON.stringify(data, null, 2))
      
      if (data.code !== 1) {
        console.error('[GoPlus] API response error:', data)
        throw new Error(`GoPlus API error: ${data.message}`)
      }

      console.log('[GoPlus] Successfully fetched fresh security data')
      return data

    }, { 
      maxRetries: 3, 
      baseDelay: 1000, 
      maxDelay: 4000,
      retryCondition: (error: any) => {
        // Retry on 429 (rate limit), 503 (service unavailable), or network errors
        return error.status === 429 || error.status === 503 || error.code === 'ECONNRESET'
      }
    })
  }

  static parseSecurityData(data: GoPlusTokenSecurityResponse, mint: string) {
    if (!data.result || !data.result[mint]) {
      console.log('[GoPlus] No security data found for mint:', mint)
      return null
    }

    const tokenSecurity = data.result[mint]
    console.log('[GoPlus] Parsing security data for', mint, ':', tokenSecurity)

    // Helper function to parse boolean-like values
    const parseBool = (value: boolean | string | undefined): boolean => {
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true'
      return false
    }

    // Helper function to parse numeric strings
    const parseFloat = (value: string | undefined): number => {
      if (!value || value === '') return 0
      const num = Number(value)
      return isNaN(num) ? 0 : num
    }

    const parsed = {
      // Core security flags
      honeypot: parseBool(tokenSecurity.honeypot),
      buyTax: parseFloat(tokenSecurity.buy_tax),
      sellTax: parseFloat(tokenSecurity.sell_tax),
      blacklist: parseBool(tokenSecurity.blacklist),
      
      // Authority information
      noMint: !parseBool(tokenSecurity.is_mintable) || tokenSecurity.mint_authority === null || tokenSecurity.mint_authority === '',
      canBurn: parseBool(tokenSecurity.is_freezable) || tokenSecurity.freeze_authority !== null,
      isProxy: parseBool(tokenSecurity.proxy_contract),
      hasRenounced: (tokenSecurity.mint_authority === null || tokenSecurity.mint_authority === '') && 
                   (tokenSecurity.freeze_authority === null || tokenSecurity.freeze_authority === ''),
      
      // Additional GoPlus specific data
      canSell: parseBool(tokenSecurity.can_sell),
      isMintable: parseBool(tokenSecurity.is_mintable),
      isFreezable: parseBool(tokenSecurity.is_freezable),
      transferPausable: parseBool(tokenSecurity.transfer_pausable),
      canTakeBackOwnership: parseBool(tokenSecurity.can_take_back_ownership),
      hiddenOwner: parseBool(tokenSecurity.hidden_owner),
      externalCall: parseBool(tokenSecurity.external_call),
      gasAbuse: parseBool(tokenSecurity.gas_abuse),
      
      // Token metadata
      supply: tokenSecurity.supply,
      decimals: tokenSecurity.decimals,
      mintAuthority: tokenSecurity.mint_authority,
      freezeAuthority: tokenSecurity.freeze_authority,
      
      // Creator information
      creator: tokenSecurity.creators?.[0]?.address || tokenSecurity.creator_address,
      creatorBalance: tokenSecurity.creator_balance,
      creatorPercent: tokenSecurity.creator_percent,
    }

    console.log('[GoPlus] Parsed security data:', parsed)
    return parsed
  }

  // Security cache removed - no longer needed

  static clearTokenCache() {
    this.accessTokenCache = null
  }
}