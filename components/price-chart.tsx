"use client"

import { GeckoTerminalEmbed } from "./geckoterminal-embed"

interface PriceChartProps {
  tokenAddress: string
  addressType?: 'token' | 'pool'
  chain?: string
  className?: string
  initialTimeframe?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function PriceChart({ 
  tokenAddress, 
  addressType,
  chain = "ethereum",
  className = ""
}: PriceChartProps) {
  // If addressType is provided, use the address directly
  if (addressType) {
    return (
      <div className={`bg-card border border-border rounded-sm p-2 h-full flex flex-col ${className}`}>
        <div className="flex-1">
          <GeckoTerminalEmbed 
            address={tokenAddress}
            addressType={addressType}
            theme="dark"
          />
        </div>
      </div>
    )
  }

  // Legacy behavior: map token addresses to pool addresses
  const getPoolAddress = () => {
    if (tokenAddress.toLowerCase() === 'solana') {
      return 'EP2ib6dYdEeqD8MfE2ezHCxX3kP3K2eLKkirfPm5eyMx' // WIF/SOL pool
    }
    // Default fallback or could return tokenAddress if it's already a pool address
    return tokenAddress
  }

  const getNetwork = () => {
    if (tokenAddress.toLowerCase() === 'solana' || chain === 'solana') {
      return 'solana'
    }
    return 'eth' // Default to Ethereum
  }

  return (
    <div className={`bg-card border border-border rounded-sm p-2 h-full flex flex-col ${className}`}>
      <div className="flex-1">
        <GeckoTerminalEmbed 
          poolAddress={getPoolAddress()}
          network={getNetwork()}
          theme="dark"
        />
      </div>
    </div>
  )
}