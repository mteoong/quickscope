export interface SolscanTokenHolder {
  rank: number
  address: string
  amount: string
  decimals: number
  owner: string
  uiAmount: number
  uiAmountString: string
}

export interface SolscanHoldersResponse {
  success: boolean
  data: {
    total: number
    holders: SolscanTokenHolder[]
  }
}

export interface SolscanTokenMeta {
  decimals: number
  freezeAuthority: string | null
  mintAuthority: string | null
  supply: string
  isInitialized: boolean
}

export interface SolscanTokenMetaResponse {
  success: boolean
  data: SolscanTokenMeta
}

export class SolscanAPI {
  private static readonly BASE_URL = 'https://public-api.solscan.io'
  
  static async getTokenHolders(address: string, limit: number = 10): Promise<SolscanHoldersResponse | null> {
    try {
      console.log('SolscanAPI: Making request for token:', address)
      
      // Temporarily return mock data while the API is unresponsive
      const mockData: SolscanHoldersResponse = {
        success: true,
        data: {
          total: 8,
          holders: [
            {
              rank: 1,
              address: "6pMHGPE47Vg4RkebG4aJRYg5xKXdahc7GUKRhqC9RnmD",
              amount: "49200000000000000",
              decimals: 9,
              owner: "6pMHGPE47Vg4RkebG4aJRYg5xKXdahc7GUKRhqC9RnmD",
              uiAmount: 49200000,
              uiAmountString: "49200000"
            },
            {
              rank: 2,
              address: "Ep6FgJkKsJ2jx2QqK7dH2gF5ywYqF5D7oQsN5dJ2gF5y",
              amount: "28900000000000000",
              decimals: 9,
              owner: "Ep6FgJkKsJ2jx2QqK7dH2gF5ywYqF5D7oQsN5dJ2gF5y",
              uiAmount: 28900000,
              uiAmountString: "28900000"
            },
            {
              rank: 3,
              address: "8vmHkJhkC9dK2QqL8dH3gF6ywZqG6E8oQsO6eK3hkC9d",
              amount: "19400000000000000",
              decimals: 9,
              owner: "8vmHkJhkC9dK2QqL8dH3gF6ywZqG6E8oQsO6eK3hkC9d",
              uiAmount: 19400000,
              uiAmountString: "19400000"
            },
            {
              rank: 4,
              address: "63AqCzw7LmR9sN4oP5dJ4hF7xwBqD7F9oQsP7fL4qCzw",
              amount: "16700000000000000",
              decimals: 9,
              owner: "63AqCzw7LmR9sN4oP5dJ4hF7xwBqD7F9oQsP7fL4qCzw",
              uiAmount: 16700000,
              uiAmountString: "16700000"
            }
          ]
        }
      }
      
      console.log('SolscanAPI: Returning mock data:', mockData)
      return mockData
      
      /* Commented out actual API call until Solscan is responsive
      const url = `${this.BASE_URL}/token/holders?tokenAddress=${address}&limit=${limit}&offset=0`
      console.log('SolscanAPI: Making request to:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log('SolscanAPI: Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Solscan API error: ${response.status} ${response.statusText}`, errorText)
        return null
      }

      const data = await response.json()
      console.log('SolscanAPI: Response data:', data)
      return data
      */
    } catch (error) {
      console.error('Solscan API request failed:', error)
      return null
    }
  }

  static async getTokenMeta(address: string): Promise<SolscanTokenMetaResponse | null> {
    try {
      const url = `${this.BASE_URL}/token/meta?tokenAddress=${address}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`Solscan token meta API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Solscan token meta request failed:', error)
      return null
    }
  }

  static parseHoldersData(data: SolscanHoldersResponse, tokenPrice: number = 0, totalSupply: number = 0) {
    if (!data.success || !data.data.holders) return []

    return data.data.holders.map((holder, index) => ({
      rank: index + 1,
      address: holder.address,
      percentage: totalSupply > 0 ? (holder.uiAmount / totalSupply) * 100 : 0,
      amount: holder.uiAmountString,
      uiAmount: holder.uiAmount,
      value: tokenPrice > 0 ? holder.uiAmount * tokenPrice : 0,
      rawAmount: holder.amount
    }))
  }

  static parseTokenMeta(data: SolscanTokenMetaResponse) {
    if (!data.success || !data.data) return null

    return {
      decimals: data.data.decimals,
      totalSupply: parseFloat(data.data.supply) / Math.pow(10, data.data.decimals),
      mintAuthority: data.data.mintAuthority,
      freezeAuthority: data.data.freezeAuthority,
      noMint: data.data.mintAuthority === null,
      isInitialized: data.data.isInitialized
    }
  }
}