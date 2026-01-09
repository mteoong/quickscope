"use client"

import { useState } from "react"
import { formatNumber, formatPrice } from "@/lib/utils"
import type { TokenSummary, TokenData } from "@/lib/types"
import { Copy, Twitter, Globe, Circle, Star, Shield, AlertTriangle, ExternalLink } from "lucide-react"

interface TokenHeaderProps {
  token: TokenSummary
  tokenData?: TokenData | null
  timeframe?: string
  onTimeframeChange?: (timeframe: string) => void
}

export function TokenHeader({ token, tokenData }: TokenHeaderProps) {
  const [copiedAddress, setCopiedAddress] = useState(false)

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(tokenData?.address || token.id)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  const formatPriceChange = (change: number) => {
    const safeChange = Number(change ?? 0)
    const color = safeChange >= 0 ? 'text-[color:var(--buy)]' : 'text-[color:var(--sell)]'
    const sign = safeChange >= 0 ? '+' : ''
    return `${color} ${sign}${safeChange.toFixed(2)}%`
  }

  const getSecurityBadges = () => {
    if (!tokenData?.security) return []
    
    const badges = []
    const security = tokenData.security

    if (security.honeypot) {
      badges.push({ text: 'HONEYPOT', color: 'bg-red-500', icon: AlertTriangle })
    }
    
    if (security.buyTax > 10 || security.sellTax > 10) {
      badges.push({ text: 'HIGH TAX', color: 'bg-orange-500', icon: AlertTriangle })
    }

    if (security.hasRenounced) {
      badges.push({ text: 'RENOUNCED', color: 'bg-green-600', icon: Shield })
    }

    if (security.noMint) {
      badges.push({ text: 'NO MINT', color: 'bg-blue-600', icon: Shield })
    }

    return badges
  }

  // Use tokenData if available, fallback to token
  const displayName = tokenData?.name || token.name
  const displaySymbol = tokenData?.symbol || token.symbol
  const displayImage = tokenData?.image || token.logoUrl
  const displayPrice = tokenData?.price || token.priceUsd
  const displayMC = tokenData?.marketCap || token.mcUsd
  const displayLiq = tokenData?.liquidity || token.liqUsd
  const displayVol = tokenData?.volume24h || token.vol24hUsd

  return (
    <div className="space-y-2">
      <div className="p-0 overflow-hidden">
        <div className="flex">
          <div className="flex items-center justify-center w-8 bg-transparent border-r border-border/30">
            <button className="text-muted-foreground hover:text-yellow-400 transition-colors">
              <Star className="h-4 w-4" />
            </button>
          </div>

          <div className="w-20 h-20 flex-shrink-0 bg-transparent border-r border-border/30 p-2">
            <img
              src={displayImage || "/placeholder.svg"}
              alt={displayName}
              className="w-full h-full object-cover rounded-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg"
              }}
            />
          </div>

          <div className="flex-1 p-3">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xs font-semibold">{displayName}</h1>
                    <span className="text-xs text-muted-foreground">({displaySymbol})</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground font-mono">
                        {tokenData?.address ? 
                          `${tokenData.address.slice(0, 4)}...${tokenData.address.slice(-4)}` : 
                          token.id.slice(0, 8)
                        }
                      </span>
                      <button
                        onClick={copyAddress}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        title={copiedAddress ? "Copied!" : "Copy address"}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="w-px h-3 bg-muted-foreground opacity-30"></div>

                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full overflow-hidden bg-muted-foreground/20">
                        <img
                          src={
                            (tokenData?.network || token.network).toLowerCase() === 'ethereum' || (tokenData?.network || token.network).toLowerCase() === 'eth'
                              ? 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/info/logo.png'
                              : (tokenData?.network || token.network).toLowerCase() === 'solana' || (tokenData?.network || token.network).toLowerCase() === 'sol'
                              ? 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/solana/info/logo.png'
                              : (tokenData?.network || token.network).toLowerCase() === 'bsc'
                              ? 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/smartchain/info/logo.png'
                              : 'https://via.placeholder.com/12x12/6366f1/ffffff?text=' + (tokenData?.network || token.network).charAt(0).toUpperCase()
                          }
                          alt={tokenData?.network || token.network}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-purple-400 rounded-full flex items-center justify-center text-xs text-white font-bold">${(tokenData?.network || token.network).charAt(0).toUpperCase()}</div>`
                            }
                          }}
                        />
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {((tokenData?.network || token.network).toLowerCase() === 'ethereum' || (tokenData?.network || token.network).toLowerCase() === 'eth') 
                          ? 'ETH' 
                          : ((tokenData?.network || token.network).toLowerCase() === 'solana' || (tokenData?.network || token.network).toLowerCase() === 'sol')
                          ? 'SOL'
                          : (tokenData?.network || token.network).toLowerCase() === 'bsc'
                          ? 'BSC'
                          : (tokenData?.network || token.network).slice(0, 3).toUpperCase()
                        }
                      </span>
                    </div>

                    {/* Social links */}
                    {tokenData?.socials && (
                      <>
                        <div className="w-px h-3 bg-muted-foreground opacity-30"></div>
                        <div className="flex items-center gap-1">
                          {tokenData.socials.twitter && (
                            <a 
                              href={tokenData.socials.twitter} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-blue-400"
                            >
                              <Twitter className="h-3 w-3" />
                            </a>
                          )}
                          {tokenData.socials.website && (
                            <a 
                              href={tokenData.socials.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Globe className="h-3 w-3" />
                            </a>
                          )}
                          {tokenData.socials.telegram && (
                            <a 
                              href={tokenData.socials.telegram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </>
                    )}

                    {/* Tax information */}
                    {tokenData?.security && (tokenData.security.buyTax > 0 || tokenData.security.sellTax > 0) && (
                      <>
                        <div className="w-px h-3 bg-muted-foreground opacity-30"></div>
                        <div className="text-xs text-muted-foreground">
                          Tax: {tokenData.security.buyTax}%/{tokenData.security.sellTax}%
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-sm font-bold ${displayPrice > 0 ? 'text-foreground' : 'text-red-400'}`}>
                      ${formatPrice(displayPrice)}
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">MC </span>
                      <span className="font-medium">${formatNumber(displayMC)}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Liq</div>
                    <div className="text-xs font-medium">${formatNumber(displayLiq)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">24h Vol</div>
                    <div className="text-xs font-medium">${formatNumber(displayVol)}</div>
                  </div>

                  <div className="w-px h-8 bg-muted-foreground opacity-20"></div>

                  {/* Price changes */}
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">5m</div>
                    <div className={`text-xs font-medium ${formatPriceChange(tokenData?.priceChanges.change5m || 0).split(' ')[0]}`}>
                      {formatPriceChange(tokenData?.priceChanges.change5m || 0).split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">6h</div>
                    <div className={`text-xs font-medium ${formatPriceChange(tokenData?.priceChanges.change6h || 0).split(' ')[0]}`}>
                      {formatPriceChange(tokenData?.priceChanges.change6h || 0).split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">24h</div>
                    <div className={`text-xs font-medium ${formatPriceChange(tokenData?.priceChanges.change24h || token.change24hPct).split(' ')[0]}`}>
                      {formatPriceChange(tokenData?.priceChanges.change24h || token.change24hPct).split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading indicator */}
      {tokenData?.isLoading && (
        <div className="text-xs text-muted-foreground text-center py-1">
          Loading token data...
        </div>
      )}
      
      {/* Error indicator */}
      {tokenData?.error && (
        <div className="text-xs text-red-400 text-center py-1">
          Error loading token data: {tokenData.error}
        </div>
      )}
    </div>
  )
}
