"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import type { SafetyScore } from "@/lib/types"

interface SafetyScoreCardProps {
  score: SafetyScore
}

export function SafetyScoreCard({ score }: SafetyScoreCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">DEXTscore</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Gauge */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-primary">
            <div className="text-center">
              <div className="text-lg font-bold">{score.score}</div>
              <div className="text-xs text-muted-foreground">/99</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Project reliability score based on:</p>
          <div className="flex justify-center gap-1 mt-1">
            {score.bullets.map((bullet, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary" />
            ))}
          </div>
        </div>

        {/* Security Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          {/* Row 1 */}
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Top 10</div>
            <div className="font-medium">0%</div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">DEV</div>
            <div className="font-medium">0%</div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Holders</div>
            <div className="font-medium">1</div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Snipers</div>
            <div className="font-medium">0%</div>
          </div>

          {/* Row 2 */}
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Insiders</div>
            <div className="font-medium">0%</div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Phishing</div>
            <div className="font-medium">0%</div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Bundler</div>
            <div className="font-medium">0%</div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Dex Paid</div>
            <div className="font-medium">Unpaid</div>
          </div>

          {/* Row 3 */}
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">NoMint</div>
            <div className="font-medium">
              <CheckCircle className="h-3 w-3 text-green-400 mx-auto" />
            </div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Blacklist</div>
            <div className="font-medium">No</div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Burnt</div>
            <div className="font-medium flex items-center justify-center gap-1">🔥 100%</div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Rug %</div>
            <div className="font-medium">0%</div>
          </div>
        </div>

        {score.renounced && (
          <Badge variant="secondary" className="text-xs">
            Contract Renounced
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
