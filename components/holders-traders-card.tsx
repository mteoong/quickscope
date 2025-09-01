"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Star } from "lucide-react"
import { TokenDataService } from "@/lib/token-data-service"
import { getUpdateRate } from "@/lib/config/api-config"
import type { TokenHolder, TraderData } from "@/lib/types"

const mockHolders = [
  { rank: 1, address: "6pM...xFbL", percentage: 4.92, amount: "49.2M", total: "999.9M", value: "$118.1K" },
  { rank: 2, address: "Ep6...2gF5", percentage: 2.89, amount: "28.9M", total: "999.9M", value: "$69.4K" },
  { rank: 3, address: "8vm...jhkC", percentage: 1.94, amount: "19.4M", total: "999.9M", value: "$46.7K" },
  { rank: 4, address: "63A...qCzw", percentage: 1.67, amount: "16.7M", total: "999.9M", value: "$40.2K" },
  { rank: 5, address: "B85...AhjB", percentage: 1.27, amount: "12.7M", total: "999.9M", value: "$30.6K" },
  { rank: 6, address: "ALE...MviC", percentage: 1.09, amount: "10.9M", total: "999.9M", value: "$26.3K" },
  { rank: 7, address: "5HM...CUdX", percentage: 1.01, amount: "10.1M", total: "999.9M", value: "$24.2K" },
  { rank: 8, address: "6Yt...zoxG", percentage: 0.95, amount: "9.5M", total: "999.9M", value: "$22.7K" },
]

const mockTraders = [
  {
    rank: 1,
    trader: "DCjuur...Ljbi",
    bought: "$2,197.02",
    boughtTokens: "19.79M",
    boughtTx: "4 tx",
    sold: "$14.2K",
    soldTokens: "19.79M",
    soldTx: "2 tx",
    pnl: "$12K",
    pnlPercent: "+547%",
    balance: "19.8M",
  },
  {
    rank: 2,
    trader: "6Tvwam...3vzZ",
    bought: "$1,145.21",
    boughtTokens: "9.482M",
    boughtTx: "3 tx",
    sold: "$10K",
    soldTokens: "9.482M",
    soldTx: "3 tx",
    pnl: "$8,887.38",
    pnlPercent: "+776%",
    balance: "9.48M",
  },
  {
    rank: 3,
    trader: "Ca3pTj...ZL2R",
    bought: "$1,432.74",
    boughtTokens: "18.97M",
    boughtTx: "2 tx",
    sold: "$9,400.84",
    soldTokens: "8.889M",
    soldTx: "6 tx",
    pnl: "$8,729.52",
    pnlPercent: "+131%",
    balance: "19M",
  },
  {
    rank: 4,
    trader: "3K4mKD...KBVg",
    bought: "$460.19",
    boughtTokens: "28.52M",
    boughtTx: "1 tx",
    sold: "$8,584.15",
    soldTokens: "28.52M",
    soldTx: "6 tx",
    pnl: "$8,123.96",
    pnlPercent: "+177%",
    balance: "28.5M",
  },
  {
    rank: 5,
    trader: "GHH3Rk...wG9D",
    bought: "$1,624.46",
    boughtTokens: "9.531M",
    boughtTx: "5 tx",
    sold: "$8,713.52",
    soldTokens: "8.531M",
    soldTx: "8 tx",
    pnl: "$7,259.50",
    pnlPercent: "+499%",
    balance: "9.53M",
  },
]

interface HoldersTradersCardProps {
  tokenAddress?: string
  network?: string
}

