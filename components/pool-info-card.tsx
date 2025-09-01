"use client"

import { Card } from "@/components/ui/card"
import { Copy } from "lucide-react"

interface PoolInfoCardProps {
  pairCreated: string
  pooledCRO: {
    amount: string
    value: string
  }
  pooledWETH: {
    amount: string
    value: string
  }
  addresses: {
    CRO: string
    WETH: string
    Pair: string
  }
}

export function PoolInfoCard({ pairCreated, pooledCRO, pooledWETH, addresses }: PoolInfoCardProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card className="p-3 space-y-3">
      {/* Pair Created */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Pair created</span>
        <span className="text-xs text-foreground">{pairCreated}</span>
      </div>

      {/* Pooled Assets */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Pooled CRO</span>
          <span className="text-xs text-foreground">
            {pooledCRO.amount} {pooledCRO.value}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Pooled WETH</span>
          <span className="text-xs text-foreground">
            {pooledWETH.amount} {pooledWETH.value}
          </span>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="space-y-2 pt-2 border-t border-border">
        {Object.entries(addresses).map(([label, address]) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{label}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-foreground font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <button onClick={() => copyToClipboard(address)} className="p-1 hover:bg-muted rounded transition-colors">
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
