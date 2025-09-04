"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { SidebarItem } from "@/lib/types"
import type { TrendingToken } from "@/lib/apis/trending"
import { getTrendingUpdateRate } from "@/lib/config/api-config"

interface TabbedTokenListProps {
  trendingItems: SidebarItem[]
  watchlistItems: SidebarItem[]
  onSelect: (token: SidebarItem) => void
  onTrendingSelect: (address: string, type: 'token' | 'pool', imageUrl?: string) => void
}

export function TabbedTokenList({ trendingItems, watchlistItems, onSelect, onTrendingSelect }: TabbedTokenListProps) {
  const [activeTab, setActiveTab] = useState<"trending" | "watchlist">("trending")
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch trending tokens
  useEffect(() => {
    const fetchTrending = async (showLoading = false) => {
      if (showLoading) setIsLoading(true)
      
      try {
        const response = await fetch('/api/trending')
        const data = await response.json()
        
        if (data.success) {
          setTrendingTokens(data.data)
        } else {
          console.error('Trending API error:', data.error)
          // Only clear tokens on initial load failure, keep existing data on updates
          if (showLoading) setTrendingTokens([])
        }
      } catch (error) {
        console.error('Failed to fetch trending tokens:', error)
        // Only clear tokens on initial load failure, keep existing data on updates
        if (showLoading) setTrendingTokens([])
      } finally {
        if (showLoading) setIsLoading(false)
      }
    }

    // Initial fetch with loading state
    fetchTrending(true)

    // Auto-refresh in background without loading state
    const interval = setInterval(() => fetchTrending(false), getTrendingUpdateRate())
    return () => clearInterval(interval)
  }, [])

  const getNetworkLogo = (network: string) => {
    const networkLower = network.toLowerCase()
    if (networkLower === 'ethereum' || networkLower === 'eth') {
      return 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/info/logo.png'
    } else if (networkLower === 'solana' || networkLower === 'sol') {
      return 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/solana/info/logo.png'
    } else if (networkLower === 'bsc') {
      return 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/smartchain/info/logo.png'
    }
    return null
  }

  const getNetworkAbbr = (network: string) => {
    const networkLower = network.toLowerCase()
    if (networkLower === 'ethereum') return 'ETH'
    if (networkLower === 'solana') return 'SOL'
    if (networkLower === 'bsc') return 'BSC'
    return network.slice(0, 3).toUpperCase()
  }

  const currentItems = activeTab === "watchlist" ? watchlistItems : []

  return (
    <div className="p-3">
      <div className="flex gap-1 mb-3">
        <Button
          variant={activeTab === "trending" ? "default" : "ghost"}
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => setActiveTab("trending")}
        >
          Trending
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-7 text-xs opacity-50 !cursor-not-allowed hover:!cursor-not-allowed hover:bg-transparent"
          disabled
        >
          Watchlist
        </Button>
      </div>

      <div className="space-y-1">
        {activeTab === "trending" ? (
          <>
            {isLoading ? (
              <div className="text-center text-muted-foreground text-xs py-4">
                Loading trending...
              </div>
            ) : trendingTokens.length > 0 ? (
              trendingTokens.map((token, index) => (
                <div key={`trending-${token.address}`}>
                  <div
                    className="flex items-center p-2 rounded hover:bg-blue-500/10 cursor-pointer text-xs"
                    onClick={() => onTrendingSelect(token.address, 'token', token.image)}
                  >
                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <img
                          src={token.image || "/placeholder.svg"}
                          alt={token.symbol}
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg"
                          }}
                        />
                        <span className="font-medium truncate text-xs">{token.name}</span>
                      </div>
                      <div className="text-foreground text-xs font-medium">
                        ${(() => {
                          const price = token.price
                          // console.log('Trending Token Price Debug:', { price, symbol: token.symbol })
                          
                          if (price >= 1) {
                            const result = price.toPrecision(6)
                            // console.log('≥$1 toPrecision(6):', result)
                            return result
                          } else if (price >= 0.0001) {
                            const result = price.toFixed(5)
                            // console.log('≥0.0001 toFixed(5):', result)
                            return result
                          } else {
                            const result = price.toExponential(2)
                            // console.log('<0.0001 toExponential(2):', result)
                            return result
                          }
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[10px]">
                        <span className="text-muted-foreground">24h:</span> <span className={(token.priceChange24h || 0) >= 0 ? "text-green-400" : "text-red-400"}>{(token.priceChange24h || 0) >= 0 ? "+" : ""}{(token.priceChange24h || 0) > 999 ? "999+" : (token.priceChange24h || 0).toFixed(1)}%</span>
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        MC: ${(token.marketCap || 0) > 1000000 ? ((token.marketCap || 0) / 1000000).toFixed(1) + 'M' : ((token.marketCap || 0) / 1000).toFixed(0) + 'K'}
                      </div>
                    </div>
                  </div>
                  </div>
                  {index < trendingTokens.length - 1 && (
                    <div className="border-b border-border/50 mx-2"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground text-xs py-4">
                No trending tokens found
              </div>
            )}
          </>
        ) : (
          currentItems.map((item, index) => (
            <div
              key={`watchlist-${item.address}`}
              className="flex items-center justify-between p-2 rounded hover:bg-accent/50 cursor-pointer text-xs"
              onClick={() => onSelect(item)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-muted-foreground text-[10px] w-4 text-center">{index + 1}</div>
                <img
                  src={item.logoUrl || "/placeholder.svg"}
                  alt={item.symbol}
                  className="w-4 h-4 rounded-full flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-medium truncate">{item.symbol}</div>
                  <div className="text-muted-foreground text-[10px] truncate">${(item.price || 0).toFixed(6)}</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-[10px] ${(item.pct24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {(item.pct24h || 0) >= 0 ? "+" : ""}
                  {(item.pct24h || 0).toFixed(1)}%
                </div>
                <div className="text-muted-foreground text-[10px]">${((item.vol24h || 0) / 1000).toFixed(0)}K</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
