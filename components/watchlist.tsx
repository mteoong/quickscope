"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { formatPrice, formatPercentage } from "@/lib/utils"
import type { SidebarItem } from "@/lib/types"

interface WatchlistProps {
  items: SidebarItem[]
  onSelect: (item: SidebarItem) => void
}

export function Watchlist({ items, onSelect }: WatchlistProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [activeItem, setActiveItem] = useState<string | null>(null)

  const handleSelect = (item: SidebarItem) => {
    setActiveItem(item.address)
    onSelect(item)
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 h-auto">
            <span className="text-sm font-medium">Watchlist</span>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.address}
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
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
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
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm">Sign in</span>
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
