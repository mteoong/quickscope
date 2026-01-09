"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SidebarSearchProps {
  onAddressSubmit?: (address: string, type: 'token' | 'pool') => void
}

export function SidebarSearch({ onAddressSubmit }: SidebarSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isValidating, setIsValidating] = useState(false)

  const detectAddressType = (address: string): 'token' | 'pool' | 'invalid' => {
    const trimmed = address.trim()
    
    // Ethereum address (42 chars, starts with 0x)
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      return 'token' // Default to token for ETH addresses
    }
    
    // Solana address (32-44 chars, base58)
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
      return 'token' // Default to token for Solana addresses
    }
    
    return 'invalid'
  }

  const handleSubmit = () => {
    if (!searchQuery.trim()) return
    
    const addressType = detectAddressType(searchQuery)
    if (addressType !== 'invalid' && onAddressSubmit) {
      setIsValidating(true)
      onAddressSubmit(searchQuery.trim(), addressType)
      setTimeout(() => setIsValidating(false), 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Paste token contract address..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        className="pl-10 bg-background border-border rounded-full"
      />
      {isValidating && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  )
}
