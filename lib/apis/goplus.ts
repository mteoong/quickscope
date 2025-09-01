export interface GoPlusSecurityResponse {
  code: number
  message: string
  result: {
    [address: string]: {
      buy_tax: string
      sell_tax: string
      is_blacklisted: string
      is_honeypot: string
      is_in_dex: string
      is_mintable: string
      is_proxy: string
      is_renounced: string
      can_take_back_ownership: string
      owner_change_balance: string
      hidden_owner: string
      selfdestruct: string
      external_call: string
      gas_abuse: string
      is_anti_whale: string
      anti_whale_modifiable: string
      cannot_buy: string
      cannot_sell_all: string
      slippage_modifiable: string
      personal_slippage_modifiable: string
      trading_cooldown: string
      transfer_pausable: string
      trust_list: string
    }
  }
}

export class GoPlusAPI {
  private static readonly BASE_URL = 'https://api.gopluslabs.io/api/v1/token_security'

  static async getTokenSecurity(address: string, network: string): Promise<GoPlusSecurityResponse | null> {
    try {
      // Map network names to GoPlus chain IDs
      const chainMap: Record<string, string> = {
        'ethereum': '1',
        'eth': '1',
        'bsc': '56',
        'polygon': '137',
        'arbitrum': '42161',
        'avalanche': '43114',
        'solana': 'solana' // Special case for Solana
      }

      const chainId = chainMap[network.toLowerCase()] || '1'
      const url = chainId === 'solana' 
        ? `${this.BASE_URL}/${chainId}?contract_addresses=${address}`
        : `${this.BASE_URL}/${chainId}?contract_addresses=${address}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`GoPlus API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('GoPlus API request failed:', error)
      return null
    }
  }

  static parseSecurityData(data: GoPlusSecurityResponse, address: string) {
    const tokenData = data.result?.[address.toLowerCase()]
    if (!tokenData) return null

    return {
      honeypot: tokenData.is_honeypot === '1',
      buyTax: parseFloat(tokenData.buy_tax || '0'),
      sellTax: parseFloat(tokenData.sell_tax || '0'),
      blacklist: tokenData.is_blacklisted === '1',
      noMint: tokenData.is_mintable === '0',
      canBurn: false, // Not directly provided by GoPlus
      isProxy: tokenData.is_proxy === '1',
      hasRenounced: tokenData.is_renounced === '1',
    }
  }
}