"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, ExternalLink, Star } from "lucide-react"
import { TokenDataService } from "@/lib/token-data-service"
import type { TokenHolder, TraderData, TokenTransaction } from "@/lib/types"
import { BirdeyeAPI } from "@/lib/apis/birdeye"
import { debounce } from "@/lib/utils/api-utils"

interface HoldersTradersCardProps {
  tokenAddress?: string
  network?: string
}

export function HoldersTradersCard({ tokenAddress, network = "solana" }: HoldersTradersCardProps = {}) {
  console.log('🔍 [HoldersTradersCard] Component rendered with tokenAddress:', tokenAddress, 'network:', network)
  
  const [activeTab, setActiveTab] = useState("transactions")
  const [traders, setTraders] = useState<TraderData[]>([])
  const [transactions, setTransactions] = useState<TokenTransaction[]>([])
  const [holders, setHolders] = useState<TokenHolder[]>([])
  const [isLoadingTraders, setIsLoadingTraders] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [isLoadingHolders, setIsLoadingHolders] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Create debounced fetch functions
  const debouncedFetchTraders = useCallback(
    debounce(async (tokenAddr: string) => {
      try {
        const tradersData = await TokenDataService.getTopTraders(tokenAddr)
        setTraders(tradersData)
      } catch (error) {
        setTraders([])
      }
    }, 600),
    []
  )

  const debouncedFetchTransactions = useCallback(
    debounce(async (tokenAddr: string) => {
      try {
        console.log('[Transactions] Fetching from Birdeye API for token:', tokenAddr)
        const rawTransactions = await BirdeyeAPI.getTokenTransactions(tokenAddr, 30)
        
        // Parse Birdeye transactions to TokenTransaction format
        const parsedTransactions: TokenTransaction[] = rawTransactions.map((tx: any) => {
          // Determine if it's a buy or sell based on tx_type or side
          const isSell = tx.tx_type === 'sell' || tx.side === 'sell'
          
          // For token amount, use the PENGU token amount (to.ui_amount for buys, from.ui_amount for sells)
          const tokenAmount = isSell 
            ? tx.from?.ui_amount || 0  // PENGU being sold
            : tx.to?.ui_amount || 0    // PENGU being bought
          
          // For price per token, use volume_usd / volume (volume is the token amount)
          const pricePerToken = tx.volume && tx.volume > 0 
            ? tx.volume_usd / tx.volume 
            : 0
          
          return {
            time: tx.block_unix_time * 1000 || Date.now(), // Convert to milliseconds
            type: isSell ? 'SELL' : 'BUY',
            amount: tokenAmount,
            pricePerToken: pricePerToken, 
            usdValue: tx.volume_usd || 0,
            trader: tx.owner || '—',
            txSignature: tx.tx_hash || '',
            dex: tx.source || 'Unknown',
            isRealTime: false
          }
        })

        console.log(`[Transactions] Loaded ${parsedTransactions.length} transactions`)
        setTransactions(parsedTransactions)
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
        setTransactions([])
      }
    }, 600),
    []
  )

  const debouncedFetchHolders = useCallback(
    debounce(async (tokenAddr: string) => {
      try {
        console.log('[Holders] Fetching top 20 holders for token:', tokenAddr)
        const holdersData = await TokenDataService.getTokenLargestAccounts(tokenAddr, network)
        setHolders(holdersData)
        console.log(`[Holders] Loaded ${holdersData.length} holders`)
      } catch (error) {
        console.error('Failed to fetch holders:', error)
        setHolders([])
      }
    }, 600),
    [network]
  )

  // Fetch traders data - Load immediately on mount for better UX
  useEffect(() => {
    if (!tokenAddress) {
      setTraders([])
      return
    }

    console.log('HoldersTradersCard: Starting traders fetch for', tokenAddress)
    setIsLoadingTraders(true)
    debouncedFetchTraders(tokenAddress)
      .finally(() => {
        setIsLoadingTraders(false)
        console.log('HoldersTradersCard: Traders fetch completed')
      })

  }, [tokenAddress, debouncedFetchTraders])

  // Fetch transactions data using Birdeye API
  useEffect(() => {
    if (!tokenAddress || network !== 'solana') {
      setTransactions([])
      return
    }

    console.log('HoldersTradersCard: Starting transactions fetch for', tokenAddress)
    setIsLoadingTransactions(true)
    debouncedFetchTransactions(tokenAddress)
      .finally(() => {
        setIsLoadingTransactions(false)
        console.log('HoldersTradersCard: Transactions fetch completed')
      })

  }, [tokenAddress, network, debouncedFetchTransactions])

  // Fetch holders data
  useEffect(() => {
    if (!tokenAddress || network !== 'solana') {
      setHolders([])
      return
    }

    console.log('HoldersTradersCard: Starting holders fetch for', tokenAddress)
    setIsLoadingHolders(true)
    debouncedFetchHolders(tokenAddress)
      .finally(() => {
        setIsLoadingHolders(false)
        console.log('HoldersTradersCard: Holders fetch completed')
      })

  }, [tokenAddress, network, debouncedFetchHolders])

  // Update time every second for live time calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  const formatAddress = (address: string) => {
    if (address.length <= 8) return address
    return `${address.slice(0, 3)}...${address.slice(-4)}`
  }

  return (
    <div className="h-full bg-card text-card-foreground rounded-sm border shadow-sm flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <div className="flex-shrink-0 p-3 pb-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="traders">Traders</TabsTrigger>
            <TabsTrigger value="holders">Holders</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="transactions" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 space-y-0.5 overflow-y-auto overflow-x-auto p-3 pr-2 custom-scrollbar min-h-0 min-w-0">
            <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground font-medium pb-1 border-b border-border sticky top-0 bg-card min-w-full">
              <div>TIME</div>
              <div>TYPE</div>
              <div>AMOUNT</div>
              <div>PRICE</div>
              <div>USD</div>
              <div>TRADER</div>
              <div className="text-right">TXN</div>
            </div>
            {isLoadingTransactions ? (
              <div className="text-center text-muted-foreground text-xs py-4">
                Loading transactions...
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((tx, index) => {
                const uniqueKey = `tx-${tx.txSignature}-${index}`
                const timeAgo = Math.round((currentTime - tx.time) / 1000)
                const timeString = timeAgo < 60 ? `${timeAgo}s` : 
                                 timeAgo < 3600 ? `${Math.round(timeAgo/60)}m` :
                                 `${Math.round(timeAgo/3600)}h`
                
                const isBuy = tx.type === 'BUY'
                const colorClass = isBuy ? 'text-green-400' : 'text-red-400'
                
                return (
                  <div key={uniqueKey} className="grid grid-cols-7 gap-2 text-xs py-1 hover:bg-muted/50 rounded-sm">
                    <div className="text-muted-foreground">{timeString} ago</div>
                    <div className={`font-medium ${colorClass}`}>
                      {tx.type}
                    </div>
                    <div className={`font-medium ${colorClass}`}>{formatValue(tx.amount)}</div>
                    <div className={`font-medium ${colorClass}`}>${(tx.pricePerToken || 0).toFixed(4)}</div>
                    <div className={`font-medium ${colorClass}`}>${(tx.usdValue || 0).toFixed(2)}</div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">{formatAddress(tx.trader)}</span>
                      <Copy
                        className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => copyToClipboard(tx.trader)}
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <a
                        href={`https://solscan.io/tx/${tx.txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground text-xs py-4">
                {tokenAddress ? 'No transaction data available' : 'Select a token to view transactions'}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="traders" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 space-y-0.5 overflow-y-auto p-3 pr-2 custom-scrollbar min-h-0">
            <div className="grid grid-cols-5 text-xs text-muted-foreground font-medium pb-1 border-b border-border sticky top-0 bg-card" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto' }}>
              <div>TRADER</div>
              <div>BUY VOL</div>
              <div>SELL VOL</div>
              <div>TOTAL VOL</div>
              <div className="text-right">BALANCE</div>
            </div>
            {isLoadingTraders ? (
              <div className="text-center text-muted-foreground text-xs py-4">
                Loading traders...
              </div>
            ) : traders.length > 0 ? (
              traders.map((trader, index) => {
                // Create a unique key combining trader address and rank to prevent duplicates
                const uniqueKey = `trader-${trader.trader}-${trader.rank}-${index}`
                
                return (
                  <div key={uniqueKey} className="grid grid-cols-5 text-xs py-1 hover:bg-muted/50 rounded-sm" style={{ gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto' }}>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">#{trader.rank}</span>
                      <span className="font-mono text-xs">{formatAddress(trader.trader)}</span>
                      <Copy
                        className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => copyToClipboard(trader.trader)}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-green-400">{trader.bought}</div>
                      <div className="text-muted-foreground text-xs">
                        {trader.boughtTx}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-red-400">{trader.sold}</div>
                      <div className="text-muted-foreground text-xs">
                        {trader.soldTx}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">
                        {trader.pnl}
                      </div>
                    </div>
                    <div className="font-medium text-right">{trader.pnlPercent}</div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground text-xs py-4">
                {tokenAddress ? 'No trader data available' : 'Select a token to view traders'}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="holders" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 space-y-0.5 overflow-y-auto p-3 custom-scrollbar min-h-0">
            <div className="grid text-xs text-muted-foreground font-medium pb-1 border-b border-border sticky top-0 bg-card" style={{ gridTemplateColumns: '2.5fr 100px 1.8fr 1fr' }}>
              <div># Address</div>
              <div>%</div>
              <div>Amount</div>
              <div className="text-right">Value (USD)</div>
            </div>
            {isLoadingHolders ? (
              <div className="text-center text-muted-foreground text-xs py-4">
                Loading holders...
              </div>
            ) : holders.length > 0 ? (
              holders.map((holder, index) => {
                const uniqueKey = `holder-${holder.address}-${index}`
                
                return (
                  <div key={uniqueKey} className="grid text-xs py-2 hover:bg-muted/50 rounded-sm" style={{ gridTemplateColumns: '2.5fr 100px 1.8fr 1fr' }}>
                    {/* # Address Column */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{index + 1}</span>
                      <span className="font-mono text-xs">{formatAddress(holder.address)}</span>
                      <Copy
                        className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => copyToClipboard(holder.address)}
                      />
                    </div>
                    
                    {/* % Column */}
                    <div className="font-medium">{holder.percentage.toFixed(2)}%</div>
                    
                    {/* Amount Column with Progress Bar */}
                    <div className="space-y-1">
                      <div className="font-medium">{holder.amount}</div>
                      <div className="w-full bg-muted rounded-full h-1">
                        <div 
                          className="bg-yellow-400 h-1 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.min(holder.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Value Column */}
                    <div className="font-medium text-right">
                      ${typeof holder.value === 'number' ? 
                        holder.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
                        holder.value
                      }
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground text-xs py-4">
                {tokenAddress ? 'No holder data available' : 'Select a token to view holders'}
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}