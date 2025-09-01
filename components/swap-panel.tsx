"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Menu, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SwapPanelProps {
  onTokenSelect: () => void
}

export function SwapPanel({ onTokenSelect }: SwapPanelProps) {
  const [activeAction, setActiveAction] = useState<"buy" | "sell">("buy")
  const [activeType, setActiveType] = useState<"market" | "limit">("market")

  return (
    <div className="bg-[#0B0C0C] border border-[#1E1E1E] rounded-sm p-6 space-y-3 w-[380px]">
      {/* Top Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setActiveAction("buy")}
          className={`flex-1 h-10 flex items-center justify-center gap-2 text-sm font-bold rounded-sm ${
            activeAction === "buy"
              ? "bg-[#00C853] hover:bg-[#33D17A] text-white"
              : "bg-[#111217] hover:bg-[#1A1B21] text-white border border-[#1E1E1E]"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Buy
        </Button>
        <Button
          onClick={() => setActiveAction("sell")}
          className={`flex-1 h-10 flex items-center justify-center gap-2 text-sm font-bold rounded-sm ${
            activeAction === "sell"
              ? "bg-[#00C853] hover:bg-[#33D17A] text-white"
              : "bg-[#111217] hover:bg-[#1A1B21] text-white border border-[#1E1E1E]"
          }`}
        >
          <TrendingDown className="h-4 w-4" />
          Sell
        </Button>
        <Button className="h-10 w-10 p-0 bg-[#111217] hover:bg-[#1A1B21] border border-[#1E1E1E] text-white">
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Market/Limit and Balance */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveType("market")}
            className={`text-sm font-medium relative ${activeType === "market" ? "text-white" : "text-gray-400"}`}
          >
            Market
            {activeType === "market" && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#00C853]" />}
          </button>
          <button
            onClick={() => setActiveType("limit")}
            className={`text-sm font-medium relative ${activeType === "limit" ? "text-white" : "text-gray-400"}`}
          >
            Limit
            {activeType === "limit" && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#00C853]" />}
          </button>
        </div>
        <span className="text-xs text-gray-400">Bal: 0 SOL</span>
      </div>

      {/* Amount Label */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">Amount</span>
        <span className="text-sm text-gray-400">SOL</span>
      </div>

      {/* Amount Buttons */}
      <div className="flex gap-3">
        {["0.01", "0.1", "0.5", "1"].map((amount) => (
          <div
            key={amount}
            className="flex-1 h-8 bg-[#14151B] border border-[#1E1E1E] rounded-sm flex items-center justify-center cursor-pointer hover:border-[#00C853] transition-colors"
          >
            <span className="text-sm text-white font-medium">{amount}</span>
          </div>
        ))}
        <div className="h-8 w-8 bg-[#14151B] border border-[#1E1E1E] rounded-sm flex items-center justify-center cursor-pointer hover:border-[#00C853] transition-colors">
          <Settings className="h-3 w-3 text-gray-400" />
        </div>
      </div>

      {/* Main Action Button */}
      <Button
        className={`w-full h-12 text-sm font-bold rounded-sm ${
          activeAction === "buy"
            ? "bg-[#00C853] hover:bg-[#33D17A] text-white"
            : "bg-[#00C853] hover:bg-[#33D17A] text-white"
        }`}
        onClick={onTokenSelect}
      >
        {activeAction === "buy" ? "Buy" : "Sell"}
      </Button>
    </div>
  )
}
