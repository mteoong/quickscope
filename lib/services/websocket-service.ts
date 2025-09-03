import type { TokenTransaction } from '../types'
import { PriceCacheService } from './price-cache'

export interface WebSocketTransactionData {
  slot: number
  transaction: {
    signatures: string[]
    message: {
      accountKeys: string[]
      instructions: Array<{
        programIdIndex: number
        accounts: number[]
        data: string
      }>
    }
  }
  meta: {
    preBalances: number[]
    postBalances: number[]
    preTokenBalances: Array<{
      accountIndex: number
      mint: string
      uiTokenAmount: {
        amount: string
        decimals: number
        uiAmount: number
        uiAmountString: string
      }
    }>
    postTokenBalances: Array<{
      accountIndex: number
      mint: string
      uiTokenAmount: {
        amount: string
        decimals: number
        uiAmount: number
        uiAmountString: string
      }
    }>
    logMessages: string[]
    err: null | any
  }
  blockTime: number
}

export interface DEXProgramInfo {
  address: string
  name: string
  displayName: string
}

export const DEX_PROGRAMS: DEXProgramInfo[] = [
  {
    address: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    name: 'raydium',
    displayName: 'Raydium'
  },
  {
    address: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    name: 'orca', 
    displayName: 'Orca'
  },
  {
    address: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
    name: 'jupiter',
    displayName: 'Jupiter'
  },
  {
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    name: 'jupiter_v6',
    displayName: 'Jupiter V6'
  }
]

