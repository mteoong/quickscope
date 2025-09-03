import type { TokenSecurity, SafetyScore } from '../types'

/**
 * Calculate safety score from token security data
 */
export function calculateSafetyScore(security: TokenSecurity | null | undefined): SafetyScore {
  if (!security) {
    // Return default score when no security data
    return {
      score: 0,
      verified: false,
      renounced: false,
      honeypot: true, // Assume worst case when no data
      buyTaxPct: 100,
      sellTaxPct: 100,
      bullets: [0, 0, 0, 0]
    }
  }

  let score = 99 // Start with perfect score, deduct points for issues

  // Deduct points for each security issue
  if (security.honeypot) score -= 30 // Major red flag
  if (security.buyTax > 10) score -= 15 // High buy tax
  else if (security.buyTax > 5) score -= 8 // Medium buy tax
  else if (security.buyTax > 0) score -= 3 // Low buy tax

  if (security.sellTax > 10) score -= 15 // High sell tax
  else if (security.sellTax > 5) score -= 8 // Medium sell tax
  else if (security.sellTax > 0) score -= 3 // Low sell tax

  if (security.blacklist) score -= 20 // Blacklist function exists
  if (!security.noMint) score -= 10 // Can still mint new tokens
  if (!security.canBurn) score -= 5 // Cannot burn tokens
  if (!security.hasRenounced) score -= 8 // Ownership not renounced
  if (security.isProxy) score -= 10 // Proxy contract (can be upgraded)

  // Ensure score doesn't go below 0
  score = Math.max(0, score)

  // Calculate individual bullet scores
  const bullets = [
    security.honeypot ? 0 : 99, // Honeypot check
    security.buyTax === 0 && security.sellTax === 0 ? 99 : Math.max(0, 99 - (security.buyTax + security.sellTax) * 2), // Tax score
    security.blacklist ? 0 : 99, // Blacklist check
    (security.noMint && security.hasRenounced) ? 99 : 50 // Contract security
  ]

  return {
    score,
    verified: true, // We have security data, so it's "verified"
    renounced: security.hasRenounced,
    honeypot: security.honeypot,
    buyTaxPct: security.buyTax,
    sellTaxPct: security.sellTax,
    bullets
  }
}