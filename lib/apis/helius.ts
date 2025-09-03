import type { TokenHolder, HeliusTransaction, TokenTransaction } from '../types'

export interface HeliusTokenHolder {
  rank: number
  address: string
  uiAmount: number
  uiAmountString: string
  amount: string
  decimals: number
}

export interface HeliusTokenLargestAccountsResponse {
  jsonrpc: string
  result: {
    context: {
      slot: number
      apiVersion: string
    }
    value: Array<{
      address: string
      uiAmount: number
      decimals: number
      amount: string
      uiAmountString: string
    }>
  }
  id: number
}

export interface HeliusTokenMetadata {
  account: string
  onChainAccountInfo: {
    accountInfo: {
      key: string
      isSigner: boolean
      isWritable: boolean
      lamports: number
      data: {
        parsed: {
          info: {
            decimals: number
            freezeAuthority?: string
            mintAuthority?: string
            supply: string
            isInitialized: boolean
          }
          type: string
        }
        program: string
        space: number
      }
      owner: string
      executable: boolean
      rentEpoch: number
    }
  }
}

export interface HeliusTokenMetadataResponse {
  jsonrpc: string
  result: HeliusTokenMetadata
  id: number
}

export class HeliusAPI {
  private static readonly BASE_URL = 'https://mainnet.helius-rpc.com'
  private static readonly API_KEY = '70f3553b-7234-4335-ba7b-bed599c8964f'

  static async getTokenLargestAccounts(tokenAddress: string, limit: number = 20): Promise<HeliusTokenHolder[]> {
    console.group(`🔍 [HELIUS HOLDERS API] Starting request for token: ${tokenAddress}`)
    const startTime = performance.now()
    
    try {
      // Limit to maximum 20 accounts to avoid "too many accounts" error
      const actualLimit = Math.min(limit, 20)
      
      console.log(`📋 Request Parameters:`)
      console.log(`  • Token Address: ${tokenAddress}`)
      console.log(`  • Requested Limit: ${limit}`)
      console.log(`  • Actual Limit (max 20): ${actualLimit}`)
      console.log(`  • Method: getTokenLargestAccounts (returns 20 largest accounts automatically)`)
      console.log(`  • Timeout: 10000ms`)
      
      const requestPayload = {
        jsonrpc: '2.0',
        id: 'helius-holders',
        method: 'getTokenLargestAccounts',
        params: [
          tokenAddress
        ]
      }
      
      console.log(`📤 Request Payload:`, JSON.stringify(requestPayload, null, 2))
      
      // Use Helius RPC API getTokenLargestAccounts method
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Request timeout triggered (10s)')
        controller.abort()
      }, 10000) // 10 second timeout
      
      const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const requestTime = performance.now() - startTime

      console.log(`📊 Response Status: ${response.status} ${response.statusText}`)
      console.log(`⏱️ Request Time: ${requestTime.toFixed(2)}ms`)

      if (!response.ok) {
        console.error(`❌ HTTP Error Response:`)
        console.error(`  • Status: ${response.status}`)
        console.error(`  • Status Text: ${response.statusText}`)
        console.error(`  • URL: ${response.url}`)
        
        // Try to get response body for more details
        try {
          const errorText = await response.text()
          console.error(`  • Response Body: ${errorText}`)
        } catch (bodyError) {
          console.error(`  • Could not read response body:`, bodyError)
        }
        
        console.log('🔄 Falling back to mock data')
        console.groupEnd()
        return this.getTokenHoldersFallback(tokenAddress, limit)
      }

      const data = await response.json()
      console.log(`📥 Raw Response Data:`, JSON.stringify(data, null, 2))
      
      // Check for RPC error in response
      if (data.error) {
        console.error(`❌ RPC Error in Response:`)
        console.error(`  • Error Code: ${data.error.code || 'N/A'}`)
        console.error(`  • Error Message: ${data.error.message || 'N/A'}`)
        console.error(`  • Error Data:`, data.error.data || 'N/A')
        console.error(`  • Full Error Object:`, JSON.stringify(data.error, null, 2))
        console.log('🔄 Falling back to mock data due to RPC error')
        console.groupEnd()
        return this.getTokenHoldersFallback(tokenAddress, limit)
      }

