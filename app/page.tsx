"use client"

import React, { useState, useEffect } from "react"
import { Crosshair, ChevronUp, ChevronDown } from "lucide-react"
import { SidebarSearch } from "@/components/sidebar-search"
import { TabbedTokenList } from "@/components/tabbed-token-list"
import { TokenHeader } from "@/components/token-header"
import { CandleChart } from "@/components/candle-chart"
import { SecurityMetricsGrid } from "@/components/security-metrics-grid"
import { TradingPanel } from "@/components/trading-panel"
import { HoldersTradersCard } from "@/components/holders-traders-card"
import { TokenInfoCard } from "@/components/token-info-card"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { mockSelectedToken } from "@/lib/mock-data"
import { TokenDataService } from "@/lib/token-data-service"
import type { TokenSummary, TokenData } from "@/lib/types"
// import { getUpdateRate } from "@/lib/config/api-config" // Disabled for debugging

// Force dynamic rendering to prevent stale data issues
export const dynamic = 'force-dynamic'

export default function CryptoTerminal() {
  const [selectedToken, setSelectedToken] = useState<TokenSummary>(mockSelectedToken)
  const [timeframe, setTimeframe] = useState("1h")
  const [customAddress, setCustomAddress] = useState<{ address: string; type: 'token' | 'pool' } | null>(null)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [layoutMode, setLayoutMode] = useState<'normal' | 'chart-max' | 'holders-max'>('normal')

  const handleAddressSubmit = React.useCallback(async (address: string, type: 'token' | 'pool', imageUrl?: string) => {
    setCustomAddress({ address, type })

    // Update selected token display info immediately
    setSelectedToken({
      ...mockSelectedToken,
      id: address,
      name: type === 'token' ? 'Loading...' : 'Custom Pool',
      symbol: address.slice(0, 8) + '...',
      logoUrl: imageUrl || mockSelectedToken.logoUrl,
      pairTitle: `Custom ${type} - ${address.slice(0, 12)}...`
    })

    // Fetch comprehensive token data
    try {
      // Detect network from address format
      const network = address.startsWith('0x') ? 'ethereum' : 'solana'
      const data = await TokenDataService.getTokenData(address, network)
      setTokenData(data)

      // Update token display with fetched data
      if (data.name && data.symbol) {
        setSelectedToken(prev => ({
          ...prev,
          name: data.name,
          symbol: data.symbol,
          priceUsd: data.price,
          mcUsd: data.marketCap || 0,
          liqUsd: data.liquidity || 0,
          vol24hUsd: data.volume24h || 0,
          change24hPct: data.priceChanges.change24h,
          logoUrl: data.image || prev.logoUrl,
          network: data.network.toUpperCase(),
          pairTitle: `${data.name} (${data.symbol}) on ${data.network}`
        }))
      }
    } catch (error) {
      console.error('Failed to fetch token data:', error)
    }
  }, [])

  // Load default token on page load
  useEffect(() => {
    const defaultAddress = '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv' // PENGU on Solana
    handleAddressSubmit(defaultAddress, 'token')
  }, [handleAddressSubmit])

  // Effect to refresh token data periodically - DISABLED FOR DEBUGGING
  // useEffect(() => {
  //   if (!customAddress) return

  //   const interval = setInterval(async () => {
  //     try {
  //       const network = customAddress.address.startsWith('0x') ? 'ethereum' : 'solana'
  //       const data = await TokenDataService.refreshTokenData(customAddress.address, network)
  //       setTokenData(data)
  //     } catch (error) {
  //       console.error('Failed to refresh token data:', error)
  //     }
  //   }, getUpdateRate()) // Refresh every 5 seconds (configurable)

  //   return () => clearInterval(interval)
  // }, [customAddress])

  // Layout control functions
  const handleArrowUp = () => {
    setLayoutMode(prev => prev === 'holders-max' ? 'normal' : 'holders-max')
  }

  const handleArrowDown = () => {
    setLayoutMode(prev => prev === 'chart-max' ? 'normal' : 'chart-max')
  }

  // Get panel sizes based on layout mode
  const getPanelSizes = () => {
    switch (layoutMode) {
      case 'chart-max':
        return { chartSize: 80, holdersSize: 20 }
      case 'holders-max':
        return { chartSize: 30, holdersSize: 70 } // Chart minimum 30%, holders maximum 70%
      default:
        return { chartSize: 65, holdersSize: 35 } // Increased default bottom half size
    }
  }

  const { chartSize, holdersSize } = getPanelSizes()

  return (
    <div className="bg-background text-foreground h-screen max-h-screen overflow-hidden">
      <div className="flex h-full">
        {/* Left Sidebar - Fixed width, fixed height */}
        <div className="w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col h-full flex-shrink-0">
          {/* Fixed header */}
          <div className="flex-shrink-0 border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
              <Crosshair className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-sidebar-foreground uppercase tracking-widest font-mono flex-1">QUICKSCOPE</h1>
            </div>
            <div className="px-3 pb-3">
              <SidebarSearch onAddressSubmit={handleAddressSubmit} />
            </div>
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            <TabbedTokenList
              onTrendingSelect={handleAddressSubmit}
            />
          </div>
          
          {/* Fixed sign-in button at bottom */}
          <div className="border-t border-sidebar-border p-3 flex-shrink-0 bg-sidebar">
            <button className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors cursor-not-allowed">
              Sign In
            </button>
          </div>
        </div>

        {/* Center Column */}
        <div className="flex-1 bg-background p-1 h-full flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col divide-y divide-border/50">
            <div className="flex-shrink-0">
              <TokenHeader 
                token={selectedToken} 
                tokenData={tokenData}
                timeframe={timeframe} 
                onTimeframeChange={setTimeframe} 
              />
            </div>

            <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0" key={layoutMode}>
              <ResizablePanel defaultSize={chartSize} minSize={30} maxSize={80}>
                <div className="relative h-full">
                  <CandleChart 
                    data={selectedToken.candleOHLC} 
                    timeframe={timeframe}
                    tokenAddress={customAddress?.address || '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv'}
                    tokenSymbol={selectedToken.symbol}
                    addressType={customAddress?.type}
                  />
                {/* Arrow controls positioned at bottom right */}
                <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
                  <button
                    onClick={handleArrowUp}
                    className={`bg-black/60 hover:bg-black/80 text-white p-1 rounded transition-colors ${
                      layoutMode === 'holders-max' ? 'bg-primary/60' : ''
                    }`}
                    title={layoutMode === 'holders-max' ? 'Reset to normal view' : 'Expand holders section'}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleArrowDown}
                    className={`bg-black/60 hover:bg-black/80 text-white p-1 rounded transition-colors ${
                      layoutMode === 'chart-max' ? 'bg-primary/60' : ''
                    }`}
                    title={layoutMode === 'chart-max' ? 'Reset to normal view' : 'Maximize chart section'}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={holdersSize} minSize={20} maxSize={70}>
                <div className="py-2 h-full overflow-hidden flex flex-col">
                  <div className="flex-1 min-h-0 min-w-0 p-2">
                    <HoldersTradersCard 
                      tokenAddress={customAddress?.address || selectedToken.id}
                      network={(customAddress?.address || selectedToken.id).startsWith('0x') ? 'ethereum' : 'solana'}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
          
        </div>

        {/* Right Column - Trading interface */}
        <div className="w-[320px] bg-sidebar border-l border-sidebar-border flex flex-col h-full overflow-y-auto scrollbar-hide">
          <div className="divide-y divide-border/50">
            <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Token Audit
            </div>
            <SecurityMetricsGrid 
              key={tokenData?.address || 'loading'}
              tokenSecurity={tokenData?.security}
              isLoading={tokenData?.isLoading}
              mode="score"
            />
            <SecurityMetricsGrid 
              key={`${tokenData?.address || 'loading'}-grid`}
              tokenSecurity={tokenData?.security}
              isLoading={tokenData?.isLoading}
              mode="grid"
            />
            <TradingPanel tokenSymbol={selectedToken.symbol} />
            <div>
              <div className="px-3 pt-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Token Info
              </div>
              <TokenInfoCard 
                tokenData={tokenData}
                selectedTokenAddress={customAddress?.address || selectedToken.id}
                selectedTokenSymbol={selectedToken.symbol}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
