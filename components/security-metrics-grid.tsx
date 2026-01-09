import { Check, X, AlertTriangle, Percent, Ban, ShieldCheck, Flame } from "lucide-react"
import type { TokenSecurity } from "@/lib/types"

interface SecurityMetric {
  label: string
  value: string
  status: "good" | "bad" | "neutral"
  icon?: "check" | "x"
  type: "honeypot" | "sellTax" | "buyTax" | "blacklist" | "noMint" | "burnt"
}

interface SecurityMetricsGridProps {
  tokenSecurity?: TokenSecurity
  isLoading?: boolean
  mode?: "score" | "grid"
}

export function SecurityMetricsGrid({ tokenSecurity, isLoading = false, mode = "score" }: SecurityMetricsGridProps) {
  console.log('SecurityMetricsGrid render:', { tokenSecurity, isLoading })
  
  const getSecurityMetrics = (): SecurityMetric[] => {
    if (isLoading || !tokenSecurity) {
      return [
        { label: "Honeypot", value: "...", status: "neutral", type: "honeypot" },
        { label: "Sell Tax", value: "...", status: "neutral", type: "sellTax" },
        { label: "Buy Tax", value: "...", status: "neutral", type: "buyTax" },
        { label: "Blacklist", value: "...", status: "neutral", type: "blacklist" },
        { label: "NoMint", value: "...", status: "neutral", type: "noMint" },
        { label: "Burnt", value: "...", status: "neutral", type: "burnt" },
      ]
    }

    return [
      {
        label: "Honeypot",
        value: tokenSecurity.honeypot ? "Fail" : "Pass",
        status: tokenSecurity.honeypot ? "bad" : "good",
        icon: tokenSecurity.honeypot ? "x" : "check",
        type: "honeypot"
      },
      {
        label: "Sell Tax",
        value: `${Number(tokenSecurity.sellTax ?? 0).toFixed(1)}%`,
        status: Number(tokenSecurity.sellTax ?? 0) > 10 ? "bad" : Number(tokenSecurity.sellTax ?? 0) > 5 ? "neutral" : "good",
        icon: Number(tokenSecurity.sellTax ?? 0) > 10 ? "x" : "check",
        type: "sellTax"
      },
      {
        label: "Buy Tax",
        value: `${Number(tokenSecurity.buyTax ?? 0).toFixed(1)}%`,
        status: Number(tokenSecurity.buyTax ?? 0) > 10 ? "bad" : Number(tokenSecurity.buyTax ?? 0) > 5 ? "neutral" : "good",
        icon: Number(tokenSecurity.buyTax ?? 0) > 10 ? "x" : "check",
        type: "buyTax"
      },
      {
        label: "Blacklist",
        value: tokenSecurity.blacklist ? "Yes" : "No",
        status: tokenSecurity.blacklist ? "bad" : "good",
        icon: tokenSecurity.blacklist ? "x" : "check",
        type: "blacklist"
      },
      {
        label: "NoMint",
        value: tokenSecurity.noMint ? "Yes" : "No",
        status: tokenSecurity.noMint ? "good" : "bad",
        icon: tokenSecurity.noMint ? "check" : "x",
        type: "noMint"
      },
      {
        label: "Burnt",
        value: tokenSecurity.canBurn ? "No" : "Yes",
        status: tokenSecurity.canBurn ? "bad" : "good",
        icon: tokenSecurity.canBurn ? "x" : "check",
        type: "burnt"
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

  const getMetricIcon = (type: SecurityMetric["type"], status: SecurityMetric["status"]) => {
    const color =
      status === "good"
        ? "text-[color:var(--buy)]"
        : status === "bad"
        ? "text-[color:var(--sell)]"
        : "text-yellow-500"
    switch (type) {
      case "honeypot":
        return <AlertTriangle className={`h-3 w-3 ${color}`} />
      case "sellTax":
      case "buyTax":
        return <Percent className={`h-3 w-3 ${color}`} />
      case "blacklist":
        return <Ban className={`h-3 w-3 ${color}`} />
      case "noMint":
        return <ShieldCheck className={`h-3 w-3 ${color}`} />
      case "burnt":
        return <Flame className={`h-3 w-3 ${color}`} />
      default:
        return null
    }
  }

  if (mode === "grid") {
    return (
      <div className="px-3 pb-3">
        <div className="grid grid-cols-3 grid-rows-2 gap-0 border border-border/80 divide-x divide-y divide-border/70 rounded-sm overflow-hidden">
          {securityMetrics.map((metric, index) => (
            <div key={index} className="text-center min-h-[64px] flex flex-col justify-center bg-muted/20 px-3">
              <div className="text-[11px] text-[#97A3B6] mb-1 uppercase tracking-wide">
                {metric.label}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-medium">
                {getMetricIcon(metric.type, metric.status)}
                <span className={
                  metric.status === "good" ? "text-[color:var(--buy)]" :
                  metric.status === "bad" ? "text-[color:var(--sell)]" :
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

  return (
    <div className="p-3">
      <div className="flex gap-3 h-20">
        <div className="px-3 neon-badge min-w-[60px] flex items-center justify-center h-full relative overflow-hidden">
          {isLoading ? "..." : safetyScore}
        </div>
        <div className="flex flex-col justify-center h-full">
          <div className="text-sm font-bold text-white mb-1 uppercase tracking-wide font-mono">Safety Score</div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full border border-border/50 flex items-center justify-center">
                {tokenSecurity?.isProxy ? (
                  <X className="h-2.5 w-2.5 text-[color:var(--sell)]" />
                ) : (
                  <Check className="h-2.5 w-2.5 text-[color:var(--buy)]" />
                )}
              </div>
              <div className={`text-xs ${tokenSecurity?.isProxy ? 'text-[color:var(--sell)]' : 'text-[color:var(--buy)]'}`}>
                Contract {tokenSecurity?.isProxy ? 'Proxy' : 'Verified'}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full border border-border/50 flex items-center justify-center">
                {tokenSecurity?.hasRenounced ? (
                  <Check className="h-2.5 w-2.5 text-[color:var(--buy)]" />
                ) : (
                  <X className="h-2.5 w-2.5 text-[color:var(--sell)]" />
                )}
              </div>
              <div className={`text-xs ${tokenSecurity?.hasRenounced ? 'text-[color:var(--buy)]' : 'text-[color:var(--sell)]'}`}>
                Contract {tokenSecurity?.hasRenounced ? 'Renounced' : 'Not Renounced'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