      // Validate response structure
      if (!data.result) {
        console.warn(`⚠️ Response Validation Failed:`)
        console.warn(`  • Missing 'result' field in response`)
        console.warn(`  • Response keys:`, Object.keys(data))
        console.log('🔄 Falling back to mock data due to missing result')
        console.groupEnd()
        return this.getTokenHoldersFallback(tokenAddress, limit)
      }

      if (!data.result.value) {
        console.warn(`⚠️ Response Validation Failed:`)
        console.warn(`  • Missing 'value' field in result`)
        console.warn(`  • Result keys:`, Object.keys(data.result || {}))
        console.warn(`  • Result content:`, JSON.stringify(data.result, null, 2))
        console.log('🔄 Falling back to mock data due to missing value array')
        console.groupEnd()
        return this.getTokenHoldersFallback(tokenAddress, limit)
      }

      if (!Array.isArray(data.result.value)) {
        console.warn(`⚠️ Response Validation Failed:`)
        console.warn(`  • 'value' is not an array`)
        console.warn(`  • Value type: ${typeof data.result.value}`)
        console.warn(`  • Value content:`, data.result.value)
        console.log('🔄 Falling back to mock data due to invalid value type')
        console.groupEnd()
        return this.getTokenHoldersFallback(tokenAddress, limit)
      }

      const rawHolders = data.result.value
      console.log(`📈 Processing ${rawHolders.length} raw holder records`)
      console.log(`📊 Sample raw holder:`, rawHolders[0] ? JSON.stringify(rawHolders[0], null, 2) : 'No holders found')

      const holders = rawHolders
        .slice(0, actualLimit)
        .map((holder: any, index: number) => {
          const processedHolder = {
            rank: index + 1,
            address: holder.address,
            uiAmount: holder.uiAmount, // This is already converted by Helius
            uiAmountString: holder.uiAmountString,
            amount: holder.amount, // Raw amount string
            decimals: holder.decimals || 9
          }
          
          if (index === 0) {
            console.log(`📊 Sample processed holder:`, JSON.stringify(processedHolder, null, 2))
          }
          
          return processedHolder
        })

