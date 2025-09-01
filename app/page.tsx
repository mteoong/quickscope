"use client"

import { useState, useEffect } from "react"
import { Crosshair } from "lucide-react"
import { SidebarSearch } from "@/components/sidebar-search"
import { TabbedTokenList } from "@/components/tabbed-token-list"
import { TokenHeader } from "@/components/token-header"
import { CandleChart } from "@/components/candle-chart"
import { SecurityMetricsGrid } from "@/components/security-metrics-grid"
import { TradingPanel } from "@/components/trading-panel"
import { VolumeCard } from "@/components/volume-card"
import { HoldersTradersCard } from "@/components/holders-traders-card"
import { LiquidityCard } from "@/components/liquidity-card" // Import LiquidityCard
import { TokenInfoCard } from "@/components/token-info-card" // Import TokenInfoCard
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { mockTokens, mockSelectedToken, mockVolumeData } from "@/lib/mock-data"
import { TokenDataService } from "@/lib/token-data-service"
import type { TokenSummary, SidebarItem, TokenData } from "@/lib/types"
import { getUpdateRate } from "@/lib/config/api-config"

export default function CryptoTerminal() {
  const [selectedToken, setSelectedToken] = useState<TokenSummary>(mockSelectedToken)
  const [timeframe, setTimeframe] = useState("1h")
  const [customAddress, setCustomAddress] = useState<{ address: string; type: 'token' | 'pool' } | null>(null)
  const [tokenData, setTokenData] = useState<TokenData | null>(null)

  const handleTokenSelect = (token: SidebarItem) => {
    const tokenSummary: TokenSummary = {
      id: token.address,
      name: token.symbol,
      symbol: token.symbol,
      logoUrl: token.logoUrl,
      network: "SOL",
      priceUsd: token.price,
      change24hPct: token.pct24h,
      mcUsd: 5686000,
      liqUsd: 92800,
      vol24hUsd: 9359378,
      fees24h: "0.14 SOL",
      dex: "Raydium",
      pairTitle: `${token.symbol}/SOL on Raydium`,
      candleOHLC: mockSelectedToken.candleOHLC,
    }
    setSelectedToken(tokenSummary)
    setCustomAddress(null) // Clear custom address when selecting from list
    setTokenData(null) // Clear token data when selecting from list
  }

  const handleAddressSubmit = async (address: string, type: 'token' | 'pool', imageUrl?: string) => {
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
      console.log('Main page: Fetching token data for', address, 'on', network)
      const data = await TokenDataService.getTokenData(address, network)
      console.log('Main page: Received token data:', data)
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
  }

  // Load default token on page load
  useEffect(() => {
    const defaultAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC on Solana
    handleAddressSubmit(defaultAddress, 'token')
  }, [])

  // Effect to refresh token data periodically
  useEffect(() => {
    if (!customAddress) return

    const interval = setInterval(async () => {
      try {
        const network = customAddress.address.startsWith('0x') ? 'ethereum' : 'solana'
        const data = await TokenDataService.refreshTokenData(customAddress.address, network)
        setTokenData(data)
      } catch (error) {
        console.error('Failed to refresh token data:', error)
      }
    }, getUpdateRate()) // Refresh every 5 seconds (configurable)

    return () => clearInterval(interval)
  }, [customAddress])

  return (
    <div className="bg-background text-foreground">
      {/* SIMPLE LAYOUT TEST - Remove all height constraints */}
      <div className="flex" style={{ minHeight: '2000px' }}>
        {/* Left Sidebar - Fixed width, fixed height */}
        <div className="w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col h-screen flex-shrink-0">
          {/* Fixed header */}
          <div className="flex items-center gap-2 p-3 border-b border-sidebar-border flex-shrink-0">
            <Crosshair className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-sidebar-foreground uppercase tracking-widest font-mono flex-1">QUICKSCOPE</h1>
          </div>
          
          {/* Fixed search */}
          <div className="flex-shrink-0">
            <SidebarSearch onAddressSubmit={handleAddressSubmit} />
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            <TabbedTokenList
              trendingItems={mockTokens}
              watchlistItems={mockTokens.slice(0, 5)}
              onSelect={handleTokenSelect}
              onTrendingSelect={handleAddressSubmit}
            />
          </div>
          
          {/* Fixed sign-in button at bottom */}
          <div className="border-t border-sidebar-border p-3 flex-shrink-0 bg-sidebar">
            <button className="w-full bg-primary text-primary-foreground py-2 px-4 rounded text-sm font-medium hover:bg-primary/90 transition-colors">
              Sign In
            </button>
          </div>
        </div>

        {/* Center Column - FORCE TALL CONTENT */}
        <div className="flex-1 bg-background overflow-y-scroll p-1" style={{ height: '2000px' }}>
          <TokenHeader 
            token={selectedToken} 
            tokenData={tokenData}
            timeframe={timeframe} 
            onTimeframeChange={setTimeframe} 
          />
          
          <ResizablePanelGroup direction="vertical" className="h-[1200px]">
            <ResizablePanel defaultSize={70} minSize={40} maxSize={90}>
              <CandleChart 
                data={selectedToken.candleOHLC} 
                timeframe={timeframe}
                tokenAddress={customAddress?.address || (selectedToken.symbol.toLowerCase() === 'egl' ? 'solana' : selectedToken.symbol.toLowerCase())}
                tokenSymbol={selectedToken.symbol}
                addressType={customAddress?.type}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={30} minSize={10} maxSize={60}>
              <div className="flex gap-2 h-full pt-2">
                <div className="w-[30%] space-y-2">
                  <VolumeCard data={mockVolumeData} />
                  <LiquidityCard data={mockVolumeData} />
                </div>
                <div className="flex-1">
                  <HoldersTradersCard 
                    tokenAddress={customAddress?.address || selectedToken.id}
                    network={(customAddress?.address || selectedToken.id).startsWith('0x') ? 'ethereum' : 'solana'}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
          
          {/* FORCE OVERFLOW - DEBUG SECTION */}
          <div className="bg-red-500 text-white p-4 text-center font-bold">
            FORCED OVERFLOW CONTENT - Should extend beyond 934px constraint
          </div>
          <div className="bg-blue-500 text-white p-4 text-center h-[300px]">
            MORE FORCED CONTENT - Total height should now be 1500px+
          </div>
          <div className="bg-green-500 text-white p-4 text-center h-[200px]">
            FINAL OVERFLOW SECTION - This should definitely create scrollable content
          </div>
        </div>

        {/* Right Column - Trading interface */}
        <div className="bg-sidebar border-l border-sidebar-border flex flex-col h-screen overflow-y-auto scrollbar-hide">
          <div className="p-2 space-y-2">
            <SecurityMetricsGrid 
              tokenSecurity={tokenData?.security}
              isLoading={tokenData?.isLoading}
            />
            <TradingPanel />
            <TokenInfoCard 
              tokenData={tokenData}
              selectedTokenAddress={customAddress?.address || selectedToken.id}
              selectedTokenSymbol={selectedToken.symbol}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
