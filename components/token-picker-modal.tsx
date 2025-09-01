"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatPercentage } from "@/lib/utils"
import type { SidebarItem } from "@/lib/types"

interface TokenPickerModalProps {
  tokens: SidebarItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (token: SidebarItem) => void
}

export function TokenPickerModal({ tokens, open, onOpenChange, onPick }: TokenPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTokens = tokens.filter((token) => token.symbol.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Token</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {filteredTokens.map((token) => (
              <div
                key={token.address}
                onClick={() => onPick(token)}
                className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer rounded-lg transition-colors"
              >
                <img src={token.logoUrl || "/placeholder.svg"} alt={token.symbol} className="w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{token.symbol}</span>
                    <div className="flex gap-1">
                      {token.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">${formatPrice(token.price)}</span>
                    <span className={`text-sm font-medium ${token.pct24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatPercentage(token.pct24h)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