export function HoldersTradersCard({ tokenAddress, network = "solana" }: HoldersTradersCardProps = {}) {
  const [activeTab, setActiveTab] = useState("holders")
  const [holders, setHolders] = useState<TokenHolder[]>([])
  const [traders, setTraders] = useState<TraderData[]>([])
  const [isLoadingHolders, setIsLoadingHolders] = useState(false)
  const [isLoadingTraders, setIsLoadingTraders] = useState(false)

  // Fetch holders data
  useEffect(() => {
    console.log('HoldersTradersCard: tokenAddress =', tokenAddress, 'network =', network)
    if (!tokenAddress) return

    const fetchHolders = async (showLoading = true) => {
      console.log('HoldersTradersCard: Starting to fetch holders for', tokenAddress, 'on', network)
      if (showLoading) {
        setIsLoadingHolders(true)
      }
      try {
        const holdersData = await TokenDataService.getTokenHolders(tokenAddress, network, 20)
        console.log('HoldersTradersCard: Received holders data:', holdersData)
        setHolders(holdersData)
      } catch (error) {
        console.error('Failed to fetch holders:', error)
        if (showLoading) {
          setHolders([])
        }
      } finally {
        if (showLoading) {
          setIsLoadingHolders(false)
        }
      }
    }

    fetchHolders(true) // Show loading on initial fetch

    // Auto-refresh holders data silently (no loading state)
    const interval = setInterval(() => fetchHolders(false), getUpdateRate())
    return () => clearInterval(interval)
  }, [tokenAddress, network])

  // Fetch traders data
  useEffect(() => {
    if (!tokenAddress) return

    const fetchTraders = async (showLoading = true) => {
      if (showLoading) {
        setIsLoadingTraders(true)
      }
      try {
        const tradersData = await TokenDataService.getTopTraders(tokenAddress)
        setTraders(tradersData)
      } catch (error) {
        console.error('Failed to fetch traders:', error)
        if (showLoading) {
          setTraders([])
        }
      } finally {
        if (showLoading) {
          setIsLoadingTraders(false)
        }
      }
    }

    fetchTraders(true) // Show loading on initial fetch

    // Auto-refresh traders data silently (no loading state)
    const interval = setInterval(() => fetchTraders(false), getUpdateRate())
    return () => clearInterval(interval)
  }, [tokenAddress])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(0)
  }

  const formatAddress = (address: string) => {
    if (address.length <= 8) return address
    return `${address.slice(0, 3)}...${address.slice(-4)}`
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="holders">Top Holders</TabsTrigger>
            <TabsTrigger value="traders">Top Traders</TabsTrigger>
          </TabsList>

          <TabsContent value="holders" className="mt-4">
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 holders-scrollbar">
              <div className="grid grid-cols-5 gap-4 text-xs text-muted-foreground font-medium pb-2 border-b border-border">
                <div>RANK</div>
                <div>ADDRESS</div>
                <div>%</div>
                <div>AMOUNT</div>
                <div>VALUE</div>
              </div>

              {isLoadingHolders ? (
                <div className="text-center text-muted-foreground text-xs py-4">
                  Loading holders...
                </div>
              ) : holders.length > 0 ? (
                holders.map((holder) => (
                  <div key={holder.rank} className="grid grid-cols-5 gap-4 text-xs py-2 hover:bg-muted/50 rounded-sm">
                    <div className="text-muted-foreground">#{holder.rank}</div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{formatAddress(holder.address)}</span>
                      <Copy
                        className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => copyToClipboard(holder.address)}
                      />
                    </div>
                    <div className="font-medium">{holder.percentage.toFixed(2)}%</div>
                    <div className="space-y-1">
                      <div className="font-medium">{holder.amount}</div>
                      <div className="w-full bg-muted rounded-full h-1">
                        <div className="bg-yellow-500 h-1 rounded-full" style={{ width: `${Math.min(holder.percentage * 20, 100)}%` }} />
                      </div>
                    </div>
                    <div className="font-medium text-green-400">{formatValue(holder.value)}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-xs py-4">
                  {tokenAddress ? 'No holder data available' : 'Select a token to view holders'}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="traders" className="mt-4">
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 holders-scrollbar">
              <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground font-medium pb-2 border-b border-border">
                <div>Trader</div>
                <div>Bought</div>
                <div>Sold</div>
                <div>PnL</div>
                <div>Balance</div>
              </div>

              {isLoadingTraders ? (
                <div className="text-center text-muted-foreground text-xs py-4">
                  Loading traders...
                </div>
              ) : traders.length > 0 ? (
                traders.map((trader) => (
                  <div key={trader.rank} className="grid grid-cols-5 gap-2 text-xs py-2 hover:bg-muted/50 rounded-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">#{trader.rank}</span>
                      <Star className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono">{trader.trader}</span>
                      <Copy
                        className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => copyToClipboard(trader.trader)}
                      />
                    </div>
                    <div>
                      <div className="font-medium">{trader.bought}</div>
                      <div className="text-muted-foreground">
                        {trader.boughtTokens} {trader.boughtTx}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{trader.sold}</div>
                      <div className="text-muted-foreground">
                        {trader.soldTokens} {trader.soldTx}
                      </div>
                    </div>
                    <div>
                      <div className={`font-medium ${trader.pnl.startsWith('$-') ? 'text-red-400' : 'text-green-400'}`}>
                        {trader.pnl}
                      </div>
                      <div className={trader.pnlPercent.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                        {trader.pnlPercent}
                      </div>
                    </div>
                    <div className="font-medium">{trader.balance}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-xs py-4">
                  {tokenAddress ? 'No trader data available' : 'Select a token to view traders'}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardHeader>
    </Card>
  )
}