      console.log(`✅ Successfully processed ${holders.length} holders`)
      console.log(`⏱️ Total processing time: ${(performance.now() - startTime).toFixed(2)}ms`)
      console.groupEnd()
      return holders

    } catch (error) {
      const errorTime = performance.now() - startTime
      console.error(`💥 Exception caught after ${errorTime.toFixed(2)}ms:`)
      
      if (error instanceof Error) {
        console.error(`  • Error Name: ${error.name}`)
        console.error(`  • Error Message: ${error.message}`)
        console.error(`  • Error Stack:`, error.stack)
      } else {
        console.error(`  • Unknown error type:`, typeof error)
        console.error(`  • Error value:`, error)
      }
      
      // Check for specific error types
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`🌐 Network Error Detected - likely connectivity issue`)
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        console.error(`⏰ Request Timeout - aborted after 10 seconds`)
      } else if (error instanceof SyntaxError) {
        console.error(`📝 JSON Parsing Error - invalid response format`)
      }
      
      console.log('🔄 Falling back to mock data due to exception')
      console.groupEnd()
      return this.getTokenHoldersFallback(tokenAddress, limit)
    }
  }

  private static async getTokenHoldersFallback(tokenAddress: string, limit: number): Promise<HeliusTokenHolder[]> {
    console.group(`🔄 [HELIUS FALLBACK] Using mock data for token: ${tokenAddress}`)
    
    try {
      console.log(`📋 Fallback Parameters:`)
      console.log(`  • Token Address: ${tokenAddress}`)
      console.log(`  • Requested Limit: ${limit}`)
      console.log(`  • Reason: Primary API failed`)
      
      // Return mock data for now as a fallback when APIs are rate limited
      const mockHolders: HeliusTokenHolder[] = [
        {
          rank: 1,
          address: "5hpfC9VBxVcoW9opCnM2PqR6YWRLBzrBpabJTZnwwNiw",
          uiAmount: 6995499444648.329,
          uiAmountString: "6995499444648.32866",
          amount: "699549944464832866",
          decimals: 5
        },
        {
          rank: 2,
          address: "F8FqZuUKfoy58aHLW6bfeEhfW9sTtJyqFTqnxVmGZ6dU",
          uiAmount: 4426104450304.68,
          uiAmountString: "4426104450304.67953",
          amount: "442610445030467953",
          decimals: 5
        },
        {
          rank: 3,
          address: "4XHP9YQeeXPXHAjNXuKio1na1ypcxFSqFYBHtptQticd",
          uiAmount: 3626966647084.1436,
          uiAmountString: "3626966647084.14357",
          amount: "362696664708414357",
          decimals: 5
        },
        {
          rank: 4,
          address: "8voVJqj2zFa9cew2TGAh5kGiSUMiU68RYJAUSXupRRz1",
          uiAmount: 3560256157788.7744,
          uiAmountString: "3560256157788.77417",
          amount: "356025615778877417",
          decimals: 5
        }
      ]
      
      const actualLimit = Math.min(limit, 20)
      const resultHolders = mockHolders.slice(0, actualLimit)
      console.log(`✅ Returning ${resultHolders.length} mock holder records (requested: ${limit}, capped at: ${actualLimit})`)
      console.log(`📊 Sample mock holder:`, JSON.stringify(resultHolders[0], null, 2))
      console.groupEnd()
      return resultHolders

    } catch (error) {
      console.error(`💥 Fallback method exception:`)
      
      if (error instanceof Error) {
        console.error(`  • Error Name: ${error.name}`)
        console.error(`  • Error Message: ${error.message}`)
        console.error(`  • Error Stack:`, error.stack)
      } else {
        console.error(`  • Unknown error type:`, typeof error)
        console.error(`  • Error value:`, error)
      }
      
      console.error(`❌ Fallback failed - returning empty array`)
      console.groupEnd()
      return []
    }
  }

  static async getTokenMetadata(tokenAddress: string): Promise<HeliusTokenMetadata | null> {
    try {
      console.log('HeliusAPI: Fetching token metadata for', tokenAddress)
      
      const response = await fetch(`${this.BASE_URL}/?api-key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [
            tokenAddress,
            {
              encoding: 'jsonParsed',
              commitment: 'confirmed'
            }
          ]
        })
      })

      if (!response.ok) {
        console.error(`Helius token metadata API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data: HeliusTokenMetadataResponse = await response.json()
      console.log('HeliusAPI: Token metadata response:', data)
      return data.result

    } catch (error) {
      console.error('Helius token metadata request failed:', error)
      return null
    }
  }

  static parseHoldersData(holders: HeliusTokenHolder[], tokenPrice: number = 0, totalSupply: number = 0) {
    return holders.map(holder => ({
      rank: holder.rank,
      address: holder.address,
      percentage: totalSupply > 0 ? (holder.uiAmount / totalSupply) * 100 : 0,
      amount: this.formatTokenAmount(holder.uiAmount),
      uiAmount: holder.uiAmount,
      value: tokenPrice > 0 ? holder.uiAmount * tokenPrice : 0,
      rawAmount: holder.amount
    }))
  }

  static parseTokenMetadata(data: HeliusTokenMetadata) {
    if (!data?.onChainAccountInfo?.accountInfo?.data?.parsed?.info) {
      return null
    }

    const tokenInfo = data.onChainAccountInfo.accountInfo.data.parsed.info

    return {
      decimals: tokenInfo.decimals,
      totalSupply: parseFloat(tokenInfo.supply) / Math.pow(10, tokenInfo.decimals),
      mintAuthority: tokenInfo.mintAuthority,
      freezeAuthority: tokenInfo.freezeAuthority,
      noMint: tokenInfo.mintAuthority === null,
      isInitialized: tokenInfo.isInitialized
    }
  }

  private static formatAmount(amount: number): string {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`
    return amount.toFixed(0)
  }

  private static formatTokenAmount(amount: number): string {
    // Format token amounts with proper decimals and units
    if (amount >= 1000000000000) return `${(amount / 1000000000000).toFixed(2)}T`
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(2)}B`
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    if (amount >= 1) return amount.toFixed(2)
    if (amount >= 0.01) return amount.toFixed(4)
    if (amount > 0) return amount.toFixed(6)
    return '0'
  }

  static async getTokenTransactions(tokenAddress: string, limit: number = 50): Promise<TokenTransaction[]> {
    console.log(`🔍 [HELIUS TRANSACTIONS] Fetching transactions for token: ${tokenAddress}`)
    
    try {
      const requestPayload = {
        jsonrpc: '2.0',
        id: 'helius-transactions',
        method: 'searchAssets',
        params: {
          tokenType: 'fungible',
          tokenAddress: tokenAddress,
          limit: limit,
          page: 1,
          sortBy: {
            sortBy: 'created',
            sortDirection: 'desc'
          },
          displayOptions: {
            showNativeBalance: false
          }
        }
      }
      
      console.log(`📤 [HELIUS TX] Request payload:`, requestPayload)

      const response = await fetch(`${this.BASE_URL}/?api-key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        console.error(`❌ [HELIUS TX] API error: ${response.status} ${response.statusText}`)
        return this.getMockTransactions()
      }

      const data = await response.json()
      console.log(`📥 [HELIUS TX] Raw response:`, data)

      if (data.error) {
        console.error(`❌ [HELIUS TX] RPC error:`, data.error)
        return this.getMockTransactions()
      }

      // For now, return mock data as Helius transaction parsing is complex
      // In production, you'd parse the actual transaction data
      console.log(`📝 [HELIUS TX] Using mock transaction data for now`)
      return this.getMockTransactions()

    } catch (error) {
      console.error(`💥 [HELIUS TX] Exception:`, error)
      return this.getMockTransactions()
    }
  }

  private static getMockTransactions(): TokenTransaction[] {
    const now = Date.now()
    return [
      {
        time: now - 30000, // 30 seconds ago
        type: 'BUY',
        amount: 125000,
        pricePerToken: 0.000845,
        usdValue: 105.63,
        trader: 'GHH3Rk2vwG9D7j8k5mN9pQ1rS2tU3vW4xY5zA6bC7dE8f',
        txSignature: '5J7k8L9m0N1o2P3q4R5s6T7u8V9w0X1y2Z3a4B5c6D7e8F9g0H1i2J3k4L5m6N7o8P9q0R1s2T3u4V5w6X7y8Z9a'
      },
      {
        time: now - 120000, // 2 minutes ago
        type: 'SELL',
        amount: 89500,
        pricePerToken: 0.000862,
        usdValue: 77.15,
        trader: '4XHP9YQeeXPXHAjNXuKio1na1ypcxFSqFYBHtptQticd',
        txSignature: '3A4b5C6d7E8f9G0h1I2j3K4l5M6n7O8p9Q0r1S2t3U4v5W6x7Y8z9A0b1C2d3E4f5G6h7I8j9K0l1M2n3O4p5Q6r'
      },
      {
        time: now - 180000, // 3 minutes ago
        type: 'BUY',
        amount: 250000,
        pricePerToken: 0.000838,
        usdValue: 209.50,
        trader: 'F8FqZuUKfoy58aHLW6bfeEhfW9sTtJyqFTqnxVmGZ6dU',
        txSignature: '7G8h9I0j1K2l3M4n5O6p7Q8r9S0t1U2v3W4x5Y6z7A8b9C0d1E2f3G4h5I6j7K8l9M0n1O2p3Q4r5S6t7U8v9W0x'
      },
      {
        time: now - 240000, // 4 minutes ago
        type: 'SELL',
        amount: 75000,
        pricePerToken: 0.000851,
        usdValue: 63.83,
        trader: '8voVJqj2zFa9cew2TGAh5kGiSUMiU68RYJAUSXupRRz1',
        txSignature: '1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w3X4y5Z6a7B8c9D0e1F2g3H4i5J6k7L8m9N0o1P2q3R4s'
      },
      {
        time: now - 300000, // 5 minutes ago
        type: 'BUY',
        amount: 180000,
        pricePerToken: 0.000832,
        usdValue: 149.76,
        trader: '5hpfC9VBxVcoW9opCnM2PqR6YWRLBzrBpabJTZnwwNiw',
        txSignature: '9C0d1E2f3G4h5I6j7K8l9M0n1O2p3Q4r5S6t7U8v9W0x1Y2z3A4b5C6d7E8f9G0h1I2j3K4l5M6n7O8p9Q0r1S2t'
      }
    ]
  }
}