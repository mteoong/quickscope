"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatPercentage } from "@/lib/utils"
import type { SidebarItem } from "@/lib/types"

interface TrendingListProps {
  items: SidebarItem[]
  onSelect: (item: SidebarItem) => void
}

export function TrendingList({ items, onSelect }: TrendingListProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null)

  const handleSelect = (item: SidebarItem) => {
    setActiveItem(item.address)
    onSelect(item)
  }

  return (
    <Card className="flex-1 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Trending</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {items.map((item, index) => {
            // Create a unique key combining address and index to prevent duplicates
            const uniqueKey = `trending-${item.address}-${index}`
            console.log(`🔑 [TRENDING RENDER] Rendering item with key: ${uniqueKey}`, {
              address: item.address,
              symbol: item.symbol,
              index: index
            })
            
            return (
              <div
                key={uniqueKey}
                onClick={() => handleSelect(item)}
                className={`flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors ${
                  activeItem === item.address ? "bg-accent/30" : ""
                }`}
              >
                <img src={item.logoUrl || "/placeholder.svg"} alt={item.symbol} className="w-5 h-5 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{item.symbol}</span>
                    <div className="flex gap-1">
                      {item.tags.map((tag, tagIndex) => (
                        <Badge key={`${uniqueKey}-tag-${tag}-${tagIndex}`} variant="secondary" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">${formatPrice(item.price)}</span>
                    <span className={`text-xs font-medium ${item.pct24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatPercentage(item.pct24h)}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-6 bg-muted/30 rounded flex items-center justify-center">
                  <div className="text-xs text-muted-foreground">📈</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
