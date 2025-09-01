import { Check, X } from "lucide-react"
import type { TokenSecurity } from "@/lib/types"

interface SecurityMetric {
  label: string
  value: string
  status: "good" | "bad" | "neutral"
  icon?: "check" | "x"
}

interface SecurityMetricsGridProps {
  tokenSecurity?: TokenSecurity
  isLoading?: boolean
}

export function SecurityMetricsGrid({ tokenSecurity, isLoading = false }: SecurityMetricsGridProps) {
  const getSecurityMetrics = (): SecurityMetric[] => {
    if (isLoading || !tokenSecurity) {
      return [
        { label: "Honeypot", value: "...", status: "neutral" },
        { label: "Sell Tax", value: "...", status: "neutral" },
        { label: "Buy Tax", value: "...", status: "neutral" },
        { label: "Blacklist", value: "...", status: "neutral" },
        { label: "NoMint", value: "...", status: "neutral" },
        { label: "Burnt", value: "...", status: "neutral" },
      ]
    }

    return [
      {
        label: "Honeypot",
        value: tokenSecurity.honeypot ? "Fail" : "Pass",
        status: tokenSecurity.honeypot ? "bad" : "good",
        icon: tokenSecurity.honeypot ? "x" : "check"
      },
      {
        label: "Sell Tax",
        value: `${tokenSecurity.sellTax.toFixed(1)}%`,
        status: tokenSecurity.sellTax > 10 ? "bad" : tokenSecurity.sellTax > 5 ? "neutral" : "good",
        icon: tokenSecurity.sellTax > 10 ? "x" : "check"
      },
      {
        label: "Buy Tax",
        value: `${tokenSecurity.buyTax.toFixed(1)}%`,
        status: tokenSecurity.buyTax > 10 ? "bad" : tokenSecurity.buyTax > 5 ? "neutral" : "good",
        icon: tokenSecurity.buyTax > 10 ? "x" : "check"
      },
      {
        label: "Blacklist",
        value: tokenSecurity.blacklist ? "Yes" : "No",
        status: tokenSecurity.blacklist ? "bad" : "good",
        icon: tokenSecurity.blacklist ? "x" : "check"
      },
      {
        label: "NoMint",
        value: tokenSecurity.noMint ? "Yes" : "No",
        status: tokenSecurity.noMint ? "good" : "bad",
        icon: tokenSecurity.noMint ? "check" : "x"
      },
      {
        label: "Burnt",
        value: tokenSecurity.canBurn ? "No" : "Yes",
        status: tokenSecurity.canBurn ? "bad" : "good",
        icon: tokenSecurity.canBurn ? "x" : "check"
      },
    ]
  }

  const calculateSafetyScore = (): number => {
    if (!tokenSecurity) return 0

    let score = 100
    
    // Deduct points for security issues
    if (tokenSecurity.honeypot) score -= 50
    if (tokenSecurity.blacklist) score -= 30
    if (!tokenSecurity.noMint) score -= 20
    if (tokenSecurity.canBurn) score -= 15
    if (tokenSecurity.buyTax > 10) score -= 20
    else if (tokenSecurity.buyTax > 5) score -= 10
    if (tokenSecurity.sellTax > 10) score -= 20
    else if (tokenSecurity.sellTax > 5) score -= 10
    if (tokenSecurity.isProxy) score -= 10
    if (!tokenSecurity.hasRenounced) score -= 15

    return Math.max(0, Math.min(100, score))
  }

  const securityMetrics = getSecurityMetrics()
  const safetyScore = calculateSafetyScore()
  return (
    <div className="bg-card border border-[#1E1E1E] rounded-sm p-4 mb-6">
      <div className="flex gap-3 mb-4 pb-3 border-b border-[#1E1E1E] h-20">
        <div className="px-3 neon-badge min-w-[60px] flex items-center justify-center h-full relative overflow-hidden">
          {isLoading ? "..." : safetyScore}
        </div>
        <div className="flex flex-col justify-center h-full">
          <div className="text-sm font-bold text-white mb-1 uppercase tracking-wide font-mono">Aegis Safety Score</div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                {tokenSecurity?.isProxy ? (
                  <X className="h-1.5 w-1.5 text-red-500" />
                ) : (
                  <Check className="h-1.5 w-1.5 text-yellow-500" />
                )}
              </div>
              <div className={`text-xs ${tokenSecurity?.isProxy ? 'text-red-500/70' : 'text-yellow-500/70'}`}>
                Contract {tokenSecurity?.isProxy ? 'Proxy' : 'Verified'}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                {tokenSecurity?.hasRenounced ? (
                  <Check className="h-1.5 w-1.5 text-yellow-500" />
                ) : (
                  <X className="h-1.5 w-1.5 text-red-500" />
                )}
              </div>
              <div className={`text-xs ${tokenSecurity?.hasRenounced ? 'text-yellow-500/70' : 'text-red-500/70'}`}>
                Contract {tokenSecurity?.hasRenounced ? 'Renounced' : 'Not Renounced'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 grid-rows-2 gap-3">
        {securityMetrics.map((metric, index) => (
          <div key={index} className="text-center min-h-[50px] flex flex-col justify-center">
            <div className="text-xs text-[#97A3B6] mb-1">{metric.label}</div>
            <div className="flex items-center justify-center gap-2 text-xs font-medium">
              {metric.icon === "check" && (
                <div className="w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-yellow-500" />
                </div>
              )}
              {metric.icon === "x" && (
                <div className="w-4 h-4 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                  <X className="h-2.5 w-2.5 text-red-500" />
                </div>
              )}
              <span className={
                metric.status === "good" ? "text-yellow-500" :
                metric.status === "bad" ? "text-red-400" :
                "text-gray-400"
              }>
                {metric.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