export class TransactionWebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private isConnecting = false
  private subscriptionId: number | null = null
  private onTransactionCallback: ((transaction: TokenTransaction) => void) | null = null
  private onConnectionStatusCallback: ((status: 'connecting' | 'connected' | 'disconnected' | 'error') => void) | null = null
  private priceCache: PriceCacheService
  private pingInterval: NodeJS.Timeout | null = null
  
  private readonly heliusWsUrl = 'wss://atlas-mainnet.helius-rpc.com'
  private readonly apiKey = '70f3553b-7234-4335-ba7b-bed599c8964f'

  constructor(
    private tokenAddress: string,
    private network: string = 'solana'
  ) {
    this.priceCache = PriceCacheService.getInstance()
  }

  setOnTransaction(callback: (transaction: TokenTransaction) => void) {
    this.onTransactionCallback = callback
  }

  setOnConnectionStatus(callback: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void) {
    this.onConnectionStatusCallback = callback
  }

  connect() {
    if (this.network !== 'solana') {
      console.warn('[WebSocket] Only Solana network is supported')
      return
    }

    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('[WebSocket] Already connecting or connected')
      return
    }

    console.log(`[WebSocket] Connecting to Helius WebSocket for token: ${this.tokenAddress}`)
    console.log(`[WebSocket] WebSocket URL: ${this.heliusWsUrl}/?api-key=${this.apiKey.substring(0, 8)}...`)
    this.isConnecting = true
    this.onConnectionStatusCallback?.('connecting')

    try {
      // Use the Enhanced WebSocket endpoint
      this.ws = new WebSocket(`${this.heliusWsUrl}/?api-key=${this.apiKey}`)
      
      console.log(`[WebSocket] WebSocket created, readyState: ${this.ws.readyState}`)
      
      this.ws.onopen = () => {
        console.log('[WebSocket] Connected successfully to Helius Enhanced WebSocket')
        console.log(`[WebSocket] Connection readyState: ${this.ws?.readyState}`)
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.onConnectionStatusCallback?.('connected')
        
        console.log('[WebSocket] About to start subscription...')
        this.subscribe()
        console.log('[WebSocket] Subscribe method called')
        
        this.startPingInterval()
        console.log('[WebSocket] Ping interval started')
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.ws.onclose = (event) => {
        console.log(`[WebSocket] Connection closed: ${event.code} - ${event.reason}`)
        this.isConnecting = false
        this.stopPingInterval()
        this.onConnectionStatusCallback?.('disconnected')
        this.handleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error)
        this.isConnecting = false
        this.onConnectionStatusCallback?.('error')
      }

    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket connection:', error)
      this.isConnecting = false
      this.onConnectionStatusCallback?.('error')
    }
  }

  private subscribe() {
    console.log('[WebSocket] Subscribe method entered')
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot subscribe - connection not ready')
      console.error(`[WebSocket] ws exists: ${!!this.ws}, readyState: ${this.ws?.readyState}`)
      return
    }

    // Use your exact working request structure
    const request = {
      jsonrpc: "2.0",
      id: 420,
      method: "transactionSubscribe",
      params: [
        {
          accountInclude: ["675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"]
        },
        {
          commitment: "processed",
          encoding: "jsonParsed",
          transactionDetails: "full",
          showRewards: true,
          maxSupportedTransactionVersion: 0
        }
      ]
    }

    console.log('[WebSocket] Sending subscription request:', JSON.stringify(request, null, 2))
    this.ws.send(JSON.stringify(request))
    console.log('[WebSocket] Subscription request sent')
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data)
      console.log(`[WebSocket] Received message:`, message)
      
      // Handle subscription confirmation
      if (message.id === 420 && message.result !== undefined) {
        this.subscriptionId = message.result
        console.log(`[WebSocket] Subscription confirmed with ID: ${this.subscriptionId}`)
        return
      }

      // Handle errors
      if (message.error) {
        console.error(`[WebSocket] Server error:`, message.error)
        this.onConnectionStatusCallback?.('error')
        return
      }

      // Handle transaction notifications
      if (message.method === 'transactionNotification' && message.params) {
        console.log(`[WebSocket] Transaction notification received:`, message.params)
        const transactionData = message.params.result as WebSocketTransactionData
        this.processTransaction(transactionData)
      }

    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error)
      console.error('[WebSocket] Raw message data:', data)
    }
  }

  private processTransaction(data: WebSocketTransactionData) {
    try {
      console.log(`[WebSocket] Processing transaction: ${data.transaction.signatures[0]}`)
      
      // Skip failed transactions
      if (data.meta.err) {
        return
      }

      // Check if this transaction involves our target token
      const hasTargetToken = this.checkForTargetToken(data)
      if (!hasTargetToken) {
        return
      }

      // Determine if this is a swap transaction
      const swapInfo = this.extractSwapInfo(data)
      if (!swapInfo) {
        return
      }

      // Create processed transaction
      const processedTransaction: TokenTransaction = {
        time: data.blockTime * 1000, // Convert to milliseconds
        type: swapInfo.type,
        amount: swapInfo.amount,
        pricePerToken: swapInfo.pricePerToken,
        usdValue: swapInfo.usdValue,
        trader: swapInfo.trader,
        txSignature: data.transaction.signatures[0],
        source: swapInfo.dexName
      }

      console.log(`[WebSocket] Processed ${swapInfo.type} transaction:`, processedTransaction)
      this.onTransactionCallback?.(processedTransaction)

    } catch (error) {
      console.error('[WebSocket] Failed to process transaction:', error)
    }
  }

  private checkForTargetToken(data: WebSocketTransactionData): boolean {
    // Check if our target token is involved in token balance changes
    const allTokenMints = [
      ...data.meta.preTokenBalances.map(balance => balance.mint),
      ...data.meta.postTokenBalances.map(balance => balance.mint)
    ]
    
    return allTokenMints.includes(this.tokenAddress)
  }

  private extractSwapInfo(data: WebSocketTransactionData) {
    try {
      // Find token balance changes for our target token
      const targetTokenPre = data.meta.preTokenBalances.find(b => b.mint === this.tokenAddress)
      const targetTokenPost = data.meta.postTokenBalances.find(b => b.mint === this.tokenAddress)
      
      if (!targetTokenPre || !targetTokenPost) {
        return null
      }

      // Calculate token amount change
      const preAmount = targetTokenPre.uiTokenAmount.uiAmount || 0
      const postAmount = targetTokenPost.uiTokenAmount.uiAmount || 0
      const tokenDelta = postAmount - preAmount
      
      if (Math.abs(tokenDelta) < 0.000001) {
        return null // No meaningful change
      }

      // Determine swap direction
      const type = tokenDelta > 0 ? 'BUY' : 'SELL'
      const amount = Math.abs(tokenDelta)

      // Find DEX program
      const dexInfo = this.identifyDEX(data)
      
      // Find trader (first non-program account that's a signer)
      const trader = this.findTrader(data)

      // Calculate price using actual balance changes
      const priceInfo = this.calculateSwapPrice(data, amount)
      const pricePerToken = priceInfo.pricePerToken
      const usdValue = priceInfo.usdValue

      return {
        type: type as 'BUY' | 'SELL',
        amount,
        pricePerToken,
        usdValue,
        trader: trader || 'Unknown',
        dexName: dexInfo?.displayName || 'Unknown DEX'
      }

    } catch (error) {
      console.error('[WebSocket] Failed to extract swap info:', error)
      return null
    }
  }

  private identifyDEX(data: WebSocketTransactionData): DEXProgramInfo | null {
    const accountKeys = data.transaction.message.accountKeys
    
    for (const dex of DEX_PROGRAMS) {
      if (accountKeys.includes(dex.address)) {
        return dex
      }
    }
    
    return null
  }

  private findTrader(data: WebSocketTransactionData): string | null {
    // The first account key is usually the fee payer/trader
    const accountKeys = data.transaction.message.accountKeys
    if (accountKeys.length > 0) {
      return accountKeys[0] // Simplified - first account is often the trader
    }
    return null
  }

  private calculateSwapPrice(data: WebSocketTransactionData, targetTokenAmount: number): { pricePerToken: number, usdValue: number } {
    try {
      // Find all token balance changes
      const tokenDeltas = new Map<string, number>()
      
      // Calculate token balance changes
      data.meta.preTokenBalances.forEach(preBalance => {
        const postBalance = data.meta.postTokenBalances.find(post => 
          post.accountIndex === preBalance.accountIndex && post.mint === preBalance.mint
        )
        
        if (postBalance) {
          const delta = (postBalance.uiTokenAmount.uiAmount || 0) - (preBalance.uiTokenAmount.uiAmount || 0)
          if (Math.abs(delta) > 0.000001) {
            tokenDeltas.set(preBalance.mint, delta)
          }
        }
      })

      // Also check for new token balances (tokens that didn't exist before)
      data.meta.postTokenBalances.forEach(postBalance => {
        const preBalance = data.meta.preTokenBalances.find(pre => 
          pre.accountIndex === postBalance.accountIndex && pre.mint === postBalance.mint
        )
        
        if (!preBalance && postBalance.uiTokenAmount.uiAmount && postBalance.uiTokenAmount.uiAmount > 0.000001) {
          tokenDeltas.set(postBalance.mint, postBalance.uiTokenAmount.uiAmount)
        }
      })

      // Find the quote token (the one that's not our target token with the largest absolute change)
      let quoteTokenAddress = ''
      let quoteTokenDelta = 0
      
      for (const [address, delta] of tokenDeltas) {
        if (address !== this.tokenAddress && Math.abs(delta) > Math.abs(quoteTokenDelta)) {
          quoteTokenAddress = address
          quoteTokenDelta = delta
        }
      }

      if (!quoteTokenAddress || quoteTokenDelta === 0) {
        // Fallback: check SOL balance changes
        const solChange = this.findSOLBalanceChange(data)
        if (solChange) {
          const solPrice = this.priceCache.getPriceBySymbol('SOL') || 240
          const usdValue = Math.abs(solChange) * solPrice
          const pricePerToken = targetTokenAmount > 0 ? Math.abs(solChange) * solPrice / targetTokenAmount : 0
          
          return { pricePerToken, usdValue }
        }
        
        return { pricePerToken: 0, usdValue: 0 }
      }

      // Calculate price using the quote token
      const pricePerToken = Math.abs(quoteTokenDelta) / targetTokenAmount
      
      // Get USD value using price cache
      let usdValue = 0
      const quoteTokenPrice = this.priceCache.getPrice(quoteTokenAddress)
      
      if (quoteTokenPrice) {
        usdValue = Math.abs(quoteTokenDelta) * quoteTokenPrice
      } else {
        // Try to identify the quote token and use fallback prices
        const quoteToken = this.identifyQuoteToken(quoteTokenAddress)
        if (quoteToken) {
          usdValue = Math.abs(quoteTokenDelta) * quoteToken.fallbackPrice
        }
      }

      return { pricePerToken, usdValue }

    } catch (error) {
      console.error('[WebSocket] Error calculating swap price:', error)
      return { pricePerToken: 0, usdValue: 0 }
    }
  }

  private identifyQuoteToken(address: string): { symbol: string, fallbackPrice: number } | null {
    const knownTokens = [
      { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', fallbackPrice: 240 },
      { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', fallbackPrice: 1 },
      { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', fallbackPrice: 1 }
    ]
    
    return knownTokens.find(token => token.address === address) || null
  }

  private findSOLBalanceChange(data: WebSocketTransactionData): number | null {
    // Find the largest SOL balance change (simplified approach)
    const preBalances = data.meta.preBalances
    const postBalances = data.meta.postBalances
    
    if (preBalances.length !== postBalances.length) {
      return null
    }

    let maxChange = 0
    for (let i = 0; i < preBalances.length; i++) {
      const change = (postBalances[i] - preBalances[i]) / 1e9 // Convert lamports to SOL
      if (Math.abs(change) > Math.abs(maxChange)) {
        maxChange = change
      }
    }

    return maxChange !== 0 ? maxChange : null
  }

  private startPingInterval() {
    // Send a simple JSON ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          // Send a simple ping message
          const pingMessage = {
            jsonrpc: '2.0',
            id: 'ping',
            method: 'ping'
          }
          this.ws.send(JSON.stringify(pingMessage))
          console.log('[WebSocket] Sent ping to keep connection alive')
        } catch (error) {
          console.warn('[WebSocket] Failed to send ping:', error)
        }
      }
    }, 30000)
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private handleReconnect() {
    this.stopPingInterval()
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  disconnect() {
    console.log('[WebSocket] Disconnecting')
    
    this.stopPingInterval()
    
    if (this.subscriptionId && this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Unsubscribe
      const unsubscribeMessage = {
        jsonrpc: '2.0',
        id: 2,
        method: 'transactionUnsubscribe',
        params: [this.subscriptionId]
      }
      this.ws.send(JSON.stringify(unsubscribeMessage))
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.subscriptionId = null
    this.reconnectAttempts = 0
    this.isConnecting = false
    this.onConnectionStatusCallback?.('disconnected')
  }
}