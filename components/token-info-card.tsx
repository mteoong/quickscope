"use client"

import { Card } from "@/components/ui/card"
import { Copy } from "lucide-react"
import type { TokenData } from "@/lib/types"

interface TokenInfoCardProps {
  tokenData?: TokenData | null
  selectedTokenAddress?: string
  selectedTokenSymbol?: string
}

export function TokenInfoCard({ tokenData, selectedTokenAddress, selectedTokenSymbol }: TokenInfoCardProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Get the primary pool data (most liquid pool)
  const primaryPool = tokenData?.pools?.[0]
  
  // Format numbers
  const formatNumber = (num: number | undefined) => {
    if (!num) return "—"
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B"
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M"
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K"
    return num.toFixed(0)
  }

  const formatSupply = (num: number | undefined) => {
    if (!num) return "—"
    return formatNumber(num)
  }

  // Format date for pair creation
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch {
      return "—"
    }
  }

  return (
    <Card className="p-3 space-y-3">
      {/* Basic Token Info */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Pair Created</span>
          <span className="text-xs text-foreground">
            {formatDate(tokenData?.pairCreated || primaryPool?.pairCreated)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Token Creator</span>
          <span className="text-xs text-foreground">{tokenData?.creator || "—"}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Total Supply</span>
          <span className="text-xs text-foreground">{formatSupply(tokenData?.totalSupply)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Holders</span>
          <span className="text-xs text-foreground">
            {tokenData?.holderCount ? formatNumber(tokenData.holderCount) : "—"}
          </span>
        </div>
      </div>

      {/* Token Address */}
      <div className="pt-2 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Token Address</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-foreground font-mono">
              {selectedTokenAddress ? 
                `${selectedTokenAddress.slice(0, 6)}...${selectedTokenAddress.slice(-4)}` : 
                "—"
              }
            </span>
            {selectedTokenAddress && (
              <button onClick={() => copyToClipboard(selectedTokenAddress)} className="p-1 hover:bg-muted rounded transition-colors">
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pooled Assets */}
      {primaryPool && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Pooled {primaryPool.baseToken.symbol}
            </span>
            <span className="text-xs text-foreground">
              {formatNumber(parseFloat(primaryPool.baseToken.amount))}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Pooled {primaryPool.quoteToken.symbol}
            </span>
            <span className="text-xs text-foreground">
              {formatNumber(parseFloat(primaryPool.quoteToken.amount))}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Pair Address</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-foreground font-mono">
                {primaryPool.pairAddress.slice(0, 6)}...{primaryPool.pairAddress.slice(-4)}
              </span>
              <button onClick={() => copyToClipboard(primaryPool.pairAddress)} className="p-1 hover:bg-muted rounded transition-colors">
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}