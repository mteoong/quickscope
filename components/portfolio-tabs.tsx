import { ChevronDown, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PortfolioTabs() {
  return (
    <div className="flex items-center justify-between terminal-compact">
      <div className="flex gap-1">
        <Button variant="outline" size="sm" className="terminal-compact terminal-text bg-transparent">
          P1
        </Button>
        <Button variant="ghost" size="sm" className="terminal-compact terminal-text">
          P2
        </Button>
        <Button variant="ghost" size="sm" className="terminal-compact terminal-text">
          P3
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="terminal-compact">
          <ChevronDown className="h-3 w-3" />
        </Button>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>0</span>
        </div>
        <Button variant="ghost" size="sm" className="terminal-compact">
          <Settings className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
