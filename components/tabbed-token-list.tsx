"use client"

import { useState, useEffect } from "react"
import type { TrendingToken } from "@/lib/apis/trending"
import { getTrendingUpdateRate } from "@/lib/config/api-config"

interface TabbedTokenListProps {
  onTrendingSelect: (address: string, type: 'token' | 'pool', imageUrl?: string) => void
}

export function TabbedTokenList({ onTrendingSelect }: TabbedTokenListProps) {
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch trending tokens with retry logic
  useEffect(() => {
    const fetchTrending = async (showLoading = false) => {
      if (showLoading) setIsLoading(true)

      let retries = 0
      const maxRetries = 3

      while (retries <= maxRetries) {
        try {
          const response = await fetch('/api/trending')

          // Check if response is ok
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()

          if (data.success) {
            setTrendingTokens(data.data)
            break // Success - exit retry loop
          } else {
            console.error('Trending API error:', data.error)

            // If this is the last retry or initial load, clear tokens
            if (retries === maxRetries) {
              if (showLoading) setTrendingTokens([])
            } else {
              // Retry after delay
              retries++
              const delay = Math.min(1000 * Math.pow(2, retries - 1), 5000) // Exponential backoff, max 5s
              console.log(`Retrying trending fetch (${retries}/${maxRetries}) in ${delay}ms...`)
              await new Promise(resolve => setTimeout(resolve, delay))
            }
          }
        } catch (error) {
          console.error(`Failed to fetch trending tokens (attempt ${retries + 1}/${maxRetries + 1}):`, error)

          if (retries === maxRetries) {
            // Final retry failed - keep existing data or clear on initial load
            if (showLoading) setTrendingTokens([])
            break
          } else {
            // Retry after delay
            retries++
            const delay = Math.min(1000 * Math.pow(2, retries - 1), 5000) // Exponential backoff, max 5s
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      if (showLoading) setIsLoading(false)
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

  return (
    <div className="py-4">
      <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Trending Tokens
      </div>
      <div className="divide-y divide-border/50">
        {isLoading ? (
          <div className="text-center text-muted-foreground text-xs py-4">
            Loading trending...
          </div>
        ) : trendingTokens.length > 0 ? (
          trendingTokens.map((token, index) => (
            <div key={`trending-${token.address}`}>
              <div
                className={`flex items-center px-3 py-2 cursor-pointer text-xs ${
                  index % 2 === 0 ? "bg-[#0c0f14]" : "bg-[#0e1218]"
                } hover:bg-[#141923]`}
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
                      const price = Number(token.price ?? 0)
                      
                      if (price >= 1) {
                        return price.toPrecision(6)
                      } else if (price >= 0.0001) {
                        return price.toFixed(5)
                      } else {
                        return price.toExponential(2)
                      }
                    })()}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[10px]">
                    <span className="text-muted-foreground">24h:</span> <span className={((token.priceChange24h ?? 0) >= 0) ? "text-[color:var(--buy)]" : "text-[color:var(--sell)]"}>{((token.priceChange24h ?? 0) >= 0) ? "+" : ""}{((token.priceChange24h ?? 0) > 999) ? "999+" : Number(token.priceChange24h ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="text-muted-foreground text-[10px]">
                    MC: ${((token.marketCap ?? 0) > 1000000) ? (Number(token.marketCap ?? 0) / 1000000).toFixed(1) + 'M' : (Number(token.marketCap ?? 0) / 1000).toFixed(0) + 'K'}
                  </div>
                </div>
              </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground text-xs py-4">
            No trending tokens found
          </div>
        )}
      </div>
    </div>
  )
}
