"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Wallet, TrendingUp, TrendingDown } from "lucide-react"

export function TradingPanel() {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [amount, setAmount] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const presets = ["0.01", "0.1", "0.5", "1"]

  return (
    <div className="bg-card border border-[#1E1E1E] rounded-sm p-4 space-y-4">
      {/* Trading Tabs */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("buy")}
          className={`flex-1 h-8 text-xs font-medium bg-[#1a4d2e] hover:bg-[#1a4d2e]/90 text-white border-0 ${
            activeTab === "buy" ? "ring-1 ring-white/20" : ""
          }`}
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Buy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("sell")}
          className={`flex-1 h-8 text-xs font-medium bg-[#4d1a1a] hover:bg-[#4d1a1a]/90 text-white border-0 ${
            activeTab === "sell" ? "ring-1 ring-white/20" : ""
          }`}
        >
          <TrendingDown className="h-3 w-3 mr-1" />
          Sell
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 bg-[#0f1011] border border-[#1a1b1c] text-gray-400 hover:bg-[#1a1b1c]"
        >
          <Wallet className="h-3 w-3" />
        </Button>
      </div>

      {/* Order Type */}
      <div className="flex items-center justify-between py-2">
        <div className="flex gap-3">
          <button
            onClick={() => setOrderType("market")}
            className={`text-xs ${
              orderType === "market" ? "text-gray-300 border-b border-gray-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Market
          </button>
          <button
            disabled
            className="text-xs text-gray-600 cursor-not-allowed"
          >
            Limit
          </button>
        </div>
        <span className="text-xs text-gray-500">Bal: 0 SOL</span>
      </div>

      {/* Amount Section */}
      <div className="bg-[#0f1011] border border-[#1a1b1c] rounded-sm overflow-hidden">
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

      {/* Submit Button */}
      <Button
        className={`w-full h-10 text-sm font-medium mt-4 ${
          activeTab === "buy"
            ? "bg-[#1a4d2e] hover:bg-[#1a4d2e]/90 text-white"
            : "bg-[#4d1a1a] hover:bg-[#4d1a1a]/90 text-white"
        }`}
      >
        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
      </Button>
    </div>
  )
}
