"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Wallet, TrendingUp, TrendingDown, Waves, Rabbit, Shield, ShieldOff, SlidersHorizontal, ChevronDown } from "lucide-react"

interface TradingPanelProps {
  tokenSymbol?: string
}

export function TradingPanel({ tokenSymbol = "TOKEN" }: TradingPanelProps) {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [amount, setAmount] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [slippage, setSlippage] = useState("20")
  const [priorityFee, setPriorityFee] = useState("0.001")
  const [bribeFee, setBribeFee] = useState("0.001")
  const [mevProtection, setMevProtection] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [activeSetting, setActiveSetting] = useState<"slippage" | "priority" | "bribe" | null>(null)
  const settingsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!showSettings) return
    const handleClickOutside = (event: MouseEvent) => {
      if (!settingsRef.current) return
      if (!settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showSettings])

  const presets = ["0.01", "0.1", "0.5", "1"]
  const displaySymbol = tokenSymbol.trim().length > 0 ? tokenSymbol.toUpperCase() : "TOKEN"
  return (
    <div className="space-y-4 px-3 py-3">
      {/* Trading Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 h-9 rounded-md border border-border/50 bg-muted/30 p-[2px]">
          <button
            type="button"
            onClick={() => setActiveTab("buy")}
            className={`flex-1 h-full text-xs font-medium rounded-[6px] transition-colors ${
              activeTab === "buy"
                ? "bg-[color:var(--buy)]/20 text-[color:var(--buy)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Buy
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sell")}
            className={`flex-1 h-full text-xs font-medium rounded-[6px] transition-colors ${
              activeTab === "sell"
                ? "bg-[color:var(--sell)]/20 text-[color:var(--sell)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Sell
            </span>
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 rounded-full border border-border/50 bg-muted/30 text-gray-400 hover:bg-muted/40"
        >
          <Wallet className="h-3 w-3" />
        </Button>
      </div>

      {/* Order Type */}
      <div className="flex items-center justify-between py-1">
        <div className="flex gap-3">
          <button
            onClick={() => setOrderType("market")}
            className={`text-xs ${
              orderType === "market" ? "text-gray-300 border-b border-gray-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Market
          </button>
        </div>
        <span className="text-xs text-gray-500">Bal: 0 SOL</span>
      </div>

      {/* Amount Section */}
      <div className="bg-muted/20 border border-border/50 rounded-lg overflow-hidden">
        {/* Amount Input Field */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1b1c]/50">
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setSelectedPreset(null) // Clear preset selection when manually typing
            }}
            placeholder="Amount"
            className="flex-1 bg-transparent text-gray-300 text-sm outline-none placeholder-gray-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
            step="0.01"
            min="0"
          />
          <span className="text-xs text-gray-300 ml-2">SOL</span>
        </div>

        {/* Preset Buttons */}
        <div className="flex">
          {presets.map((preset, index) => (
            <button
              key={preset}
              onClick={(e) => {
                e.preventDefault()
                setAmount(preset)
                setSelectedPreset(preset)
              }}
              className={`flex-1 h-8 text-xs rounded-none border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none ${index > 0 ? "border-l border-[#1a1b1c]/50" : ""} ${
                selectedPreset === preset
                  ? "bg-[#1a1b1c] text-gray-300"
                  : "bg-transparent text-gray-400 hover:bg-[#1a1b1c]/50"
              }`}
            >
              {preset}
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 rounded-none border-l border-[#1a1b1c]/50 bg-transparent text-gray-400 hover:bg-[#1a1b1c]/50"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Trade Settings */}
      <div className="relative flex items-center gap-2 text-[11px] text-muted-foreground flex-nowrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="group relative inline-flex items-center gap-1 min-w-0">
            <SlidersHorizontal className="h-3 w-3" />
            <span className="truncate text-foreground">{slippage}%</span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[10px] text-white group-hover:block">
              Slippage
            </span>
          </div>
          <div className="group relative inline-flex items-center gap-1 min-w-0">
            <Waves className="h-3 w-3" />
            <span className="truncate text-foreground">{priorityFee}</span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[10px] text-white group-hover:block">
              Priority Fee
            </span>
          </div>
          <div className="group relative inline-flex items-center gap-1 min-w-0">
            <Rabbit className="h-3 w-3" />
            <span className="truncate text-foreground">{bribeFee}</span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[10px] text-white group-hover:block">
              Bribe Fee
            </span>
          </div>
          <div className="group relative inline-flex items-center gap-1 min-w-0">
            {mevProtection ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
            <span className="truncate text-foreground">{mevProtection ? "On" : "Off"}</span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[10px] text-white group-hover:block">
              MEV Protection
            </span>
          </div>
        </div>
        <button
          type="button"
          className="ml-1 inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted/30 cursor-pointer"
          aria-label="Edit trade settings"
          onClick={() => setShowSettings((prev) => !prev)}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        {showSettings && (
          <div ref={settingsRef} className="absolute right-0 top-full mt-2 w-64 rounded-md border border-border/60 bg-[#0f131a] p-2 shadow-lg z-10">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Slippage</span>
                <div className={`flex items-center gap-1 rounded-sm border px-2 py-1 min-w-[96px] justify-between ${activeSetting === "slippage" ? "border-border/90 bg-muted/30" : "border-border/60 bg-transparent"}`}>
                  <input
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    onFocus={() => setActiveSetting("slippage")}
                    onBlur={() => setActiveSetting(null)}
                    className="w-10 bg-transparent text-right text-foreground outline-none"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Priority Fee (SOL)</span>
                <div className={`flex items-center gap-1 rounded-sm border px-2 py-1 min-w-[96px] justify-between ${activeSetting === "priority" ? "border-border/90 bg-muted/30" : "border-border/60 bg-transparent"}`}>
                  <input
                    value={priorityFee}
                    onChange={(e) => setPriorityFee(e.target.value)}
                    onFocus={() => setActiveSetting("priority")}
                    onBlur={() => setActiveSetting(null)}
                    className="w-12 bg-transparent text-right text-foreground outline-none"
                  />
                  <span className="text-muted-foreground">SOL</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tip Fee (SOL)</span>
                <div className={`flex items-center gap-1 rounded-sm border px-2 py-1 min-w-[96px] justify-between ${activeSetting === "bribe" ? "border-border/90 bg-muted/30" : "border-border/60 bg-transparent"}`}>
                  <input
                    value={bribeFee}
                    onChange={(e) => setBribeFee(e.target.value)}
                    onFocus={() => setActiveSetting("bribe")}
                    onBlur={() => setActiveSetting(null)}
                    className="w-12 bg-transparent text-right text-foreground outline-none"
                  />
                  <span className="text-muted-foreground">SOL</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Anti-MEV RPC</span>
                <button
                  type="button"
                  onClick={() => setMevProtection((prev) => !prev)}
                  className="inline-flex items-center gap-2"
                >
                  <div className={`h-3 w-6 rounded-full border border-border/50 flex items-center px-[2px] ${mevProtection ? "bg-[color:var(--buy)]/30" : "bg-muted/30"}`}>
                    <div className={`h-2.5 w-2.5 rounded-full bg-foreground transition-transform ${mevProtection ? "translate-x-3" : "translate-x-0"}`} />
                  </div>
                  <span className="text-foreground">{mevProtection ? "On" : "Off"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        className={`w-full h-10 text-sm font-medium mt-2 rounded-full ${
          activeTab === "buy"
            ? "bg-[color:var(--buy)] hover:bg-[#25c28e] text-black"
            : "bg-[color:var(--sell)] hover:bg-[#e04360] text-black"
        }`}
      >
        {activeTab === "buy" ? "Buy" : "Sell"} {displaySymbol}
      </Button>
    </div>
  )
}
