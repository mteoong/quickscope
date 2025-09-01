"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Settings } from "lucide-react"

export function AdvancedTradingPanel() {
  const [activeAction, setActiveAction] = useState<"buy" | "sell" | "auto">("buy")
  const [activeType, setActiveType] = useState<"market" | "limit">("market")
  const [sliderValue, setSliderValue] = useState([0])

  return (
    <div className="space-y-2">
      {/* Buy/Sell/Auto Toggle */}
      <div className="flex gap-1">
        <Button
          variant={activeAction === "buy" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveAction("buy")}
          className={`flex-1 terminal-compact terminal-text ${
            activeAction === "buy" ? "bg-green-600 hover:bg-green-700" : ""
          }`}
        >
          Buy
        </Button>
        <Button
          variant={activeAction === "sell" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveAction("sell")}
          className={`flex-1 terminal-compact terminal-text ${
            activeAction === "sell" ? "bg-red-600 hover:bg-red-700" : ""
          }`}
        >
          Sell
        </Button>
        <Button
          variant={activeAction === "auto" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveAction("auto")}
          className="flex-1 terminal-compact terminal-text"
        >
          Auto
        </Button>
      </div>

      {/* Market/Limit + Balance */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveType("market")}
            className={`text-xs ${activeType === "market" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Market
          </button>
          <button
            onClick={() => setActiveType("limit")}
            className={`text-xs ${activeType === "limit" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Limit
          </button>
        </div>
        <div className="text-xs text-muted-foreground">Bal: 0 SOL</div>
      </div>

      {/* Amount + SOL */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Amount</div>
        <div className="text-xs">SOL</div>
      </div>

      {/* Amount Presets */}
      <div className="flex gap-1">
        {["0.01", "0.1", "0.5", "1"].map((amount) => (
          <div key={amount} className="flex-1 bg-card border border-border terminal-compact text-center text-xs">
            {amount}
          </div>
        ))}
        <Button variant="ghost" size="sm" className="terminal-compact">
          <Settings className="h-3 w-3" />
        </Button>
      </div>

      {/* Price Input */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Price</span>
        <Input
          value="0.000006109722672096"
          className="flex-1 terminal-compact terminal-text bg-transparent border-0 p-0 text-xs"
          readOnly
        />
        <span className="text-xs">$</span>
      </div>

      {/* Percentage Slider */}
      <div className="space-y-1">
        <Slider value={sliderValue} onValueChange={setSliderValue} max={100} min={-100} step={1} className="w-full" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>-100%</span>
          <span>-50%</span>
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
          <div className="flex items-center gap-1">
            <span>8</span>
            <span>%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
