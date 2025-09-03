"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import type { SafetyScore, TokenSecurity } from "@/lib/types"

interface SafetyScoreCardProps {
  score: SafetyScore
  tokenSecurity?: TokenSecurity | null
}

export function SafetyScoreCard({ score, tokenSecurity }: SafetyScoreCardProps) {
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
            <div className="text-muted-foreground mb-1">Honeypot</div>
            <div className={`font-medium ${score.honeypot ? 'text-red-400' : 'text-green-400'}`}>
              {score.honeypot ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Buy Tax</div>
            <div className={`font-medium ${score.buyTaxPct > 10 ? 'text-red-400' : score.buyTaxPct > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
              {score.buyTaxPct}%
            </div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Sell Tax</div>
            <div className={`font-medium ${score.sellTaxPct > 10 ? 'text-red-400' : score.sellTaxPct > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
              {score.sellTaxPct}%
            </div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Verified</div>
            <div className={`font-medium ${score.verified ? 'text-green-400' : 'text-red-400'}`}>
              {score.verified ? 'Yes' : 'No'}
            </div>
          </div>

          {/* Row 2 */}
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Blacklist</div>
            <div className={`font-medium ${(tokenSecurity?.blacklist) ? 'text-red-400' : 'text-green-400'}`}>
              {(tokenSecurity?.blacklist) ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">NoMint</div>
            <div className="font-medium">
              <CheckCircle className={`h-3 w-3 mx-auto ${(tokenSecurity?.noMint) ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Burnt</div>
            <div className="font-medium flex items-center justify-center gap-1">
              🔥 {tokenSecurity?.canBurn ? '100%' : '0%'}
            </div>
          </div>
          <div className="bg-card/50 border border-border rounded p-2 text-center">
            <div className="text-muted-foreground mb-1">Renounced</div>
            <div className={`font-medium ${score.renounced ? 'text-green-400' : 'text-red-400'}`}>
              {score.renounced ? 'Yes' : 'No'}
            </div>
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
